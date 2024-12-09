import axios from 'axios';
import getAPIUrl from '@/app/hooks/getAPIUrl';

const API_URL = getAPIUrl();

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
