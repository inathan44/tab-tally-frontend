import { SignUpSchema } from '@/app/schemas/signup';
import {
  getAuth,
  createUserWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';
import firebaseApp from '@/firebaseConfig';
import axios, { AxiosError } from 'axios';

const auth = getAuth(firebaseApp);

type UpdateUserBody = {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
};

async function createUserInDb(body: UpdateUserBody, token: string) {
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
    console.log('error message', error);
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
