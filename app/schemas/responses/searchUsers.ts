import { z } from 'zod';

const searchedUser = z.object({
  id: z.string(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

export const searchUsersResponse = z.array(searchedUser);

export type SearchedUser = z.infer<typeof searchedUser>;
export type SearchUsersResponse = z.infer<typeof searchUsersResponse>;
