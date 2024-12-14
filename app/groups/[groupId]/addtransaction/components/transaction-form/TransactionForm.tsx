'use client';

import {
  CreateTransaction,
  CreateTransactionApiFormat,
  createTransactionSchema,
} from '@/app/schemas/createTransaction';
import { Form } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import AddTransactionInfo from './AddTransactionInfo';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AddTransactionDetails from './AddTransactionDetails';
import { useMutation } from '@tanstack/react-query';
import { createTransaction } from '@/app/api/transactions';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebaseConfig';
import { useClientToken } from '@/app/hooks/useClientToken';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

type GroupInfoProps = {
  groupId: string;
};

export default function TransactionForm({ groupId }: GroupInfoProps) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [user] = useAuthState(auth);

  const [step, setStep] = useState(1);

  const form = useForm<CreateTransaction>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      description: '',
      amount: 0,
      groupId: +groupId,
      transactionDetails: [],
    },
  });

  const { data: token } = useClientToken(user);

  const createTransactionMutation = useMutation({
    mutationFn: async (transaction: CreateTransactionApiFormat) => {
      if (!token) {
        throw new Error('Token is required');
      }
      return await createTransaction(transaction, token);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ['getGroup', groupId, token],
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['getGroup', groupId, token],
      });
    },
    onSuccess: () => {
      form.reset();
      localStorage.removeItem('transactionForm');
      router.push(`/groups/${groupId}`);
    },
  });

  async function onSubmit(data: CreateTransaction) {
    const apiFormattedTransaction: CreateTransactionApiFormat = {
      payerId: data.payerId.payerId,
      amount: data.amount,
      groupId: data.groupId,
      description: data.description,
      transactionDetails: data.transactionDetails.map((detail) => ({
        recipientId: detail.recipientId,
        amount: detail.amount,
      })),
    };
    createTransactionMutation.mutate(apiFormattedTransaction);
  }

  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      setStep(Number(stepParam));
    }
  }, [searchParams]);

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          {step !== 2 ? (
            <AddTransactionInfo form={form} />
          ) : (
            <AddTransactionDetails form={form} />
          )}

          <Button type='submit'>Submit</Button>
        </form>
      </Form>
    </div>
  );
}
