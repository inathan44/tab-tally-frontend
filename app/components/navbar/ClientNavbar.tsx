'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { auth } from '@/firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';

type ClientNavbarProps = {
  validToken?: boolean;
};

export default function ClientNavbar({ validToken }: ClientNavbarProps) {
  const router = useRouter();

  const [user] = useAuthState(auth);

  async function handleSignOut() {
    try {
      await auth.signOut();

      await fetch('/api/logout');

      router.push('/');
    } catch (error) {
      console.error('An error occurred during sign out:', error);
    }
  }

  return (
    <nav className='bg-white shadow-md'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          <div className='flex'>
            <Link href='/' className='flex-shrink-0 flex items-center'>
              {/* <img className="h-8 w-auto" src="/placeholder.svg?height=32&width=32" alt="Logo" /> */}
              <span className='ml-2 text-xl font-bold'>BillSplit</span>
            </Link>
          </div>
          <div className='flex items-center'>
            <Link href='/groups'>Groups</Link>
            {user ? (
              <div>
                <p>Signed in as {user.email}</p>
                <Button onClick={handleSignOut}>Sign Out</Button>
              </div>
            ) : (
              <Button onClick={() => router.push('/login')}>Sign In</Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
