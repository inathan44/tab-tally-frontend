import TransactionForm from '@/app/groups/[groupId]/addtransaction/components/transaction-form/TransactionForm';
type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { groupId } = await params;
  return (
    <div>
      <p>hi</p>
      <TransactionForm groupId={groupId} />
    </div>
  );
}
