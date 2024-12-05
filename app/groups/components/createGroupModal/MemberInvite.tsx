import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ChevronDown } from 'lucide-react';
import React from 'react';

export default function MemberInvite() {
  return (
    <div className='flex items-center justify-between space-x-4'>
      <div className='flex items-center space-x-4'>
        <Avatar className='h-8 w-8'>
          <AvatarImage src='/avatars/01.png' alt='Image' />
          <AvatarFallback>OM</AvatarFallback>
        </Avatar>
        <div>
          <p className='text-sm font-medium leading-none'>Sofia Davis</p>
          <p className='text-sm text-muted-foreground'>m@example.com</p>
        </div>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant='outline' size='sm' className='ml-auto'>
            Owner <ChevronDown className='text-muted-foreground' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='p-0' align='end'>
          <Command>
            <CommandInput placeholder='Select new role...' />
            <CommandList>
              <CommandEmpty>No roles found.</CommandEmpty>
              <CommandGroup>
                <CommandItem className='teamaspace-y-1 flex flex-col items-start px-4 py-2'>
                  <p>Viewer</p>
                  <p className='text-sm text-muted-foreground'>
                    Can view and comment.
                  </p>
                </CommandItem>
                <CommandItem className='teamaspace-y-1 flex flex-col items-start px-4 py-2'>
                  <p>Developer</p>
                  <p className='text-sm text-muted-foreground'>
                    Can view, comment and edit.
                  </p>
                </CommandItem>
                <CommandItem className='teamaspace-y-1 flex flex-col items-start px-4 py-2'>
                  <p>Billing</p>
                  <p className='text-sm text-muted-foreground'>
                    Can view, comment and manage billing.
                  </p>
                </CommandItem>
                <CommandItem className='teamaspace-y-1 flex flex-col items-start px-4 py-2'>
                  <p>Owner</p>
                  <p className='text-sm text-muted-foreground'>
                    Admin-level access to all resources.
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
