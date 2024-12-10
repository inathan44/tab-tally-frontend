'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Icons } from '@/components/ui/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import firebaseApp from '@/firebaseConfig';
import { loginSchema, LoginSchema } from '../schemas/login';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const auth = getAuth(firebaseApp);

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginSchema) {
    setIsLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const idToken = await credential.user.getIdToken();

      await fetch('/api/login', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      router.push(redirect);
      router.refresh();
    } catch (error) {
      console.error('An error occurred during sign up:', error);
      form.setError('root', {
        type: 'manual',
        message: 'An error occurred during sign up. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type='email' autoComplete='email' required />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className='relative'>
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete='new-password'
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <Icons.eyeOff className='h-4 w-4' />
                    ) : (
                      <Icons.eye className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' className='w-full' disabled={isLoading}>
          {isLoading ? (
            <>
              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
              Signing up...
            </>
          ) : (
            'Sign Up'
          )}
        </Button>
      </form>
    </Form>
  );
}

export default function Login() {
  // const [user, loading, error] = useAuthState(auth);

  return (
    <Suspense fallback={<div>loading...</div>}>
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600 p-4'>
        <div className='w-full max-w-md space-y-8 bg-white p-6 rounded-xl shadow-md'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold'>Login</h1>
            <p className='text-gray-600 mt-2'>
              Start splitting bills with ease
            </p>
          </div>
          <LoginForm />
          <p className='text-center text-sm text-gray-600 mt-4'>
            Don&apos;t have an account?{' '}
            <Link
              href='/register'
              className='font-medium text-blue-600 hover:text-blue-500'
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </Suspense>
  );
}
