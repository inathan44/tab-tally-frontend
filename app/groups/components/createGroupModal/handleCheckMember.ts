import { SearchedUser } from '@/app/schemas/responses/searchUsers';
import { CreateGroupForm } from '@/types/forms';

export function handleCheckMember(
  form: CreateGroupForm,
  checked: boolean,
  user: SearchedUser
) {
  const currentValues = form.getValues('invitedMembers');
  if (checked) {
    form.setValue('invitedMembers', [
      ...(currentValues || []),
      { id: user.id, role: 'member' },
    ]);
  } else {
    form.setValue(
      'invitedMembers',
      (currentValues || []).filter((member) => member.id !== user.id)
    );
  }
}
