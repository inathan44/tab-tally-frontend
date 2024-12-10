'use client';

import { useGetGroup } from '@/app/api/groups';
import {
  CreateTransaction,
  createTransactionSchema,
} from '@/app/schemas/createTransaction';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';

type GroupInfoProps = {
  token: string;
  groupId: string;
};

export default function TransactionForm({ groupId, token }: GroupInfoProps) {
  const {} = useGetGroup(groupId, token);
  const form = useForm<CreateTransaction>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      groupId: +groupId,
    },
  });

  async function onSubmit(data) {
    console.log(data);
  }
  return (
    <div>
      <p>Transaction Form</p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='font-bold'>Bill name</FormLabel>
                <FormControl>
                  <Input placeholder='Tacos and drinks' {...field} />
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
