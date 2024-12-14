import { z } from 'zod';

const createTransactionDetailsSchema = z.object({
  amount: z.number(),
  recipientId: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().optional(),
});

const payerSchema = z.object({
  // The api only needs the payerId, but the client needs the payer's name
  payerId: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().optional(),
});

export const createTransactionSchema = z
  .object({
    payerId: payerSchema,
    amount: z
      .string()
      .refine((val) => !isNaN(Number(val)), {
        message: 'Amount must be a valid number',
      })
      .transform((val) => Number(val)), // starts as string and is converted to number
    groupId: z.number(), // will be provided by the page
    description: z.string().min(1, { message: 'Please provide a description' }),
    transactionDetails: z.array(createTransactionDetailsSchema),
  })
  .refine(
    (data) => {
      const detailsTotal = data.transactionDetails.reduce((acc, detail) => {
        return acc + detail.amount;
      }, 0);
      return detailsTotal === Number(data.amount);
    },
    {
      message: 'The sum of the amounts must equal the total amount',
      path: ['transactionDetails'],
    }
  );

export const createTransactionApiFormat = z.object({
  payerId: z.string(),
  amount: z.number(),
  groupId: z.number(),
  description: z.string(),
  transactionDetails: z.array(
    z.object({
      amount: z.number(),
      recipientId: z.string(),
    })
  ),
});

export type CreateTransaction = z.infer<typeof createTransactionSchema>;
export type CreateTransactionApiFormat = z.infer<
  typeof createTransactionApiFormat
>;
