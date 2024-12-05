import getEnv from '@/app/hooks/getEnv';

export default function getAPIUrl() {
  const env = getEnv();
  if (env === 'production') {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  return process.env.NEXT_PUBLIC_DEV_API_URL;
}
