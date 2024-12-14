import { z } from 'zod';

// Used for users who make accounts without email/password (i.e Google Auth) so we need to create a user in the database after they sign up

export const createUserInfoSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  username: z.string(),
});

export type CreateUserInfo = z.infer<typeof createUserInfoSchema>;
