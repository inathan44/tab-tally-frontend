import { AxiosError } from 'axios';
import { CreatedUser, GetGroupResponse } from '../../../types/api';
import {
  getAllGroups,
  deleteGroup,
  createGroup,
  addMembers,
  changeStatus,
  getAllGroupMembers,
  getGroup,
} from '../../../utils/grouphelpers';
import {
  createUserInDbAndFirebase,
  generateMockUserInformation,
  deleteUserFromDbAndFirebase,
  updateUser,
  getUser,
} from '../../../utils/userhelpers';
import {
  createTransaction,
  getTransaction,
} from '../../../utils/transactionhelpers';

const users: { [key: string]: CreatedUser } = {};
const groups: GetGroupResponse[] = [];

describe('Create and setup users', () => {
  it('should create 5 users without error', async () => {
    let isError = false;
    try {
      users['ian'] = await createUserInDbAndFirebase({
        ...generateMockUserInformation(),
        firstName: 'ian',
      });
      await new Promise((resolve) => setTimeout(resolve, 600));
      users['david'] = await createUserInDbAndFirebase({
        ...generateMockUserInformation(),
        firstName: 'david',
      });
      await new Promise((resolve) => setTimeout(resolve, 600));
      users['oscar'] = await createUserInDbAndFirebase({
        ...generateMockUserInformation(),
        firstName: 'oscar',
      });
      await new Promise((resolve) => setTimeout(resolve, 600));
      users['gabe'] = await createUserInDbAndFirebase({
        ...generateMockUserInformation(),
        firstName: 'gabe',
      });
    } catch (e) {
      isError = true;
      console.error('Error creating user', e);
    }
    expect(isError).toBe(false);
  }, 30000);
});

