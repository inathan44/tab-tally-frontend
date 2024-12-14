import { useQuery } from '@tanstack/react-query';
import { User } from 'firebase/auth';

export function useClientToken(user: User | undefined | null) {
  return useQuery({
    queryKey: ['clientToken', user],
    queryFn: async () => {
      if (user) {
        return await user.getIdToken();
      }
      return null;
    },
    enabled: !!user, // Only run the query if the user is authenticated
    refetchInterval: 1000 * 60,
    refetchOnWindowFocus: 'always',
  });
}
