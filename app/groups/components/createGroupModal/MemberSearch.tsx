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
import { FormField, FormItem, FormControl } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { CreateGroupForm } from '@/types/forms';
import { handleCheckMember } from './handleCheckMember';
import { titleCase } from '@/app/hooks/helpers';

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
    <Command className='rounded-lg border h-auto' shouldFilter={false}>
      <div className='relative w-full'>
        <CommandInput
          value={memberSearch}
          onValueChange={(searchQuery) => handleSearchUsers(searchQuery)}
          placeholder='Type a command or search...'
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
      <CommandList>
        {memberSearch && (
          <CommandEmpty>
            {error ? 'Error getting users' : 'No results found.'}
          </CommandEmpty>
        )}
        <CommandGroup>
          {data?.map((user) => {
            return (
              <CommandItem key={user.id}>
                <div className='flex w-full py-0 items-center'>
                  <FormField
                    control={form.control}
                    name='invitedMembers'
                    render={({ field }) => (
                      <FormItem className='space-y-0'>
                        <FormControl>
                          {/* <FormLabel>hi1</FormLabel> */}
                          <Checkbox
                            className='border-none shadow-none data-[state=checked]:bg-tally-none'
                            checked={field.value?.some(
                              (member) => member.id === user.id
                            )}
                            onCheckedChange={(checked) => {
                              handleCheckMember(form, !!checked, user);
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div
                    className='pl-2 w-full py-1 space-x-2'
                    onClick={() => {
                      const currentlyInvited = form
                        .getValues('invitedMembers')
                        ?.some((member) => member.id === user.id);

                      handleCheckMember(form, !currentlyInvited, user);
                    }}
                  >
                    <span>
                      {titleCase(user.firstName)} {titleCase(user.lastName)} |{' '}
                      {user.username}
                    </span>
                  </div>
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
