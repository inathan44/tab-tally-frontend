import CreateGroupModal from '@/app/groups/components/createGroupModal/CreateGroupModal';
import ProtectedRoute from '../components/ProtectedRoute';
import UserGroups from '@/app/groups/components/UserGroups';
import { getServerToken } from '@/app/hooks/getToken';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { getUserGroupInvites, getUserGroups } from '@/app/api/groups';

export default async function Groups() {
  const token = await getServerToken();

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['getUserGroups', token || ''],
    queryFn: getUserGroups,
  });

  await queryClient.prefetchQuery({
    queryKey: ['getUserGroupInvites', token || ''],
    queryFn: getUserGroupInvites,
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <ProtectedRoute>
      <div>
        <p>Groups</p>
        <CreateGroupModal token={token || ''} />
        <HydrationBoundary state={dehydratedState}>
          <UserGroups token={token || ''} />
        </HydrationBoundary>
      </div>
    </ProtectedRoute>
  );
}
