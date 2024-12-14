import ProtectedRoute from '@/app/components/ProtectedRoute';
import AddUserInfo from './components/AddUserInfo';
import { getServerToken } from '@/app/hooks/useServerToken';

export default async function Page() {
  const token = await getServerToken();
  return (
    <ProtectedRoute>
      <div>
        <AddUserInfo token={token || ''} />
      </div>
    </ProtectedRoute>
  );
}
