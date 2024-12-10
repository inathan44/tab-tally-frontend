import { z } from 'zod';

const createTransactionDetailsSchema = z.object({
  amount: z.number(),
  recipientId: z.string(),
});

export const createTransactionSchema = z.object({
  payerId: z.string(),
  amount: z.number(),
  groupId: z.number(), // will be provided by the page
  description: z.string().min(1, { message: 'Please provide a description' }),
  transactionDetails: z.array(createTransactionDetailsSchema),
});

export type CreateTransaction = z.infer<typeof createTransactionSchema>;
