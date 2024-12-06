'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import ModalHeader from './ModalHeader';
import MemberInvite from './MemberInvite';
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

import MemberSearch from '@/app/groups/components/createGroupModal/MemberSearch';

export default function CreateGroupModal() {
  const form = useForm<CreateGroupSchema>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      invitedMembers: [],
    },
  });

  async function onSubmit(values: CreateGroupSchema) {
    alert('Group created' + values);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='primary'>Create Group</Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
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

            <MemberSearch form={form} />

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
