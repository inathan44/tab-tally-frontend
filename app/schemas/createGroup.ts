import { z } from 'zod';

const invitedMember = z.object({
  id: z.string(),
  role: z.enum(['admin', 'member']),
  firstName: z.string(),
  lastName: z.string(),
  username: z.string(),
});

export const createGroupSchema = z.object({
  name: z.string().min(1, { message: 'Group name is required' }),
  description: z
    .string()
    .max(255, { message: '255 characters max' })
    .optional(),
  invitedMembers: z.array(invitedMember).optional(),
});

export type InvitedMember = z.infer<typeof invitedMember>;
export type CreateGroupSchema = z.infer<typeof createGroupSchema>;
