import { useForm } from 'react-hook-form';
import { CreateGroupSchema } from '@/app/schemas/createGroup';
import { CreateTransaction } from '@/app/schemas/createTransaction';

// Define the type for the useForm return value
export type CreateGroupForm = ReturnType<typeof useForm<CreateGroupSchema>>;
export type CreateTransactionForm = ReturnType<
  typeof useForm<CreateTransaction>
>;
