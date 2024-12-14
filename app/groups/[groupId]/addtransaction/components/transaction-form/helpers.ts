import { CreateTransactionForm } from '@/types/forms';

export async function validateTransactionFormPartOne(
  form: CreateTransactionForm
) {
  const descriptionValid = await form.trigger('description');
  const amountValid = await form.trigger('amount');
  const payerIdValid = await form.trigger('payerId');
  const firstStepDetailsValid = form.getValues('transactionDetails').length > 0;

  if (!firstStepDetailsValid) {
    // Manual error since we don't want to use the forms validation here as it will cause an unnecessary error
    form.setError('transactionDetails', {
      message: 'Must select one recipient before continuing',
    });
  } else {
    form.clearErrors('transactionDetails');
  }

  return (
    descriptionValid && amountValid && payerIdValid && firstStepDetailsValid
  );
}
