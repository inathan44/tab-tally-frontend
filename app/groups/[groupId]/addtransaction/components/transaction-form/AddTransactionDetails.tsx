'use client';

import { CreateTransactionForm } from '@/types/forms';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { validateTransactionFormPartOne } from './helpers';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';

type AddTransactionDetailsProps = {
  form: CreateTransactionForm;
};

export default function AddTransactionDetails({
  form,
}: AddTransactionDetailsProps) {
  const router = useRouter();

  useEffect(() => {
    async function verifyForm() {
      // To persist on refreshs
      const formFromLocalStorage = JSON.parse(
        localStorage.getItem('transactionForm') || '{}'
      );

      form.setValue(
        'transactionDetails',
        formFromLocalStorage.transactionDetails
      );

      form.setValue('description', formFromLocalStorage.description);
      form.setValue('amount', formFromLocalStorage.amount);
      form.setValue('payerId', formFromLocalStorage.payerId);

      // Validate the values from local storage otherwise, do not allow user to be on this page
      if (
        !formFromLocalStorage ||
        !(await validateTransactionFormPartOne(form))
      ) {
        router.push(`/groups/15808/addtransaction?step=1`);
        return;
      }
    }

    verifyForm();
  }, [form, router]);

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement>,
    detail: { recipientId: string; amount: number | null }
  ) {
    const value = e.target.value === '' ? null : parseFloat(e.target.value);
    form.setValue(
      'transactionDetails',

      form.getValues('transactionDetails').map((d) =>
        d.recipientId === detail.recipientId
          ? { ...d, amount: value as unknown as number } // cast as number to avoid TS error. This form can't be submitted with a null value, so its safe to cast.
          : d
      )
    );
  }

  return (
    <div>
      <p>{form.getValues('description')}</p>
      <p>Total bill:{form.getValues('amount')}</p>
      <p>
        Paid by:{form.getValues('payerId.firstName')}{' '}
        {form.getValues('payerId.lastName')}
      </p>
      <FormField
        control={form.control}
        name='transactionDetails'
        render={({ field }) => {
          return (
            <FormItem>
              <FormLabel>Details</FormLabel>
              <p className='text-red-500 text-sm'>
                {form.formState.errors.transactionDetails?.message}
              </p>
              <FormControl>
                <div>
                  {field.value.map((detail, i) => (
                    <div
                      key={detail.recipientId}
                      className='border-2 p-2 mx-2 border-red-500 my-4'
                    >
                      <Input
                        {...field}
                        value={field.value[i].amount}
                        onChange={(e) => handleInputChange(e, detail)}
                        type='number'
                      />
                      <p>
                        {detail.firstName} {detail.lastName}
                      </p>
                    </div>
                  ))}
                </div>
              </FormControl>
            </FormItem>
          );
        }}
      />
    </div>
  );
}
