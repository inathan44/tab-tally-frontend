import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tab Tally - Login',
  description:
    'Login to Tab Tally to start splitting bills and keeping track of who owes who.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
