import { useGetMembersOfGroup } from '@/app/api/groups';
import { useClientToken } from '@/app/hooks/useClientToken';
import {
  Command,
  CommandList,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebaseConfig';
import { useParams } from 'next/navigation';
import { CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateTransactionForm } from '@/types/forms';

type SelectRecipientsProps = {
  form: CreateTransactionForm;
};

export default function SelectRecipients({ form }: SelectRecipientsProps) {
  const [user] = useAuthState(auth);
  const { groupId } = useParams() as { groupId: string };

  const { data: token } = useClientToken(user);
  const { data: groupMembers, isLoading } = useGetMembersOfGroup(
    groupId,
    token || ''
  );

  function onRecipientSelect(
    memberId: string,
    firstName: string,
    lastName: string,
    username: string
  ) {
    const isRecipient = form
      .getValues('transactionDetails')
      .some(({ recipientId }) => recipientId === memberId);
    if (isRecipient) {
      form.setValue(
        'transactionDetails',
        form
          .getValues('transactionDetails')
          .filter(({ recipientId }) => recipientId !== memberId)
      );
    } else {
      form.setValue('transactionDetails', [
        ...form.getValues('transactionDetails'),
        {
          recipientId: memberId,
          amount: 0,
          firstName: firstName,
          lastName: lastName,
          username: username,
        },
      ]);
    }
  }

  return (
    <Command>
      <CommandList>
        <CommandGroup>
          {isLoading && <p>Loading members...</p>}
          {groupMembers?.map((member) => {
            const isRecipient = form
              .getValues('transactionDetails')
              .some(({ recipientId }) => recipientId === member.memberId);
            return (
              <div key={member.memberId}>
                <CommandItem
                  value={member.memberId}
                  onSelect={(memberId) =>
                    onRecipientSelect(
                      memberId,
                      member.member.firstName || '',
                      member.member.lastName || '',
                      member.member.username || ''
                    )
                  }
                  className='border p-2 flex justify-between'
                >
                  <span>
                    {member.member.firstName} {member.member.lastName}
                  </span>
                  <div
                    className={cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      isRecipient
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible'
                    )}
                  >
                    <CheckIcon className='h-4 w-4' />
                  </div>
                </CommandItem>
              </div>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
