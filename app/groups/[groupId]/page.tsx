import GroupInfo from '@/app/groups/[groupId]/components/GroupInfo';
import { getServerToken } from '@/app/hooks/useServerToken';
import { checkUserMemberOfGroup, getGroup } from '@/app/api/groups';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { groupId } = await params;
  const token = await getServerToken();

  let isMemberOfGroup = false;

  try {
    isMemberOfGroup = await checkUserMemberOfGroup(+groupId, token || '');
  } catch (error: any) {
    console.error('Error checking group membership:', error);
    // Handle the error appropriately, such as by redirecting to an error page
    return (
      <div>
        <p>
          Error checking group membership. You might not be part of this group
          or another error occured.
        </p>
        <p>Error: {error?.message}</p>
      </div>
    );
  }

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['getGroup', groupId, token || ''],
    queryFn: getGroup,
  });

  const dehydratedState = dehydrate(queryClient);

  if (!isMemberOfGroup) {
    return (
      <div>
        <p>
          You are not a member of this group. You need to be a member of this
          group to view this page.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p>Group ID: {groupId}</p>
      <HydrationBoundary state={dehydratedState}>
        <GroupInfo groupId={groupId} />
      </HydrationBoundary>
    </div>
  );
}
