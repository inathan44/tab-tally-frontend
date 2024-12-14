'use client';

import {
  CreateUserInfo,
  createUserInfoSchema,
} from '@/app/schemas/createUserInfo';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { createUserInDb, useGetSignedInDBUser } from '@/app/api/users';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebaseConfig';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

type AddUserInfoProps = {
  token: string;
};

export default function AddUserInfo({ token }: AddUserInfoProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [firebaseUser] = useAuthState(auth);

  const { data: dbUser } = useGetSignedInDBUser(token, firebaseUser?.uid || '');

  useEffect(() => {
    async function setCustomClaims() {
      try {
        if (dbUser && dbUser.username) {
          await fetch('/api/setCustomClaims', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              uid: firebaseUser?.uid,
              customClaims: { username: dbUser.username },
            }),
          });

          // Sign out user to refresh custom claims. Without this, the user will not have the custom claims set and can't leave this page

          await fetch('/api/logout');

          await auth.signOut();

          router.refresh();
        }
      } catch (error) {
        console.error('An error occurred during setting custom claims:', error);
      }
    }

    setCustomClaims();
  }, [dbUser, firebaseUser, router, token]);

  const form = useForm<CreateUserInfo>({
    resolver: zodResolver(createUserInfoSchema),
  });

  async function onSubmit(data: CreateUserInfo) {
    if (!firebaseUser) {
      // Ensures user is signed in before proceeding
      form.setError('root', {
        type: 'manual',
        message: 'An error occured, please try logging out and back in',
      });
      return;
    }

    await fetch('/api/setCustomClaims', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        uid: firebaseUser.uid,
        customClaims: { username: data.username },
      }),
    });

    await createUserInDb(
      {
        email: firebaseUser.email!,
        ...data,
      },
      token
    );

    await queryClient.invalidateQueries({
      queryKey: ['getSignedInDBUser', firebaseUser.uid, token],
    });
  }

  return (
    <div>
      {form.formState.errors.root && (
        <p className='text-red-500'>{form.formState.errors.root.message}</p>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name='username'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='font-bold'>Username</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel className='font-bold'>First Name</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel className='font-bold'>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type='submit'>Submit</Button>
        </form>
      </Form>
    </div>
  );
}
