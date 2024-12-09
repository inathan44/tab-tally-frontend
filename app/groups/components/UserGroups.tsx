'use client';

import { useGetUserGroups } from '@/app/api/groups';
import Link from 'next/link';

type UserGroupsProps = {
  token: string;
};

export default function UserGroups({ token }: UserGroupsProps) {
  const { data: groups } = useGetUserGroups(token);
  return (
    <div>
      {groups?.map((group) => {
        return (
          <div key={group.id} className='border'>
            <p>{group.name}</p>
            <p>{group.description || 'No description for this group'}</p>
            <p>Members: {group.groupMembers?.length || 0}</p>
            <p>Owner: {group.createdBy?.username}</p>
            <Link href={`/groups/${group.id}`}>View</Link>
          </div>
        );
      })}
    </div>
  );
}
