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
import { addMembers, createGroup } from '@/app/api/groups';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebaseConfig';

export default function CreateGroupModal() {
  const [user] = useAuthState(auth);

  const queryClient = useQueryClient();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const MAX_DESCRIPTION_LENGTH = 255;

  const addMembersMutation = useMutation({
    mutationFn: async ({
      groupId,
      invitedMembers,
    }: {
      groupId: number;
      invitedMembers: CreateGroupSchema['invitedMembers'];
    }) => {
      const token = await user?.getIdToken();
      return addMembers(groupId, invitedMembers || [], token || '');
    },
    onSettled: async () => {
      const token = await user?.getIdToken();
      await queryClient.invalidateQueries({
        queryKey: ['getUserGroups', token || ''],
      });
      setIsOpen(false); // Close whether or not this fails because we know the group was created, send a notification of invite failure
    },
    onSuccess: async (_, ctx) => {
      router.push(`/groups/${ctx?.groupId}`);
    },
    onError: async (error, ctx) => {
      router.push(`/groups/${ctx?.groupId}?inviteError=true`);
    },
    onMutate: async () => {
      const token = await user?.getIdToken();
      await queryClient.cancelQueries({
        queryKey: ['getUserGroups', token || ''],
      });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (values: CreateGroupSchema) => {
      const token = await user?.getIdToken();
      return createGroup(values, token || '');
    },
    onSuccess: async (response, values) => {
      form.reset();

      const group = response.data;
      await addMembersMutation.mutateAsync({
        groupId: group.id,
        invitedMembers: values.invitedMembers || [],
      });
    },
    onSettled: async () => {
      const token = await user?.getIdToken();
      await queryClient.invalidateQueries({
        queryKey: ['getUserGroups', token || ''],
      });
    },
  });

  const isLoading =
    createGroupMutation.isPending || addMembersMutation.isPending;

  const form = useForm<CreateGroupSchema>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      invitedMembers: [],
    },
  });

  async function onSubmit(values: CreateGroupSchema) {
    createGroupMutation.mutate(values);
  }

  const invitedMembers = form.watch('invitedMembers');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='primary'>Create Group</Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {createGroupMutation.isError && (
              <p className='text-red-500'>
                {createGroupMutation.error.toString()}
              </p>
            )}
            <ModalHeader />
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='font-bold'>Group Name</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete='off' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => {
                const descriptionValue = field.value || '';
                if (descriptionValue.length > MAX_DESCRIPTION_LENGTH) {
                  field.onChange(
                    descriptionValue.slice(0, MAX_DESCRIPTION_LENGTH)
                  );
                }
                return (
                  <FormItem>
                    <FormLabel className='font-bold'>
                      Description{' '}
                      <small className='text-gray-600 font-light'>
                        optional
                      </small>
                    </FormLabel>
                    <FormControl>
                      <div>
                        <Textarea {...field} value={descriptionValue} />
                        <small>
                          {field.value?.length}/{MAX_DESCRIPTION_LENGTH}
                        </small>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <Separator />

            <MemberSearch form={form} />

            {invitedMembers?.map((member) => (
              <MemberInvite key={member.id} invitedUser={member} form={form} />
            ))}
            <Separator />
            <DialogFooter>
              <div className='flex gap-2 ml-auto'>
                <Button variant='primary' disabled={isLoading}>
                  {isLoading ? 'Creating Group...' : 'Create Group'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
