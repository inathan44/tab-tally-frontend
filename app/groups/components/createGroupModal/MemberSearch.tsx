import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

import { useState } from 'react';
import debounce from 'lodash.debounce';
import { useQuery } from '@tanstack/react-query';
import { searchUsers } from '@/app/api/users';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebaseConfig';
import { Icons } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { FirebaseUser } from '@/types/auth';
import { CreateGroupForm } from '@/types/forms';
import { addUserToInvitedMembers } from './handleCheckMember';
import { FormLabel } from '@/components/ui/form';

type MemberSearchProps = {
  form: CreateGroupForm;
};

const debouncedUserSearch = debounce((search: string, refetch: () => void) => {
  if (search) {
    refetch();
  }
}, 500);

export default function MemberSearch({ form }: MemberSearchProps) {
  const [user] = useAuthState(auth) as [FirebaseUser | null, boolean, Error];

  const [memberSearch, setMemberSearch] = useState('');

  const { data, refetch, isLoading, error } = useQuery({
    queryKey: ['searchUsers', memberSearch, user?.accessToken || ''],
    queryFn: searchUsers,
    enabled: false,
  });

  async function handleSearchUsers(search: string) {
    debouncedUserSearch.cancel();
    setMemberSearch(search);
    debouncedUserSearch(search, refetch);
  }

  return (
    <div>
      <FormLabel className='font-bold'>
        Invite Members{' '}
        <small className='text-gray-600 font-light'>optional</small>
      </FormLabel>
      <Command className='rounded-lg border h-auto' shouldFilter={false}>
        <div className='relative w-full'>
          <CommandInput
            value={memberSearch}
            onValueChange={(searchQuery) => handleSearchUsers(searchQuery)}
            placeholder='Search username or email'
          />
          <div
            className={cn(
              'absolute top-1/2 right-2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 hidden',
              isLoading && 'block'
            )}
          >
            <Icons.spinner
              className={cn('text-muted-foreground w-4 h-4 animate-spin')}
            />
          </div>
        </div>
        <CommandList className={cn('', !memberSearch && 'hidden')}>
          {memberSearch && (
            <CommandEmpty>
              {error ? 'Error getting users' : 'No results found.'}
            </CommandEmpty>
          )}
          <CommandGroup>
            {data
              ?.filter((u) => u.id != user?.uid)
              .map((u) => {
                const isCurrenlyInvited = form
                  .getValues('invitedMembers')
                  ?.some((member) => member.id === u.id);

                return (
                  <CommandItem key={u.id} disabled={isCurrenlyInvited}>
                    <div
                      className={cn('flex items-center w-full cursor-pointer')}
                      onClick={() => {
                        if (isCurrenlyInvited) {
                          return;
                        }
                        addUserToInvitedMembers(form, u);
                        setMemberSearch('');
                      }}
                    >
                      <div className='ml-2 w-full flex'>
                        <span>
                          {u.firstName} {u.lastName}
                        </span>
                        <span>{u.username}</span>
                        {isCurrenlyInvited && (
                          <span className='text-muted-foreground ml-auto'>
                            Invited
                          </span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
