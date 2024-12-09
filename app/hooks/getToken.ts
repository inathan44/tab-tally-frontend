import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.AUTH_COOKIE_SIGNATURE_KEY_CURRENT || '';

export const verifyToken = async (): Promise<boolean> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(process.env.AUTH_COOKIE_NAME!)?.value;

    if (!token) {
      return false;
    }

    // Verify the token's signature
    jwt.verify(token, SECRET_KEY);
    return true;
  } catch (error) {
    console.error('Error verifying token:', error);
    return false;
  }
};

export const getServerToken = async (): Promise<string | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(process.env.AUTH_COOKIE_NAME!)?.value;

    if (!token) {
      return null;
    }

    const { id_token } = jwt.verify(token, SECRET_KEY) as { id_token: string };

    return id_token;
  } catch (error) {
    console.error('Error getting server token:', error);
    return null;
  }
};
