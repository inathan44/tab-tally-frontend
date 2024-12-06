import { z } from 'zod';

const invitedMember = z.object({
  id: z.string(),
  role: z.enum(['admin', 'member']),
});

export const createGroupSchema = z.object({
  name: z.string().min(1, { message: 'Group name is required' }),
  description: z.string().optional(),
  invitedMembers: z.array(invitedMember).optional(),
});

export type CreateGroupSchema = z.infer<typeof createGroupSchema>;
