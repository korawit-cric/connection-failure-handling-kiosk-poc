'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  kioskApi,
  type Snapshot,
  type CartLine,
  type Quote,
  type PaymentResult,
  type OutboxEvent,
  type MenuItem,
  type PayRequest,
} from '@repo/api-client';
import { request, verifySnapshot, ApiError } from '../services/kiosk.service';
type Connection = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'RECOVERING';
type Local = {
  menu: Snapshot | null;
  cart: CartLine[];
  outbox: OutboxEvent[];
  pendingQuote: string | null;
  pendingMode?: PayRequest['mode'];
  payment: PaymentResult | null;
  logs: string[];
  syncedAt: string | null;
};
const empty: Local = {
  menu: null,
  cart: [],
  outbox: [],
  pendingQuote: null,
  payment: null,
  logs: [],
  syncedAt: null,
};
const storageKey = 'relay-kiosk-v1';
const money = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 2,
  }).format(n / 100);
export function KioskLab() {
  const queryClient = useQueryClient();
  const hq = useQuery({
    queryKey: ['hq-menu'],
    queryFn: () => request(kioskApi.menu()),
    refetchInterval: 4000,
    retry: 1,
  });
  const versions = useQuery({
    queryKey: ['versions'],
    queryFn: () => request(kioskApi.versions()),
    refetchInterval: 4000,
  });
  const payments = useQuery({
    queryKey: ['payments'],
    queryFn: () => request(kioskApi.payments()),
    refetchInterval: 4000,
  });
  const [local, setLocal] = useState<Local>(empty);
  const current = useRef(local);
  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState(false);
  const offlineRef = useRef(false);
  const [connection, setConnection] = useState<Connection>('RECOVERING');
  const [busy, setBusy] = useState(false);
  const syncing = useRef(false);
  const operating = useRef(false);
  const failures = useRef(0);
  const nextRetry = useRef(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [mode, setMode] = useState<PayRequest['mode']>('success');
  const [category, setCategory] = useState('All items');
  const [draft, setDraft] = useState<MenuItem[] | null>(null);
  const [base, setBase] = useState(0);
  const [corrupt, setCorrupt] = useState(false);
  const corruptRef = useRef(false);
  function save(update: Partial<Local>) {
    const value = { ...current.current, ...update };
    localStorage.setItem(storageKey, JSON.stringify(value));
    current.current = value;
    setLocal(value);
  }
  function log(message: string, update: Partial<Local> = {}) {
    save({
      ...update,
      logs: [
        `${new Date().toLocaleTimeString()} · ${message}`,
        ...current.current.logs,
      ].slice(0, 35),
    });
  }
  useEffect(() => {
    try {
      const disconnected = localStorage.getItem('relay-wan-offline') === 'true';
      offlineRef.current = disconnected;
      setOffline(disconnected);
      if (disconnected) setConnection('OFFLINE');
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const value = JSON.parse(stored) as Local;
        if (
          !Array.isArray(value.cart) ||
          !Array.isArray(value.outbox) ||
          !Array.isArray(value.logs)
        )
          throw new Error('Invalid local data');
        current.current = value;
        setLocal(value);
      }
      setReady(true);
    } catch {
      setError(
        'Local storage unavailable or damaged. Enable storage before using this kiosk.',
      );
    }
  }, []);
  async function kioskRequest<T>(endpoint: Parameters<typeof request<T>>[0]) {
    if (offlineRef.current) throw new Error('Kiosk WAN is disconnected');
    const result = await request(endpoint);
    if (offlineRef.current)
      throw new Error('Kiosk WAN disconnected during request');
    return result;
  }
  async function sync(force = false) {
    if (
      !ready ||
      offlineRef.current ||
      syncing.current ||
      operating.current ||
      (!force && Date.now() < nextRetry.current)
    )
      return;
    syncing.current = true;
    try {
      setConnection((previous) =>
        previous === 'ONLINE' && !failures.current ? previous : 'RECOVERING',
      );
      // Reuse the saved quote even when the previous HTTP response was lost.
      if (current.current.pendingQuote) {
        let result = await kioskRequest(
          kioskApi.pay({
            quoteId: current.current.pendingQuote,
            mode: current.current.pendingMode || 'success',
          }),
        );
        if (result.status === 'UNKNOWN')
          result = await kioskRequest(kioskApi.reconcile(result.id));
        log(`Payment reconciled: ${result.status}`, {
          payment: result,
          pendingQuote: null,
          ...(result.status === 'PAID' ? { cart: [] } : {}),
        });
        setQuote(null);
        await queryClient.invalidateQueries({ queryKey: ['payments'] });
      }
      const revision = await kioskRequest(kioskApi.revision());
      if (
        current.current.menu &&
        revision.version < current.current.menu.version
      )
        throw new Error('Rejected menu version regression');
      if (
        revision.version !== current.current.menu?.version ||
        corruptRef.current
      ) {
        const downloaded = await kioskRequest(kioskApi.menu());
        if (corruptRef.current) downloaded.checksum = 'corrupt';
        await verifySnapshot(downloaded);
        if (
          current.current.menu &&
          downloaded.version < current.current.menu.version
        )
          throw new Error('Rejected menu version regression');
        if (current.current.menu && current.current.cart.length)
          setNotice(
            `Menu v${downloaded.version} received. Review your cart at the updated prices before checkout.`,
          );
        log(`Verified SHA-256 · activated menu v${downloaded.version}`, {
          menu: downloaded,
        });
      }
      const batch = current.current.outbox.slice(0, 100);
      if (batch.length) {
        const ack = await kioskRequest(kioskApi.events(batch));
        log(`Acknowledged ${ack.accepted.length} durable events`, {
          outbox: current.current.outbox.filter(
            (e) => !ack.accepted.includes(e.id),
          ),
        });
      }
      save({ syncedAt: new Date().toISOString() });
      if (failures.current) setError('');
      failures.current = 0;
      nextRetry.current = 0;
      setConnection('ONLINE');
    } catch (e) {
      failures.current++;
      nextRetry.current =
        Date.now() +
        Math.min(30000, 1000 * 2 ** failures.current) +
        Math.random() * 1000;
      setConnection(
        offlineRef.current || failures.current >= 3 ? 'OFFLINE' : 'DEGRADED',
      );
      setError(e instanceof Error ? e.message : 'Recovery failed');
      if (
        e instanceof ApiError &&
        (e.status === 409 || e.status === 404) &&
        current.current.pendingQuote
      ) {
        log('Uncharged quote rejected; validate again', { pendingQuote: null });
        setQuote(null);
      }
    } finally {
      syncing.current = false;
    }
  }
  const syncLatest = useRef(sync);
  useEffect(() => {
    syncLatest.current = sync;
  });
  useEffect(() => {
    if (!ready) return;
    void syncLatest.current(true);
    const timer = setInterval(() => void syncLatest.current(), 3000);
    return () => clearInterval(timer);
  }, [ready, offline]);
  function toggleConnection() {
    const value = !offline;
    try {
      localStorage.setItem('relay-wan-offline', String(value));
    } catch {
      setError('Unable to persist simulation state');
      return;
    }
    offlineRef.current = value;
    setOffline(value);
    setConnection(value ? 'OFFLINE' : 'RECOVERING');
    setError('');
    setQuote(null);
    log(
      value
        ? 'WAN disconnected · local menu and cart remain available'
        : 'WAN restored · beginning recovery',
    );
  }
  function cartChange(id: string, delta: number) {
    if (current.current.pendingQuote) return;
    try {
      const cart = current.current.cart.map((i) => ({ ...i }));
      const line = cart.find((i) => i.id === id);
      if (line) line.quantity = Math.min(20, line.quantity + delta);
      else if (delta > 0) cart.push({ id, quantity: 1 });
      const items = cart.filter((i) => i.quantity > 0);
      const event: OutboxEvent = {
        id: crypto.randomUUID(),
        type: 'CART_UPDATED',
        createdAt: new Date().toISOString(),
        items,
      };
      save({
        cart: items,
        outbox: [...current.current.outbox, event],
        payment: null,
      });
      setQuote(null);
      setNotice('');
    } catch {
      setError('Could not persist cart. Check local storage capacity.');
    }
  }
  async function action(fn: () => Promise<void>) {
    operating.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Operation failed');
    } finally {
      operating.current = false;
      setBusy(false);
    }
  }
  async function publish(items: MenuItem[], baseVersion: number) {
    await action(async () => {
      const snapshot = await request(kioskApi.publish({ items, baseVersion }));
      setDraft(null);
      setNotice(
        `HQ published v${snapshot.version}. ${offline ? 'Kiosk stays on its cached version.' : 'Kiosk will sync automatically.'}`,
      );
      await queryClient.invalidateQueries({ queryKey: ['hq-menu'] });
      await queryClient.invalidateQueries({ queryKey: ['versions'] });
    });
  }
  const cachedTotal = local.cart.reduce(
    (sum, line) =>
      sum +
      (local.menu?.items.find((i) => i.id === line.id)?.price || 0) *
        line.quantity,
    0,
  );
  const lag = hq.data && local.menu ? hq.data.version - local.menu.version : 0;
  const canCheckout =
    connection === 'ONLINE' && !offline && !local.pendingQuote;
  return (
    <main className="lab">
      <header className="topbar">
        <Link className="brand" href="/">
          ▦{' '}
          <span>
            relay<span className="brand-dot">.</span>
          </span>
        </Link>
        <span className="top-label">RETAIL SYSTEMS LAB</span>
        <div className="top-right">
          <span className="demo-tag">INTERACTIVE DEMO</span>
          <span>Store 01 / Bangkok</span>
          <span className="avatar">KS</span>
        </div>
      </header>
      <section className="intro">
        <div>
          <div className="eyebrow">HQ → STORE → KIOSK</div>
          <h1>Keep serving. Stay in sync.</h1>
          <p>Explore what happens when the connection doesn’t cooperate.</p>
        </div>
        <div className="environment">
          <span className="dot" /> Local development{' '}
          <small>Next.js · NestJS · PostgreSQL</small>
        </div>
      </section>
      <section className="metrics">
        <div>
          <span>KIOSK CONNECTION</span>
          <strong className={connection === 'ONLINE' ? 'green' : 'amber'}>
            <i className="dot" />
            {connection.toLowerCase()}
          </strong>
          <small>
            {offline
              ? 'Simulated WAN outage'
              : 'Service health + recovery checks'}
          </small>
        </div>
        <div>
          <span>ACTIVE MENU</span>
          <strong>
            {local.menu ? `v${local.menu.version}` : '—'}{' '}
            <em>
              {lag > 0
                ? `${lag} version${lag > 1 ? 's' : ''} behind`
                : 'Last-known-good'}
            </em>
          </strong>
          <small>Checksum verified before activation</small>
        </div>
        <div>
          <span>LOCAL OUTBOX</span>
          <strong>
            {local.outbox.length} <em>events pending</em>
          </strong>
          <small>Durable · deduplicated at HQ</small>
        </div>
        <div>
          <span>PAYMENT SAFETY</span>
          <strong>
            {local.pendingQuote ? 'Checking outcome' : 'Protected'}{' '}
            <span className="shield">◇</span>
          </strong>
          <small>Server quotes · stable payment identity</small>
        </div>
      </section>
      <section className="simulation">
        <div>
          <span className="sim-icon">⌁</span>
          <div>
            <b>Connection simulator</b>
            <p>
              Disconnect the kiosk. Publish at HQ. Reconnect and watch recovery.
            </p>
          </div>
        </div>
        <div className="sim-controls">
          <label>
            <input
              type="checkbox"
              checked={corrupt}
              onChange={(e) => {
                setCorrupt(e.target.checked);
                corruptRef.current = e.target.checked;
              }}
            />{' '}
            Corrupt download
          </label>
          <button
            className={offline ? 'primary' : 'disconnect'}
            onClick={toggleConnection}
            disabled={!ready}
          >
            {offline ? '↻ Restore connection' : '⌁ Disconnect kiosk'}
          </button>
          <button
            className="subtle"
            onClick={() => void sync(true)}
            disabled={offline || busy}
          >
            Sync now ↗
          </button>
        </div>
      </section>
      {(error || notice) && (
        <div role="status" className={error ? 'message error' : 'message'}>
          {error || notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => {
              setError('');
              setNotice('');
            }}
          >
            ×
          </button>
        </div>
      )}
      <div className="workspace">
        <section className="panel kiosk">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">CUSTOMER EXPERIENCE</span>
              <h2>
                Kiosk <span className="muted">/ 01</span>
              </h2>
            </div>
            <span
              className={`pill ${connection === 'ONLINE' ? 'good' : 'warn'}`}
            >
              {connection === 'ONLINE' ? '● Connected' : '● Cached mode'}
            </span>
          </div>
          {connection !== 'ONLINE' && (
            <div className="offline-banner">
              {local.menu
                ? `Browsing saved menu v${local.menu.version}. Your cart is safe here.`
                : 'Connect to HQ once to download your first menu.'}{' '}
              <b>Payments paused.</b>
            </div>
          )}
          <div className="kiosk-content">
            <div className="menu-area">
              <div className="menu-title">
                <h3>Something good, anytime.</h3>
                <p>Fresh favorites from the neighborhood kitchen.</p>
              </div>
              <nav className="categories">
                {['All items', 'Kitchen', 'Sides', 'Drinks'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={c === category ? 'selected' : ''}
                  >
                    {c}
                  </button>
                ))}
              </nav>
              <div className="menu-grid">
                {local.menu?.items
                  .filter(
                    (i) => category === 'All items' || i.category === category,
                  )
                  .map((item) => (
                    <button
                      className={`product ${!item.available ? 'sold-out' : ''}`}
                      key={item.id}
                      disabled={!item.available || !!local.pendingQuote || busy}
                      onClick={() => cartChange(item.id, 1)}
                    >
                      <div
                        className={`food-art ${item.category.toLowerCase()}`}
                      >
                        <span>{item.icon}</span>
                        <small>{item.category}</small>
                      </div>
                      <div className="product-copy">
                        <h4>{item.name}</h4>
                        <p>{item.description}</p>
                        <div>
                          <b>{money(item.price)}</b>
                          <span className="add">
                            {item.available ? '+' : 'Sold out'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
              {!local.menu && (
                <div className="empty">
                  Waiting for a verified menu from HQ…
                </div>
              )}
            </div>
            <aside className="cart">
              <div className="cart-heading">
                <h3>Your order</h3>
                <span>{local.cart.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
              <p className="muted">Saved on this kiosk</p>
              <div className="cart-lines">
                {local.cart.length === 0 ? (
                  <div className="empty">
                    <span>▤</span>
                    <b>A little hungry?</b>
                    <p>Add something from the menu.</p>
                  </div>
                ) : (
                  local.cart.map((line) => (
                    <div className="cart-line" key={line.id}>
                      <b>
                        {local.menu?.items.find((i) => i.id === line.id)
                          ?.name || line.id}
                      </b>
                      <div>
                        <span>
                          {money(
                            (local.menu?.items.find((i) => i.id === line.id)
                              ?.price || 0) * line.quantity,
                          )}
                        </span>
                        <div className="stepper">
                          <button
                            disabled={busy || !!local.pendingQuote}
                            onClick={() => cartChange(line.id, -1)}
                            aria-label={`Remove one ${line.id}`}
                          >
                            −
                          </button>
                          {line.quantity}
                          <button
                            disabled={busy || !!local.pendingQuote}
                            onClick={() => cartChange(line.id, 1)}
                            aria-label={`Add one ${line.id}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="cart-bottom">
                <div className="total">
                  <span>Estimated total</span>
                  <b>{money(cachedTotal)}</b>
                </div>
                <p>THB · final price validated with HQ</p>
                {quote && (
                  <div className="quote">
                    <b>HQ quote · v{quote.menuVersion}</b>
                    <strong>{money(quote.total)}</strong>
                    <small>
                      {quote.total !== cachedTotal
                        ? 'Price changed. Review before accepting.'
                        : 'Price confirmed by HQ.'}{' '}
                      Valid until{' '}
                      {new Date(quote.expiresAt).toLocaleTimeString()}.
                    </small>
                    {quote.items.map((i) => (
                      <small key={i.id}>
                        {i.quantity} × {i.name} · {money(i.price * i.quantity)}
                      </small>
                    ))}
                  </div>
                )}
                <label className="payment-label">
                  Mock gateway outcome
                  <select
                    value={mode}
                    disabled={busy || !!local.pendingQuote}
                    onChange={(e) =>
                      setMode(e.target.value as PayRequest['mode'])
                    }
                  >
                    <option value="success">Successful payment</option>
                    <option value="timeout">Charged · response lost</option>
                    <option value="decline">Payment declined</option>
                  </select>
                </label>
                {!quote ? (
                  <button
                    className="primary checkout"
                    disabled={!canCheckout || !local.cart.length || busy}
                    onClick={() =>
                      void action(async () => {
                        setQuote(
                          await kioskRequest(
                            kioskApi.quote({
                              items: current.current.cart,
                              localVersion: current.current.menu!.version,
                            }),
                          ),
                        );
                      })
                    }
                  >
                    {busy ? 'Validating…' : 'Validate checkout →'}
                  </button>
                ) : (
                  <button
                    className="primary checkout"
                    disabled={!canCheckout || busy}
                    onClick={() =>
                      void action(async () => {
                        save({ pendingQuote: quote.id, pendingMode: mode });
                        const result = await kioskRequest(
                          kioskApi.pay({ quoteId: quote.id, mode }),
                        );
                        log(`Gateway returned ${result.status}`, {
                          payment: result,
                          ...(result.status === 'UNKNOWN'
                            ? {}
                            : { pendingQuote: null }),
                          ...(result.status === 'PAID' ? { cart: [] } : {}),
                        });
                        setQuote(null);
                        await queryClient.invalidateQueries({
                          queryKey: ['payments'],
                        });
                      })
                    }
                  >
                    Accept {money(quote.total)} & pay →
                  </button>
                )}
                {local.pendingQuote && (
                  <div className="payment-status">
                    Checking payment outcome. Do not start another payment.
                    <button onClick={() => void sync(true)} disabled={offline}>
                      Reconcile payment ↗
                    </button>
                  </div>
                )}
                {local.payment && !local.pendingQuote && (
                  <div
                    className={`payment-status ${local.payment.status === 'PAID' ? 'green' : ''}`}
                  >
                    {local.payment.status === 'PAID'
                      ? '✓ Payment confirmed. Order complete.'
                      : 'Payment declined. Validate again to retry.'}
                  </div>
                )}
                <small className="lock-note">
                  ◇{' '}
                  {canCheckout
                    ? 'Payment confirmed by the backend'
                    : 'Reconnect and finish recovery to pay'}
                </small>
              </div>
            </aside>
          </div>
          <footer className="panel-footer">
            <span>◉ Local persistence enabled</span>
            <span>
              {local.syncedAt
                ? `Last sync ${new Date(local.syncedAt).toLocaleTimeString()}`
                : 'Waiting for first sync'}
            </span>
          </footer>
        </section>
        <aside className="hq-column">
          <section className="panel hq">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">CONTROL CENTER</span>
                <h2>Headquarters</h2>
              </div>
              <span className="pill neutral">
                {hq.data ? `v${hq.data.version}` : 'Unavailable'}
              </span>
            </div>
            <div className="hq-body">
              <p>
                HQ owns menu names, prices and availability. Publish a complete
                snapshot to every connected kiosk.
              </p>
              {hq.error && (
                <div className="message error">
                  HQ API unavailable. Start PostgreSQL and the Nest API.
                </div>
              )}
              <div className="editor-label">
                <span>MENU ITEM</span>
                <span>PRICE (THB) / LIVE</span>
              </div>
              {(draft || hq.data?.items || []).map((item, index) => (
                <div className="editor-row" key={item.id}>
                  <span>
                    {item.icon} {item.name}
                  </span>
                  <input
                    aria-label={`${item.name} price`}
                    type="number"
                    min="0"
                    step="1"
                    value={item.price / 100}
                    onChange={(e) => {
                      const next = (draft || hq.data!.items).map((i) => ({
                        ...i,
                      }));
                      next[index]!.price = Math.round(
                        Number(e.target.value) * 100,
                      );
                      setDraft(next);
                      if (!draft) setBase(hq.data!.version);
                    }}
                  />
                  <input
                    type="checkbox"
                    aria-label={`${item.name} available`}
                    checked={item.available}
                    onChange={(e) => {
                      const next = (draft || hq.data!.items).map((i) => ({
                        ...i,
                      }));
                      next[index]!.available = e.target.checked;
                      setDraft(next);
                      if (!draft) setBase(hq.data!.version);
                    }}
                  />
                </div>
              ))}
              <button
                className="publish"
                disabled={!draft || busy}
                onClick={() => draft && void publish(draft, base)}
              >
                Publish menu version ↑
              </button>
              <div className="version-history">
                <h4>
                  Version history <span>Immutable snapshots</span>
                </h4>
                {versions.data?.slice(0, 4).map((v) => (
                  <div key={v.version}>
                    <b>v{v.version}</b>
                    <span>
                      {new Date(v.createdAt).toLocaleTimeString()}{' '}
                      <small>{v.checksum.slice(0, 8)}</small>
                    </span>
                    {v.version === hq.data?.version ? (
                      <em>Latest</em>
                    ) : (
                      <button
                        disabled={busy}
                        onClick={() =>
                          hq.data && void publish(v.items, hq.data.version)
                        }
                      >
                        Restore as new
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="panel activity">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">OBSERVABILITY</span>
                <h2>Sync activity</h2>
              </div>
              <span className="live-dot" />
            </div>
            <div className="activity-list">
              {local.logs.length ? (
                local.logs.slice(0, 7).map((entry, i) => (
                  <div key={`${entry}-${i}`}>
                    <i />
                    {entry}
                  </div>
                ))
              ) : (
                <p className="muted">
                  Recovery and synchronization events appear here.
                </p>
              )}
            </div>
          </section>
          <section className="panel ledger">
            <h3>
              Payment ledger <span>HQ authority</span>
            </h3>
            {payments.data?.length ? (
              payments.data.slice(0, 4).map((p) => (
                <div key={p.id}>
                  <span>
                    {p.id.slice(0, 12)}…<small>{money(p.amount)}</small>
                  </span>
                  <b className={p.status === 'PAID' ? 'green' : 'amber'}>
                    {p.status}
                  </b>
                </div>
              ))
            ) : (
              <p className="muted">No payment attempts yet.</p>
            )}
          </section>
        </aside>
      </div>
      <footer className="page-footer">
        <span>RELAY / OFFLINE-FIRST RETAIL</span>
        <span>Browse offline. Validate online. Reconcile before retrying.</span>
      </footer>
    </main>
  );
}
