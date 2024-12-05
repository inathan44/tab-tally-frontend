import ClientNavbar from '@/app/components/navbar/ClientNavbar';
import { getTokens } from 'next-firebase-auth-edge';
import { cookies } from 'next/headers';
import { clientConfig, serverConfig } from '@/firebaseConfig';

export default async function Navbar() {
  const tokens = await getTokens(await cookies(), {
    apiKey: clientConfig.apiKey,
    cookieName: serverConfig.cookieName,
    cookieSignatureKeys: serverConfig.cookieSignatureKeys,
    serviceAccount: serverConfig.serviceAccount,
  });

  const tokenValid = !!tokens;

  return <ClientNavbar validToken={tokenValid} />;
}
