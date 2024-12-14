import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import SelectRecipients from '@/app/groups/[groupId]/addtransaction/components/transaction-form/SelectRecipients';
import { CreateTransactionForm } from '@/types/forms';
import { useGetMembersOfGroup } from '@/app/api/groups';
import { useClientToken } from '@/app/hooks/useClientToken';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebaseConfig';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { validateTransactionFormPartOne } from './helpers';
import { useEffect } from 'react';

type GroupInfoProps = {
  form: CreateTransactionForm;
};

export default function AddTransactionInfo({ form }: GroupInfoProps) {
  const router = useRouter();
  const { groupId } = useParams() as { groupId: string };

  const [user] = useAuthState(auth);

  const { data: token } = useClientToken(user);

  const { data: groupMembers, isLoading: groupMembersLoading } =
    useGetMembersOfGroup(groupId, token || '');

  useEffect(() => {
    // Load form from local storage if found
    const formFromLocalStorage = JSON.parse(
      localStorage.getItem('transactionForm') || '{}'
    );
    if (Object.keys(formFromLocalStorage).length > 0) {
      form.reset({ ...formFromLocalStorage });
    }
  }, [form]);

  async function handleContinueClick() {
    await validateTransactionFormPartOne(form);

    localStorage.setItem('transactionForm', JSON.stringify(form.getValues()));
    const params = new URLSearchParams();
    params.append('step', '2');
    router.push(`/groups/${groupId}/addtransaction?${params.toString()}`);
  }

  function onSelectPayer(memberId: string) {
    const selectedGroupMemberObject = groupMembers?.find(
      (gm) => gm.memberId === memberId
    );
    const memberInfo = selectedGroupMemberObject?.member;

    if (!memberInfo) return;

    form.setValue('payerId', {
      payerId: memberId,
      firstName: memberInfo?.firstName,
      lastName: memberInfo?.lastName,
      username: memberInfo?.username,
    });
  }

  return (
    <>
      <FormField
        control={form.control}
        name='description'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='font-bold'>What&apos;s it for?</FormLabel>
            <FormControl>
              <Input placeholder='Tacos and drinks' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='amount'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='font-bold'>Amount</FormLabel>
            <FormControl>
              <Input {...field} type='number' />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='payerId'
        render={({ field }) => {
          return (
            <FormItem>
              <FormLabel>Paid for by</FormLabel>
              <Select
                onValueChange={(value) => onSelectPayer(value)}
                value={field.value?.payerId}
                defaultValue={field.value?.payerId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select payer' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {groupMembers?.map((member) => {
                    if (groupMembersLoading) {
                      return (
                        <SelectItem
                          key={member.memberId}
                          value={member.memberId}
                          disabled
                        >
                          Loading...
                        </SelectItem>
                      );
                    }
                    return (
                      <SelectItem key={member.id} value={member.memberId}>
                        {member.member?.firstName} {member.member?.lastName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          );
        }}
      />
      <FormField
        control={form.control}
        name='transactionDetails'
        render={() => (
          <FormItem>
            <FormLabel className='font-bold'>Amount</FormLabel>
            <FormControl>
              <SelectRecipients form={form} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type='button' onClick={handleContinueClick}>
        Continue
      </Button>
    </>
  );
}
