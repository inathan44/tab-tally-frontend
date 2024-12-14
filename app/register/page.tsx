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
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { signUpSchema, SignUpSchema } from '@/app/schemas/signup';
import { Icons } from '@/components/ui/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserInDbAndFirebase } from '@/app/api/users';
import { useRouter } from 'next/navigation';
import GoogleButton from '../components/GoogleButton';
import { useSignInWithGoogle } from 'react-firebase-hooks/auth';
import { auth } from '@/firebaseConfig';

export default function Signup() {
  const router = useRouter();

  const [signInWithGoogle, error] = useSignInWithGoogle(auth);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: SignUpSchema) {
    setIsLoading(true);

    try {
      const { firebaseUser } = await createUserInDbAndFirebase(values);

      const idToken = await firebaseUser.getIdToken();

      await fetch('/api/setCustomClaims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          customClaims: { username: values.username },
        }),
      });

      await fetch('/api/login', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      router.push('/');
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

  async function onGoogleClick() {
    const result = await signInWithGoogle();
    if (result?.user) {
      const idToken = await result.user.getIdToken();
      await fetch('/api/login', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      router.push('/create-username');
      router.refresh();
    } else {
      console.error('Error signing in with Google:', error);
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600 p-4'>
      <div className='w-full max-w-md space-y-8 bg-white p-6 rounded-xl shadow-md'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold'>Create your account</h1>
          <p className='text-gray-600 mt-2'>Start splitting bills with ease</p>
        </div>
        <GoogleButton onClick={onGoogleClick} />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='email'
                      autoComplete='email'
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='firstName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} type='text' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='lastName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} type='text' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='username'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} type='text' autoComplete='username' />
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
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
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
                          showPassword
                            ? 'Hide confirm password'
                            : 'Show confirm password'
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
            {form.formState.errors.root && (
              <p className='text-red-500 text-sm'>
                {form.formState.errors.root.message}
              </p>
            )}
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
        <p className='text-center text-sm text-gray-600 mt-4'>
          Already have an account?{' '}
          <a
            href='/login'
            className='font-medium text-blue-600 hover:text-blue-500'
          >
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}
