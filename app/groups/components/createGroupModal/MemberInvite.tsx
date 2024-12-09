import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ChevronDown } from 'lucide-react';
import React, { useState } from 'react';
import { InvitedMember } from '@/app/schemas/createGroup';
import { titleCase } from '@/app/hooks/helpers';
import { CreateGroupForm } from '@/types/forms';

type MemberInviteProps = {
  invitedUser: InvitedMember;
  form: CreateGroupForm;
};

export default function MemberInvite({ invitedUser, form }: MemberInviteProps) {
  const [open, setOpen] = useState(false);

  const fullName = titleCase(
    invitedUser.firstName + ' ' + invitedUser.lastName
  );

  function handleRoleClick(role: 'member' | 'admin') {
    setOpen(false);
    form.setValue('invitedMembers', [
      ...(form.getValues('invitedMembers') || []).map((member) => {
        if (member.id === invitedUser.id) {
          return {
            ...member,
            role: role as 'admin' | 'member',
          };
        }
        return member;
      }),
    ]);
  }

  return (
    <div className='flex items-center justify-between space-x-4'>
      <div className='flex items-center space-x-4'>
        <Avatar className='h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center'>
          <AvatarImage src='/avatars/01.png' alt='Image' />
          <AvatarFallback>
            {`${invitedUser.firstName[0]}${invitedUser.lastName[0]}`}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className='text-sm font-medium leading-none'>{fullName}</p>
          <p className='text-sm text-muted-foreground'>
            {invitedUser.username}
          </p>
        </div>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className='justify-between'
          >
            {titleCase(invitedUser.role)}{' '}
            <ChevronDown className='text-muted-foreground' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='p-0' align='end'>
          <Command>
            <CommandList>
              <CommandGroup>
                <CommandItem
                  className='space-y-1 flex flex-col items-start px-4 py-2'
                  value='member'
                  onSelect={(role) =>
                    handleRoleClick(role as 'member' | 'admin')
                  }
                >
                  <p>Member</p>
                  <p className='text-sm text-muted-foreground'>
                    Can add transactions. Can only delete their own
                    transactions.
                  </p>
                </CommandItem>
                <CommandItem
                  className='space-y-1 flex flex-col items-start px-4 py-2'
                  value='admin'
                  onSelect={(role) =>
                    handleRoleClick(role as 'member' | 'admin')
                  }
                >
                  <p>Admin</p>
                  <p className='text-sm text-muted-foreground'>
                    Member privileges. Can add members, promote members, delete
                    any transaction.
                  </p>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
