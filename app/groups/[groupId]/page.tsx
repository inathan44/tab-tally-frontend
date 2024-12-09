import GroupInfo from '@/app/groups/[groupId]/components/GroupInfo';
import { getServerToken } from '@/app/hooks/getToken';
import { getGroup } from '@/app/api/groups';
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

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['getGroup', groupId, token || ''],
    queryFn: getGroup,
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <div>
      <p>Group ID: {groupId}</p>
      <HydrationBoundary state={dehydratedState}>
        <GroupInfo groupId={groupId} token={token || ''} />
      </HydrationBoundary>
    </div>
  );
}
