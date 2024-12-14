'use client';

import { useGetGroup } from '@/app/api/groups';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useClientToken } from '@/app/hooks/useClientToken';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebaseConfig';
import { Skeleton } from '@/components/ui/skeleton';

type GroupInfoProps = {
  groupId: string;
};

export default function GroupInfo({ groupId }: GroupInfoProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, userLoading] = useAuthState(auth);

  const { toast } = useToast();

  const { data: token, isLoading: tokenLoading } = useClientToken(user);

  const { data, isLoading: groupLoading } = useGetGroup(groupId, token || '');

  const inviteError = searchParams.get('inviteError');

  useEffect(() => {
    if (inviteError === 'true') {
      toast({
        title: 'Group created, but invites failed',
        description:
          'Please try inviting the group members again, something went wrong',
        variant: 'destructive',
      });
      router.replace(`/groups/${groupId}`);
    }
  }, [inviteError, toast, router, groupId]);

  if (tokenLoading || groupLoading || userLoading) {
    return (
      <div>
        <Skeleton className='w-full h-4' />
        <p>loading...</p>
      </div>
    );
  }

  return (
    <div>
      <p>{groupId}</p>
      <p>{data?.name}</p>
      <p>{data?.description}</p>
      <p>Members: {data?.groupMembers?.length || null}</p>
      <p>Number of transactions: {data?.transactions.length}</p>
    </div>
  );
}
