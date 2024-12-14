'use client';

import {
  changeUserGroupStatus,
  useGetUserGroupInvites,
  useGetUserGroups,
} from '@/app/api/groups';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebaseConfig';
import { GroupMemberStatus } from '@/types/api';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

// type UserGroupsProps = {
//   initialGroups: GetUserGroupsResponse[];
//   initialGroupInvites: GetUserGroupsResponse[];
// };

export default function UserGroups() {
  const [user] = useAuthState(auth);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: token } = useQuery({
    queryKey: ['clientToken'],
    queryFn: async () => {
      if (user) {
        return await user.getIdToken();
      }
      return null;
    },
    enabled: !!user, // Only run the query if the user is authenticated
  });

  const { data: groups } = useGetUserGroups(token || '');
  const { data: groupInvites } = useGetUserGroupInvites(token || '');

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      groupId,
      token,
      userId,
      status,
    }: {
      groupId: number;
      token: string;
      userId: string;
      status: GroupMemberStatus;
    }) => {
      return changeUserGroupStatus(groupId, token, userId, status);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['getUserGroups', token] });
      await queryClient.cancelQueries({
        queryKey: ['getUserGroupInvites', token],
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['getUserGroups', token],
      });
      await queryClient.invalidateQueries({
        queryKey: ['getUserGroupInvites', token],
      });
    },
    onSuccess: async (_, ctx) => {
      router.push(`/groups/${ctx?.groupId}`);
    },
  });

  return (
    <div>
      {groups?.map((group) => {
        return (
          <div key={group.id} className='border'>
            <p>{group.name}</p>
            <p>{group.description || 'No description for this group'}</p>
            <p>Members: {group.groupMembers?.length || 0}</p>
            <p>Owner: {group.createdBy?.username}</p>
            <Link href={`/groups/${group.id}`}>View</Link>
          </div>
        );
      })}
      <div className='mt-8'>
        <p>Below is groups I am invited to</p>
        {groupInvites?.map((invitedGroup) => {
          return (
            <div key={invitedGroup.id} className='border'>
              <p>{invitedGroup.name}</p>
              <p>
                {invitedGroup.description || 'No description for this group'}
              </p>
              <p>Members: {invitedGroup.groupMembers?.length || 0}</p>
              <p>Owner: {invitedGroup.createdBy?.username}</p>
              <Button
                onClick={() =>
                  mutate({
                    groupId: invitedGroup.id,
                    status: 'Joined',
                    token: token || '',
                    userId: user?.uid || '',
                  })
                }
                disabled={isPending}
              >
                {isPending ? 'Joining...' : 'Accept Invite'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
