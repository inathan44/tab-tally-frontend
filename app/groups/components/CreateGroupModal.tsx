'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import ModalHeader from './createGroupModal/ModalHeader';
import MemberInvite from './createGroupModal/MemberInvite';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createGroupSchema,
  CreateGroupSchema,
} from '@/app/schemas/createGroup';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui/icons';
import { useState } from 'react';

export default function CreateGroupModal() {
  const [memberSearch, setMemberSearch] = useState('');

  const form = useForm<CreateGroupSchema>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  async function onSubmit(values: CreateGroupSchema) {
    console.log(values);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='primary'>Create Group</Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <ModalHeader />
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='font-bold'>Group Name</FormLabel>
                  <FormControl>
                    <Input {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <Label className='font-bold'>Members</Label>
            <div className='flex items-center w-full gap-2'>
              <div className='relative w-full'>
                <Icons.search className='absolute top-1/2 left-2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
                <Input
                  className='pl-8'
                  placeholder='Add members by username or email'
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </div>
              <Icons.spinner className='text-muted-foreground w-4 h-4 animate-spin' />
            </div>
            <MemberInvite />
            <Separator />
            <DialogFooter>
              <div className='flex gap-2 ml-auto'>
                <Button variant='primary'>Create Group</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
