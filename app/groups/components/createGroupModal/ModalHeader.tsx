import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function ModalHeader() {
  return (
    <DialogHeader>
      <DialogTitle>Create a Group</DialogTitle>
      <DialogDescription>
        Invite members to your group to start splitting expenses.
      </DialogDescription>
    </DialogHeader>
  );
}
