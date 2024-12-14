import { SignUpSchema } from '@/app/schemas/signup';
import {
  getAuth,
  createUserWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';
import firebaseApp from '@/firebaseConfig';
import axios, { AxiosError } from 'axios';
import { UpdateUserBody, User } from '@/types/api';
import {
  searchUsersResponse,
  SearchUsersResponse,
} from '@/app/schemas/responses/searchUsers';
import axiosInstance from './axiosInstance';
import { useQuery } from '@tanstack/react-query';

const auth = getAuth(firebaseApp);

async function getSignedInDBUser({
  queryKey,
}: {
  queryKey: [string, string, string];
}) {
  const [_, userId, token] = queryKey;
  try {
    const response = await axiosInstance.get<User>(`/Users/${userId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting user:', error);
    if (error instanceof AxiosError && error.response) {
      throw new Error(error.response.data.toString());
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}

export function useGetSignedInDBUser(token: string, userId: string) {
  return useQuery({
    queryKey: ['getSignedInDBUser', userId, token || ''],
    queryFn: getSignedInDBUser,
  });
}

export async function createUserInDb(body: UpdateUserBody, token: string) {
  return await axios.post('http://localhost:5217/api/v1/Users/create', body, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createUserInDbAndFirebase(body: SignUpSchema) {
  let updatedCreatedUserStatus;
  if (!body.email) {
    throw new Error('Email is undefined');
  }
  if (!body.firstName) {
    throw new Error('First name is undefined');
  }
  if (!body.lastName) {
    throw new Error('Last name is undefined');
  }
  if (!body.username) {
    throw new Error('Username is undefined');
  }
  // Create a user in firebase
  let createdUserObject: UserCredential;
  try {
    createdUserObject = await createUserWithEmailAndPassword(
      auth,
      body.email,
      body.password
    );
  } catch (error) {
    console.error('error creating user in firebase', error);
    throw new Error('Error creating user in firebase');
  }

  /* update the user, the user will be created because of find or create middleware then updated */
  try {
    const token = await createdUserObject.user.getIdToken();
    const response = await createUserInDb(body, token);
    updatedCreatedUserStatus = response.status;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('error message', error);
    console.error('error creating user', axiosError.response?.data);
    // Delete the user in firebase if there is an error
    await deleteUserFromDbAndFirebase(
      createdUserObject.user.uid,
      await createdUserObject.user.getIdToken()
    );
    throw new Error(
      `Error creating user: ${axiosError.response?.status}, ${JSON.stringify(
        axiosError.response?.data
      )}`
    );
  }
  return {
    firebaseUser: createdUserObject.user,
    firebaseToken: await createdUserObject.user.getIdToken(),
    status: updatedCreatedUserStatus,
    mockUser: body,
  };
}

export async function deleteUserFromDbAndFirebase(
  userId: string,
  token: string
) {
  return await axios.delete(
    `http://localhost:5217/api/v1/Users/${userId}/delete`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function searchUsers({
  queryKey,
}: {
  queryKey: [string, string, string];
}) {
  const [_, query, token] = queryKey;
  if (!query) {
    return [];
  }

  try {
    const response = await axios.get<SearchUsersResponse>(
      `http://localhost:5217/api/v1/Users/search`,
      {
        params: {
          query: query,
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const searchedUsers = searchUsersResponse.parse(response.data);
    return searchedUsers;
  } catch (error) {
    console.error('Error searching users:', error);
  }
}
