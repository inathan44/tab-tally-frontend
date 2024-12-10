import { getServerToken } from '@/app/hooks/getToken';
import TransactionForm from './components/TransactionForm';
type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { groupId } = await params;
  const token = await getServerToken();
  return (
    <div>
      <p>hi</p>
      <TransactionForm groupId={groupId} token={token || ''} />
    </div>
  );
}
