import { CreateTransactionApiFormat } from '@/app/schemas/createTransaction';
import axiosInstance from './axiosInstance';
import { AxiosError } from 'axios';

export async function createTransaction(
  transaction: CreateTransactionApiFormat,
  token: string
) {
  try {
    const response = await axiosInstance.post(
      '/Transactions/add',
      transaction,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting user group invites:', error);
    if (error instanceof AxiosError && error.response) {
      throw new Error(error.response.data.toString());
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}
