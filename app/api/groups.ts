import { AxiosError } from 'axios';
import { CreateGroupSchema, InvitedMember } from '@/app/schemas/createGroup';
import {
  GetGroupResponse,
  GetUserGroupsResponse,
  GroupMemberStatus,
  GroupMemberSummary,
} from '@/types/api';
import axiosInstance from '@/app/api/axiosInstance';
import { useQuery } from '@tanstack/react-query';

export async function createGroup(reqBody: CreateGroupSchema, token: string) {
  try {
    const response = await axiosInstance.post<GetGroupResponse>(
      `/Groups/create`,
      reqBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response;
  } catch (error) {
    console.error('Error adding members:', error);
    if (error instanceof AxiosError && error.response) {
      throw new Error(error.response.data.toString());
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}

export async function addMembers(
  groupId: number,
  invitedMembers: InvitedMember[],
  token: string
) {
  try {
    // Transform the array to match the backend's expected structure
    const transformedMembers = invitedMembers.map((member) => ({
      id: member.id,
      role: member.role,
    }));

    const reqBody = {
      InvitedMembers: transformedMembers,
    };

    const response = await axiosInstance.post(
      `/Groups/${groupId}/addmembers`,
      reqBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response;
  } catch (error) {
    console.error('Error adding members:', error);
    throw new Error('An error occurred while adding members');
  }
}

export async function getUserGroups({
  queryKey,
}: {
  queryKey: [string, string];
}) {
  const [_, token] = queryKey;
  if (!token) {
    return [];
  }
  try {
    const response = await axiosInstance.get<GetUserGroupsResponse[]>(
      '/Users/groups',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error getting user groups:', error);
    if (error instanceof AxiosError && error.response) {
      throw new Error(error.response.data.toString());
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}

export function useGetUserGroups(token: string) {
  return useQuery({
    queryKey: ['getUserGroups', token || ''],
    queryFn: getUserGroups,
  });
}

export async function getGroup({
  queryKey,
}: {
  queryKey: [string, string, string];
}) {
  const [_, groupId, token] = queryKey;

  try {
    const response = await axiosInstance.get<GetGroupResponse>(
      `/Groups/${groupId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data;
  } catch (error) {
    console.error('Error getting group:', error);
    if (error instanceof AxiosError && error.response) {
      throw new Error(error.response.data.toString());
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}

export function useGetGroup(groupId: string, token: string) {
  return useQuery({
    queryKey: ['getGroup', groupId, token || ''],
    queryFn: getGroup,
    enabled: !!token,
  });
}

export async function getUserGroupInvites({
  queryKey,
}: {
  queryKey: [string, string];
}) {
  const [_, token] = queryKey;

  try {
    const response = await axiosInstance.get<GetUserGroupsResponse[]>(
      '/Users/groups/invites',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error getting user group invites:', error);
    if (error instanceof AxiosError && error.response) {
      throw new Error(error.response.data.toString());
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}

export function useGetUserGroupInvites(token: string) {
  return useQuery({
    queryKey: ['getUserGroupInvites', token || ''],
    queryFn: getUserGroupInvites,
  });
}

export async function changeUserGroupStatus(
  groupId: number,
  token: string,
  userId: string,
  status: GroupMemberStatus
) {
  try {
    const response = await axiosInstance.put<string>(
      `/groups/${groupId}/changestatus/${userId}`,
      status,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response;
  } catch (error) {
    console.error('Error getting user group invites:', error);
    if (error instanceof AxiosError && error.response) {
      throw new Error(error.response.data.toString());
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}

export async function checkUserMemberOfGroup(groupId: number, token: string) {
  try {
    const response = await axiosInstance.get<boolean>(
      `/groups/${groupId}/ismember`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting user group invites:', error);
    if (error instanceof AxiosError && error.response) {
      throw new Error(error.response.data.toString());
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}

export async function getMembersOfGroup({
  queryKey,
}: {
  queryKey: [string, string, string];
}) {
  const [_, groupId, token] = queryKey;

  try {
    const response = await axiosInstance.get<GroupMemberSummary[]>(
      `/groups/${groupId}/members`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting user group invites:', error);
    if (error instanceof AxiosError && error.response) {
      throw new Error(error.response.data.toString());
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}

export function useGetMembersOfGroup(groupId: string, token: string) {
  return useQuery({
    queryKey: ['getMembersOfGroup', groupId, token || ''],
    queryFn: getMembersOfGroup,
    enabled: !!token,
  });
}