describe('updating user information', () => {
  it('should return a 200 status code when updating a user on a valid request', async () => {
    let isError = false;
    try {
      const response = await updateUser(
        users['ian'].firebaseUser.uid,
        { lastName: 'newLastName' },
        users['ian'].firebaseToken
      );

      expect(response.status).toBe(200);
    } catch (e) {
      isError = true;
      console.error('Error updating user', e);
    }
    expect(isError).toBe(false);
  });
  it('should return the correct message when updating a user on a valid request', async () => {
    let isError = false;
    try {
      const response = await updateUser(
        users['david'].firebaseUser.uid,
        { lastName: 'newLastName' },
        users['david'].firebaseToken
      );

      expect(response.data).toBe('User updated');
    } catch (e) {
      isError = true;
      console.error('Error updating user', e);
    }
    expect(isError).toBe(false);
  });
  it('should have the updated information when getting the user', async () => {
    let isError = false;
    try {
      await updateUser(
        users['oscar'].firebaseUser.uid,
        {
          lastName: 'newLastName',
          firstName: 'newFirstName',
          email: 'new@email.com',
          username: 'newUsername__xxx',
        },
        users['oscar'].firebaseToken
      );

      const response = await getUser(
        users['oscar'].firebaseUser.uid,
        users['oscar'].firebaseToken
      );

      expect(response.data.lastName).toBe('newLastName');
      expect(response.data.firstName).toBe('newFirstName');
      expect(response.data.email).toBe('new@email.com');
      expect(response.data.username).toBe('newUsername__xxx');
    } catch (e) {
      isError = true;
      console.error('Error updating user', e);
    }
    expect(isError).toBe(false);
  });

  it('should not allow a user to update their email to a duplicate email', async () => {
    let isError = false;
    try {
      await updateUser(
        users['oscar'].firebaseUser.uid,
        { email: 'inathan44@yahoo.com' },
        users['oscar'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe('Email already in use');
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user to update their username to a duplicate username', async () => {
    let isError = false;
    try {
      await updateUser(
        users['gabe'].firebaseUser.uid,
        { username: 'inathan44' },
        users['gabe'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe('Username already in use');
    }
    expect(isError).toBe(true);
  });

  it('should not allow a username to be duplicated even if they are not exact match (case insensitive)', async () => {
    let isError = false;
    try {
      await updateUser(
        users['gabe'].firebaseUser.uid,
        { username: 'INATHAN44' },
        users['gabe'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe('Username already in use');
    }
    expect(isError).toBe(true);
  });

  it('should not allow another user to update a user', async () => {
    let isError = false;
    try {
      await updateUser(
        users['gabe'].firebaseUser.uid,
        { lastName: 'newLastName' },
        users['oscar'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'can only update your own user'
      );
    }
    expect(isError).toBe(true);
  });

  it('should only allow emails in the correct format', async () => {
    let isError = false;
    try {
      await updateUser(
        users['gabe'].firebaseUser.uid,
        { email: 'invalidEmail' },
        users['gabe'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe('Invalid email');
    }
    expect(isError).toBe(true);
  });

  it('should only allow usernames with alphanumeric characters (spaces in username)', async () => {
    let isError = false;
    try {
      await updateUser(
        users['gabe'].firebaseUser.uid,
        { username: 'invalid username' },
        users['gabe'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe('Invalid username');
    }
    expect(isError).toBe(true);
  });
  it('should only allow usernames with alphanumeric characters (special characters in username)', async () => {
    let isError = false;
    try {
      await updateUser(
        users['gabe'].firebaseUser.uid,
        { username: 'invalid@username' },
        users['gabe'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe('Invalid username');
    }
    expect(isError).toBe(true);
  });
});

describe('deleting user', () => {
  it('should return a 200 status code when deleting a user on a valid request', async () => {
    let isError = false;
    try {
      users['userToDelete'] = await createUserInDbAndFirebase({
        ...generateMockUserInformation(),
        firstName: 'userToDelete',
      });

      const response = await deleteUserFromDbAndFirebase(
        users['userToDelete'].firebaseUser.uid,
        users['userToDelete'].firebaseToken
      );

      // Cleanup user from users object
      delete users['userToDelete'];

      expect(response.status).toBe(200);
    } catch (e) {
      isError = true;
      console.error('Error creating user', e);
    }
    expect(isError).toBe(false);
  });
  it('should return the correct message when deleting a user on a valid request', async () => {
    let isError = false;
    try {
      users['userToDelete'] = await createUserInDbAndFirebase({
        ...generateMockUserInformation(),
        firstName: 'userToDelete',
      });

      const response = await deleteUserFromDbAndFirebase(
        users['userToDelete'].firebaseUser.uid,
        users['userToDelete'].firebaseToken
      );

      // Cleanup user from users object
      delete users['userToDelete'];

      expect(response.data).toBe('User deleted');
    } catch (e) {
      isError = true;
      console.error('Error creating user', e);
    }
    expect(isError).toBe(false);
  });
  it('should not allow another user to delete a user', async () => {
    let isError = false;
    try {
      await deleteUserFromDbAndFirebase(
        users['gabe'].firebaseUser.uid,
        users['oscar'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'you can only delete your own user record'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user to delete their account if they are the creator/owner of a group', async () => {
    let isError = false;
    try {
      users['groupOwner'] = await createUserInDbAndFirebase({
        ...generateMockUserInformation(),
        firstName: 'groupOwner',
      });

      const groupToDelete = await createGroup(
        { name: 'groupToDelete', description: 'groupToDelete' },
        users['groupOwner'].firebaseToken
      );

      groups.push(groupToDelete.data);

      await deleteUserFromDbAndFirebase(
        users['groupOwner'].firebaseUser.uid,
        users['groupOwner'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'you cannot delete your account as a group owner. Transfer ownership to another user first'
      );
    }
    expect(isError).toBe(true);
  });
  it('should delete their user information from all transactions without deleting transactions (transaction creator and payer)', async () => {
    let isError = false;
    try {
      users['transactionCreator'] = await createUserInDbAndFirebase({
        ...generateMockUserInformation(),
        firstName: 'transactionCreator',
      });

      const groupToDelete = await createGroup(
        { name: 'groupToDelete', description: 'groupToDelete' },
        users['ian'].firebaseToken
      );

      groups.push(groupToDelete.data);

      await addMembers(
        groupToDelete.data.id,
        { memberIds: [users['transactionCreator'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToDelete.data.id,
        users['transactionCreator'].firebaseUser.uid,
        'Joined',
        users['transactionCreator'].firebaseToken
      );

      const createdTransactionResponse = await createTransaction(
        {
          amount: 100,
          description: 'test transaction',
          groupId: groupToDelete.data.id,
          payerId: users['transactionCreator'].firebaseUser.uid,
          transactionDetails: [
            { amount: 100, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['transactionCreator'].firebaseToken
      );

      await deleteUserFromDbAndFirebase(
        users['transactionCreator'].firebaseUser.uid,
        users['transactionCreator'].firebaseToken
      );

      delete users['transactionCreator'];

      const transactionResponse = await getTransaction(
        createdTransactionResponse.data.id,
        users['ian'].firebaseToken
      );

      expect(transactionResponse.data).toBeDefined();
      expect(transactionResponse.data.payerId).toBe(null);
      expect(transactionResponse.data.createdById).toBe(null);
      expect(
        transactionResponse.data.transactionDetails[0].recipientId
      ).toBeDefined();
    } catch (e) {
      isError = true;
      console.error('Error deleting user', e);
    }
    expect(isError).toBe(false);
  });

  it('should delete their user information from all transactions without deleting transactions (transaction recipient)', async () => {
    let isError = false;
    try {
      users['transactionRecipient'] = await createUserInDbAndFirebase({
        ...generateMockUserInformation(),
        firstName: 'transactionRecipient',
      });

      const groupToDelete = await createGroup(
        { name: 'groupToDelete', description: 'groupToDelete' },
        users['ian'].firebaseToken
      );

      groups.push(groupToDelete.data);

      await addMembers(
        groupToDelete.data.id,
        { memberIds: [users['transactionRecipient'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToDelete.data.id,
        users['transactionRecipient'].firebaseUser.uid,
        'Joined',
        users['transactionRecipient'].firebaseToken
      );

      const createdTransactionResponse = await createTransaction(
        {
          amount: 100,
          description: 'test transaction',
          groupId: groupToDelete.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            {
              amount: 100,
              recipientId: users['transactionRecipient'].firebaseUser.uid,
            },
          ],
        },
        users['ian'].firebaseToken
      );

      await deleteUserFromDbAndFirebase(
        users['transactionRecipient'].firebaseUser.uid,
        users['transactionRecipient'].firebaseToken
      );

      delete users['transactionRecipient'];

      const transactionResponse = await getTransaction(
        createdTransactionResponse.data.id,
        users['ian'].firebaseToken
      );

      expect(transactionResponse.data).toBeDefined();
      expect(transactionResponse.data.payerId).toBeDefined();
      expect(transactionResponse.data.createdById).toBeDefined();
      expect(transactionResponse.data.transactionDetails[0].recipientId).toBe(
        null
      );
    } catch (e) {
      isError = true;
      console.error('Error deleting user', e);
    }
    expect(isError).toBe(false);
  });
  it('should delete user information from groups without deleting the group', async () => {
    let isError = false;
    try {
      users['userToDeleteFromGroup'] = await createUserInDbAndFirebase({
        ...generateMockUserInformation(),
        firstName: 'userToDeleteFromGroup',
      });

      const groupToDelete = await createGroup(
        { name: 'groupToDelete', description: 'groupToDelete' },
        users['ian'].firebaseToken
      );

      groups.push(groupToDelete.data);

      await addMembers(
        groupToDelete.data.id,
        { memberIds: [users['userToDeleteFromGroup'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToDelete.data.id,
        users['userToDeleteFromGroup'].firebaseUser.uid,
        'Joined',
        users['userToDeleteFromGroup'].firebaseToken
      );

      await deleteUserFromDbAndFirebase(
        users['userToDeleteFromGroup'].firebaseUser.uid,
        users['userToDeleteFromGroup'].firebaseToken
      );

      const groupMembersResponse = await getAllGroupMembers();

      expect(
        groupMembersResponse.data.some(
          (g) => g.memberId === users['userToDeleteFromGroup'].firebaseUser.uid
        )
      ).toBe(false);

      const groupResponse = await getGroup(
        groupToDelete.data.id,
        users['ian'].firebaseToken
      );
      expect(groupResponse.data).toBeDefined();
    } catch (e) {
      isError = true;
      console.error('Error deleting user', e);
    }
    expect(isError).toBe(false);
    // cleanup user
    delete users['userToDeleteFromGroup'];
  });
});

describe('Getting a single user', () => {
  it('should return a 200 status code when getting a user on a valid request', async () => {});
  it('should return the correct properties on the return object', async () => {});
  it('should return a 404 status code when getting a user that does not exist', async () => {});
  it('should return a 403 status code when getting a user that is not the user making the request', async () => {});
});

afterAll(async () => {
  try {
    const allGroupsResponse = await getAllGroups();
    for (const group of groups) {
      // Delete group
      const currentGroupId = group.id;
      const groupToDelete = allGroupsResponse.data.find(
        (g) => g.id === currentGroupId
      );
      if (!groupToDelete) {
        console.log('group not found, no deletion');
        continue;
      }
      const firstName = groupToDelete.createdBy?.firstName;
      if (!firstName) {
        console.log('no first name found, no deletion');
        continue;
      }

      await deleteGroup(
        groupToDelete.id,
        users[firstName || 'not found']?.firebaseToken
      );
    }
  } catch (error) {
    console.error(
      'Error deleting groups',
      (error as AxiosError).response?.data
    );
  }
  try {
    for (const user in users) {
      // Delete user which should also delete all associated groups
      await new Promise((resolve) => setTimeout(resolve, 600));
      await deleteUserFromDbAndFirebase(
        users[user].firebaseUser.uid,
        users[user].firebaseToken
      );
    }
  } catch (error) {
    console.error('Error deleting user', error);
  }
}, 30000);
