import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '@/styles/globals.css';
import '@/styles/shell.css';
import '@/styles/dashboard.css';
import '@/styles/forms.css';
import '@/styles/views.css';

const manrope = localFont({
  src: [
    {
      path: '../../public/fonts/manrope-regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/manrope-semibold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/manrope-bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RavelNest — A little less planning. A lot more celebrating.',
  description:
    'Your thoughtful AI event planning studio. Bring weddings, birthdays and community events to life with personalized ideas, clear budgets, vendor checklists and timelines.',
  applicationName: 'RavelNest',
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={manrope.variable}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
