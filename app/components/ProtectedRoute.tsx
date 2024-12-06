import { verifyToken } from '@/app/hooks/getToken';

export default async function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const isValidToken = await verifyToken();

  if (!isValidToken) {
    return <p>Sign in</p>;
  }
  return <>{children}</>;
}
