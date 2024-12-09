import { SearchedUser } from '@/app/schemas/responses/searchUsers';
import { CreateGroupForm } from '@/types/forms';

export function addUserToInvitedMembers(
  form: CreateGroupForm,
  user: SearchedUser
) {
  const currentValues = form.getValues('invitedMembers');
  form.setValue('invitedMembers', [
    ...(currentValues || []),
    {
      id: user.id,
      role: 'member',
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
    },
  ]);
}

export function removeUserFromInvitedMembers(
  form: CreateGroupForm,
  user: SearchedUser
) {
  const currentValues = form.getValues('invitedMembers');
  form.setValue(
    'invitedMembers',
    (currentValues || []).filter((member) => member.id !== user.id)
  );
}
