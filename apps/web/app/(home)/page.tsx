export const dynamic = 'force-dynamic';

import Image from 'next/image';

import { getLinks } from '../../services/links.service';
import { FeatureBadge } from '../../components/feature-badge';
import { LinksClient } from '../../components/links-client';
import { ButtonDemo } from '../../components/button-demo';
import { InputDemo } from '../../components/input-demo';
import { TextareaDemo } from '../../components/textarea-demo';
import { FormDemo } from '../../components/form-demo';
import {
  AddFile,
  AddUser,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Clear,
  Download,
  Edit,
  Error,
  FullArrowLeft,
  FullArrowRight,
  HamburgerMenu,
  Loading,
  MapPin,
  PhoneCall,
  Search,
  Send,
  Trash,
} from '@repo/icons';
import { ComponentType, SVGProps } from 'react';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface IconItem {
  name: string;
  component: IconComponent;
}

export default async function Home() {
  const links = await getLinks();

  const icons: IconItem[] = [
    { name: 'AddFile', component: AddFile },
    { name: 'AddUser', component: AddUser },
    { name: 'ArrowLeft', component: ArrowLeft },
    { name: 'ArrowRight', component: ArrowRight },
    { name: 'Calendar', component: Calendar },
    { name: 'Check', component: Check },
    { name: 'Clear', component: Clear },
    { name: 'Download', component: Download },
    { name: 'Edit', component: Edit },
    { name: 'Error', component: Error },
    { name: 'FullArrowLeft', component: FullArrowLeft },
    { name: 'FullArrowRight', component: FullArrowRight },
    { name: 'HamburgerMenu', component: HamburgerMenu },
    { name: 'MapPin', component: MapPin },
    { name: 'PhoneCall', component: PhoneCall },
    { name: 'Search', component: Search },
    { name: 'Send', component: Send },
    { name: 'Trash', component: Trash },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <main className="w-full max-w-3xl">
        {/* Logo */}
        <Image
          src="/turborepo-dark.svg"
          alt="Turborepo"
          width={160}
          height={34}
          className="mb-8"
          priority
        />

        {/* Intro */}
        <h1 className="mb-4 text-3xl font-bold">Turborepo + Prisma Demo</h1>
        <p className="text-primary-500 mb-8">
          Fetching data from PostgreSQL via NestJS API and Prisma ORM.
        </p>

        {/* Badges */}
        <div className="mb-8 flex flex-wrap gap-2">
          <FeatureBadge label="Next.js 16" />
          <FeatureBadge label="Prisma 7" />
          <FeatureBadge label="Local Component" highlight />
        </div>

        {/* Button Variants Demo */}
        <ButtonDemo />

        {/* Input Demo */}
        <InputDemo />

        {/* Textarea Demo */}
        <TextareaDemo />

        {/* Form Demo */}
        <FormDemo />

        {/* Icon Showcase */}
        <section className="border-surface mt-8 border-t pt-8">
          <h2 className="mb-4 text-xl font-semibold">Icon Showcase</h2>
          <p className="text-foreground/70 mb-6 text-sm">
            All available icons from @repo/icons package
          </p>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {icons.map(({ name, component: Icon }) => (
              <div
                key={name}
                className="flex flex-col items-center rounded-lg p-4 transition-colors"
              >
                <Icon className="text-primary-600 mb-2 h-5" />
                <span className="text-desktop-caption text-center">{name}</span>
              </div>
            ))}
            <div className="flex flex-col items-center rounded-lg p-4 transition-colors">
              <Loading className="text-primary-600 mb-2 h-5 animate-spin" />
              <span className="text-desktop-caption text-center">Loading</span>
            </div>
          </div>
        </section>

        {/* Data */}
        <section className="border-surface mt-8 border-t pt-8">
          <h2 className="mb-4 text-xl font-semibold">
            Server-Side Demo: Fetched Links ({links.length})
          </h2>

          {links.length > 0 ? (
            <ul className="space-y-3">
              {links.map((link) => (
                <li
                  key={link.id}
                  className="border-surface hover:border-border rounded-xl border p-5 transition-colors"
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-500 font-medium hover:underline"
                  >
                    {link.title}
                  </a>
                  {link.description && (
                    <p className="text-foreground/70 mt-1 text-sm">
                      {link.description}
                    </p>
                  )}
                  <p className="text-foreground/50 mt-2 text-xs">
                    ID: {link.id} •{' '}
                    {new Date(link.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-foreground/70">
              No links. Start the API on port 3001.
            </p>
          )}

          {links.length > 0 && (
            <p className="text-success-800/70 mt-4 text-sm">
              ✓ Server-side fetch via serverFetch()
            </p>
          )}
        </section>

        {/* Client-side fetch demo */}
        <section className="border-surface mt-8 border-t pt-8">
          <h2 className="mb-4 text-xl font-semibold">Client-Side Demo</h2>
          <LinksClient />
        </section>
      </main>

      <footer className="border-surface text-foreground/50 mt-16 w-full max-w-3xl border-t pt-8 text-center text-sm">
        Web • Port 3000 • @repo/design-system
      </footer>
    </div>
  );
}
