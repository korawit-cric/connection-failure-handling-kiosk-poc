import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import type {
  MenuItem,
  PublishRequest,
  QuoteRequest,
  PayRequest,
  OutboxEvent,
} from '@repo/api-client';
import { Prisma } from '@repo/prisma';
import { PrismaService } from '../prisma/prisma.service';
const initial: MenuItem[] = [
  {
    id: 'burger',
    name: 'Classic smash burger',
    category: 'Kitchen',
    description: 'Double smash patty, cheddar, house sauce',
    price: 15900,
    available: true,
    icon: '🍔',
  },
  {
    id: 'chicken',
    name: 'Crispy chicken burger',
    category: 'Kitchen',
    description: 'Golden chicken, slaw, smoked mayo',
    price: 14900,
    available: true,
    icon: '🥪',
  },
  {
    id: 'fries',
    name: 'Sea salt fries',
    category: 'Sides',
    description: 'Skin-on potatoes, flaky sea salt',
    price: 6900,
    available: true,
    icon: '🍟',
  },
  {
    id: 'salad',
    name: 'Garden bowl',
    category: 'Sides',
    description: 'Fresh greens, avocado, lemon dressing',
    price: 11900,
    available: true,
    icon: '🥗',
  },
  {
    id: 'coffee',
    name: 'Iced oat latte',
    category: 'Drinks',
    description: 'Double espresso, oat milk, over ice',
    price: 8900,
    available: true,
    icon: '☕',
  },
  {
    id: 'tea',
    name: 'Peach iced tea',
    category: 'Drinks',
    description: 'Brewed black tea, white peach',
    price: 5900,
    available: true,
    icon: '🍑',
  },
];
const json = (value: unknown) => value as Prisma.InputJsonValue;
@Injectable()
export class KioskService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}
  private get db() {
    return this.prisma.client;
  }
  async onModuleInit() {
    await this.lock(async (tx) => {
      if (!(await tx.menuSnapshot.count())) await this.snapshot(tx, initial);
    });
  }
  // One demo-wide lock makes publication, validation and payment creation serializable.
  private lock<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(825)`;
      return fn(tx);
    });
  }
  private snapshot(tx: Prisma.TransactionClient, items: MenuItem[]) {
    const checksum = createHash('sha256')
      .update(JSON.stringify(items))
      .digest('hex');
    return tx.menuSnapshot.create({ data: { items: json(items), checksum } });
  }
  revision() {
    return this.db.menuSnapshot.findFirstOrThrow({
      orderBy: { version: 'desc' },
      select: { version: true },
    });
  }
  menu() {
    return this.db.menuSnapshot.findFirstOrThrow({
      orderBy: { version: 'desc' },
    });
  }
  versions() {
    return this.db.menuSnapshot.findMany({
      orderBy: { version: 'desc' },
      take: 20,
    });
  }
  publish(body: PublishRequest) {
    if (
      !body ||
      !Number.isInteger(body.baseVersion) ||
      !Array.isArray(body.items) ||
      !body.items.length ||
      body.items.length > 100 ||
      new Set(body.items.map((i) => i?.id)).size !== body.items.length ||
      body.items.some(
        (i) =>
          !i ||
          typeof i.id !== 'string' ||
          !/^[a-z0-9-]{1,50}$/.test(i.id) ||
          typeof i.name !== 'string' ||
          !i.name.length ||
          i.name.length > 100 ||
          typeof i.description !== 'string' ||
          typeof i.category !== 'string' ||
          typeof i.icon !== 'string' ||
          !Number.isSafeInteger(i.price) ||
          i.price < 0 ||
          i.price > 10000000 ||
          typeof i.available !== 'boolean',
      )
    )
      throw new BadRequestException('Invalid menu snapshot');
    return this.lock(async (tx) => {
      const latest = await tx.menuSnapshot.findFirstOrThrow({
        orderBy: { version: 'desc' },
      });
      if (latest.version !== body.baseVersion)
        throw new ConflictException('HQ changed. Refresh before publishing.');
      return this.snapshot(
        tx,
        body.items.map(
          ({ id, name, category, description, price, available, icon }) => ({
            id,
            name,
            category,
            description,
            price,
            available,
            icon,
          }),
        ),
      );
    });
  }
  quote(body: QuoteRequest) {
    if (
      !body ||
      !Number.isInteger(body.localVersion) ||
      !Array.isArray(body.items) ||
      !body.items.length ||
      body.items.length > 100 ||
      body.items.some(
        (i) =>
          !i ||
          typeof i.id !== 'string' ||
          !Number.isInteger(i.quantity) ||
          i.quantity < 1 ||
          i.quantity > 20,
      ) ||
      new Set(body.items.map((i) => i?.id)).size !== body.items.length
    )
      throw new BadRequestException('Invalid cart');
    return this.lock(async (tx) => {
      const menu = await tx.menuSnapshot.findFirstOrThrow({
        orderBy: { version: 'desc' },
      });
      const catalog = menu.items as unknown as MenuItem[];
      const items = body.items.map((line) => {
        const item = catalog.find((i) => i.id === line.id);
        if (!item?.available)
          throw new ConflictException(
            `${item?.name || line.id} is unavailable. Remove it from the cart.`,
          );
        return { ...line, name: item.name, price: item.price };
      });
      return tx.checkoutQuote.create({
        data: {
          menuVersion: menu.version,
          items: json(items),
          total: items.reduce((s, i) => s + i.price * i.quantity, 0),
          expiresAt: new Date(Date.now() + 120000),
        },
      });
    });
  }
  pay(body: PayRequest) {
    if (
      !body ||
      typeof body.quoteId !== 'string' ||
      !['success', 'decline', 'timeout'].includes(body.mode)
    )
      throw new BadRequestException('Invalid payment request');
    return this.lock(async (tx) => {
      const existing = await tx.payment.findUnique({
        where: { quoteId: body.quoteId },
      });
      if (existing) return existing;
      const quote = await tx.checkoutQuote.findUnique({
        where: { id: body.quoteId },
      });
      if (!quote) throw new NotFoundException('Quote not found');
      const menu = await tx.menuSnapshot.findFirstOrThrow({
        orderBy: { version: 'desc' },
      });
      if (
        quote.expiresAt.getTime() < Date.now() ||
        quote.menuVersion !== menu.version
      )
        throw new ConflictException(
          'Quote expired or menu changed. Validate the cart again.',
        );
      // Durable mock provider ledger: providerStatus is the authoritative outcome.
      // The stable pay_<quoteId> identity and unique quoteId prevent duplicate charges.
      const payment = await tx.payment.create({
        data: {
          id: `pay_${quote.id}`,
          quoteId: quote.id,
          amount: quote.total,
          status: { timeout: 'UNKNOWN', decline: 'FAILED', success: 'PAID' }[
            body.mode
          ],
          providerStatus: body.mode === 'decline' ? 'DECLINED' : 'CAPTURED',
        },
      });
      if (payment.status === 'PAID')
        await tx.kioskOrder.create({
          data: {
            paymentId: payment.id,
            total: quote.total,
            items: json(quote.items),
          },
        });
      return payment;
    });
  }
  reconcile(id: string) {
    return this.lock(async (tx) => {
      const p = await tx.payment.findUnique({ where: { id } });
      if (!p) throw new NotFoundException('Payment not found');
      const result = await tx.payment.update({
        where: { id },
        data: { status: p.providerStatus === 'CAPTURED' ? 'PAID' : 'FAILED' },
      });
      if (result.status === 'PAID') {
        const quote = await tx.checkoutQuote.findUniqueOrThrow({
          where: { id: p.quoteId },
        });
        await tx.kioskOrder.upsert({
          where: { paymentId: id },
          create: {
            paymentId: id,
            total: quote.total,
            items: json(quote.items),
          },
          update: {},
        });
      }
      return result;
    });
  }
  payments() {
    return this.db.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }
  async events(events: OutboxEvent[]) {
    if (
      !Array.isArray(events) ||
      events.length > 100 ||
      events.some(
        (e) =>
          !e ||
          typeof e.id !== 'string' ||
          e.id.length > 100 ||
          e.type !== 'CART_UPDATED' ||
          !Array.isArray(e.items),
      )
    )
      throw new BadRequestException('Invalid outbox batch');
    await this.db.kioskEvent.createMany({
      data: events.map((e) => ({ id: e.id, payload: json(e) })),
      skipDuplicates: true,
    });
    return { accepted: events.map((e) => e.id) };
  }
}
