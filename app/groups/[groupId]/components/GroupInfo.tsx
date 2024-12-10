'use client';

import { useGetGroup } from '@/app/api/groups';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type GroupInfoProps = {
  token: string;
  groupId: string;
};

export default function GroupInfo({ token, groupId }: GroupInfoProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const { data, isLoading } = useGetGroup(groupId, token);

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

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <p>{groupId}</p>
      <p>{data?.name}</p>
      <p>{data?.description}</p>
      <p>Members: {data?.groupMembers?.length || null}</p>
    </div>
  );
}
