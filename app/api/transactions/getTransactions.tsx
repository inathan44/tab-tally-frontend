import axios from 'axios';
import getAPIUrl from '@/app/hooks/getAPIUrl';

const API_URL = getAPIUrl();

export const getTransactions = async () => {
  const response = await axios.get(`${API_URL}/transactions`);
  if (response.status !== 200) {
    throw new Error('Failed to fetch transactions');
  }
  return response.data;
};
