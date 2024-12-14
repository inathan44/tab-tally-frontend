import CreateGroupModal from '@/app/groups/components/createGroupModal/CreateGroupModal';
import ProtectedRoute from '../components/ProtectedRoute';
import UserGroups from '@/app/groups/components/UserGroups';
// import { getServerToken } from '@/app/hooks/useServerToken';
// import { getUserGroupInvites, getUserGroups } from '@/app/api/groups';

export default async function Groups() {
  // const token = await getServerToken();
  // const userGroups = await getUserGroups({
  //   queryKey: ['getUserGroups', token || ''],
  // });
  // const userGroupInvites = await getUserGroupInvites({
  //   queryKey: ['getUserGroupInvites', token || ''],
  // });

  return (
    <ProtectedRoute>
      <div>
        <p>Groups</p>
        <CreateGroupModal />
        <UserGroups
        // initialGroups={userGroups}
        // initialGroupInvites={userGroupInvites}
        />
      </div>
    </ProtectedRoute>
  );
}
