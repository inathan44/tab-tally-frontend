import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tab Tally - Register',
  description:
    'Create an account on Tab Tally to start splitting bills and keeping track of who owes who.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
