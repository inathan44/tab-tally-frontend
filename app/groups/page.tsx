import CreateGroupModal from '@/app/groups/components/createGroupModal/CreateGroupModal';
import ProtectedRoute from '../components/ProtectedRoute';
import UserGroups from '@/app/groups/components/UserGroups';

export default async function Groups() {
  return (
    <ProtectedRoute>
      <div>
        <p>Groups</p>
        <CreateGroupModal />
        <UserGroups />
      </div>
    </ProtectedRoute>
  );
}
