import axios, { AxiosError } from 'axios';
import {
  CreatedUser,
  GetGroupResponse,
  GroupMemberStatus,
} from '../../../types/api';
import {
  createUserInDbAndFirebase,
  deleteUserFromDbAndFirebase,
  generateMockUserInformation,
} from '../../../utils/userhelpers';
import {
  addMembers,
  changeStatus,
  createGroup,
  deleteGroup,
  demoteAdminToMember,
  getAllGroupMembers,
  getAllGroups,
  getGroup,
  leaveGroup,
  promoteMemberToAdmin,
  removeMember,
  transferGroupOwnership,
  updateGroup,
} from '../../../utils/grouphelpers';
import { createTransaction } from '../../../utils/transactionhelpers';

let users: { [key: string]: CreatedUser } = {};
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

describe('Creating groups', () => {
  it('should return a successful status code of 201', async () => {
    let isError = false;
    try {
      for (const user in users) {
        const group = await createGroup(
          {
            name: `Test Group ${user}`,
            description: `This is a test group ${user}`,
          },
          users[user].firebaseToken
        );

        groups.push(group.data);

        expect(group.status).toBe(201);
      }
    } catch (e) {
      isError = true;
      console.error('Error creating group', e);
    }
    expect(isError).toBe(false);
  });

  it('database should have more groups than before creation', async () => {
    let isError = false;
    try {
      const currentGroupResponse = await getAllGroups();
      const currentNumberOfGroups = currentGroupResponse.data.length;

      for (const user in users) {
        const group = await createGroup(
          {
            name: `Test Group ${user}`,
            description: `This is a test group ${user}`,
          },
          users[user].firebaseToken
        );
        groups.push(group.data);
        expect(group.status).toBe(201);
      }

      const updatedGroupResponse = await getAllGroups();
      expect(updatedGroupResponse.data.length).toBe(
        currentNumberOfGroups + Object.keys(users).length
      );
    } catch (e) {
      isError = true;
      const axiosError = e as AxiosError;
      console.error('Error getting groups', axiosError.response?.data);
    }
    expect(isError).toBe(false);
  });

  it('should not allow a user to create a group with an invalid token', async () => {
    let isError = false;
    try {
      const group = await createGroup(
        {
          name: `Test Group`,
          description: `This is a test group`,
        },
        'invalid token'
      );
      groups.push(group.data);
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(401);
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user to create a group without a token', async () => {
    let isError = false;
    try {
      const response = await axios.post(
        'http://localhost:5217/api/v1/Groups/create',
        {
          name: `Test Group`,
          description: `This is a test group`,
        }
      );
    } catch (e) {
      isError = true;
      // Should send bad request without auth header
      expect((e as AxiosError).response?.status).toBe(400);
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user to create a group without a name', async () => {
    let isError = false;
    try {
      const group = await createGroup(
        {
          name: '',
          description: `This is a test group`,
        },
        users['ian'].firebaseToken
      );
      groups.push(group.data);
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
    }
    expect(isError).toBe(true);
  });

  it('should allow a user to create a group without a description', async () => {
    let isError = false;
    try {
      const group = await createGroup(
        {
          name: `Test Group without a description`,
        },
        users['ian'].firebaseToken
      );
      groups.push(group.data);
      expect(group.status).toBe(201);
    } catch (e) {
      isError = true;
      console.error('Error creating group', e);
    }
    expect(isError).toBe(false);
  });

  it('should not allow a name longer than 50 characters', async () => {
    let isError = false;
    try {
      const group = await createGroup(
        {
          name: 'This is a group name that is longer than 50 characters',
          description: `This is a test group`,
        },
        users['ian'].firebaseToken
      );
      groups.push(group.data);
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
    }
    expect(isError).toBe(true);
  });

  it('should not allow a description longer than 255 characters', async () => {
    let isError = false;
    try {
      const group = await createGroup(
        {
          name: 'Too long description',
          description:
            'This description is too long so it can not be used as a valid description and therefore this test case should fail. This group will not be added to the database and a 400 error code should be returned which means bad request. This will be a very long description that will be over 255 characters long.',
        },
        users['ian'].firebaseToken
      );
      groups.push(group.data);
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
    }
    expect(isError).toBe(true);
  });

  it('should have the createdBy field set to the user that created the group', async () => {
    let isError = false;
    try {
      const newGroup = await createGroup(
        {
          name: 'Test Group',
          description: 'This is a test group',
        },
        users['oscar'].firebaseToken
      );
      groups.push(newGroup.data);
      const group = await getGroup(
        newGroup.data.id,
        users['oscar'].firebaseToken
      );

      expect(group.data.createdById).toBe(users['oscar'].firebaseUser.uid);
    } catch (e) {
      isError = true;
      console.error('Error creating group', e);
    }
    expect(isError).toBe(false);
  });

  it('should have all of the correct properties', async () => {
    let isError = false;
    try {
      const createdGroup = await createGroup(
        {
          name: 'Correct Properties',
          description: 'Checking for correct properties',
        },
        users['ian'].firebaseToken
      );

      groups.push(createdGroup.data);

      const newGroupResponse = await getGroup(
        createdGroup.data.id,
        users['ian'].firebaseToken
      );

      expect(Object.keys(newGroupResponse.data)).toEqual([
        'id',
        'name',
        'description',
        'createdById',
        'createdBy',
        'createdAt',
        'updatedAt',
        'groupMembers',
        'transactions',
      ]);
    } catch (e) {
      isError = true;
      const axiosError = e as AxiosError;
      console.error('Error creating group', axiosError.response?.data);
    }
    expect(isError).toBe(false);
  });

  it('should have the correct values for the properties', async () => {
    let isError = false;
    try {
      const { data: newGroup } = await createGroup(
        {
          name: 'Correct Values',
          description: 'Checking for correct values',
        },
        users['ian'].firebaseToken
      );

      groups.push(newGroup);

      expect(newGroup.name).toBe('Correct Values');
      expect(newGroup.description).toBe('Checking for correct values');
      expect(newGroup.createdById).toBe(users['ian'].firebaseUser.uid);
      expect(newGroup.createdAt).toBeDefined();
      expect(newGroup.updatedAt).toBeDefined();
      expect(newGroup.groupMembers).toBeDefined();
      expect(newGroup.createdBy).toBeDefined();
    } catch (e) {
      isError = true;
      console.error('Error creating group', e);
    }
    expect(isError).toBe(false);
  });

  it('should have the correct properties for the createdBy field', async () => {
    let isError = false;
    try {
      const { data: newGroup } = await createGroup(
        {
          name: 'Correct CreatedBy',
          description: 'Checking for correct createdBy',
        },
        users['ian'].firebaseToken
      );
      groups.push(newGroup);

      expect(Object.keys(newGroup.createdBy || {})).toEqual([
        'id',
        'username',
        'firstName',
        'lastName',
        'createdAt',
        'updatedAt',
      ]);
    } catch (e) {
      isError = true;
      console.error('Error creating group', e);
    }
    expect(isError).toBe(false);
  });

  it('should have the correct values for the createdBy field', async () => {
    let isError = false;
    try {
      const { data: newGroup } = await createGroup(
        {
          name: 'Correct CreatedBy',
          description: 'Checking for correct createdBy',
        },
        users['ian'].firebaseToken
      );
      groups.push(newGroup);

      expect(newGroup.createdBy).toBeDefined();
      expect(newGroup.createdBy?.id).toBe(users['ian'].firebaseUser.uid);
      expect(newGroup.createdBy?.username).toBe(users['ian'].mockUser.username);
      expect(newGroup.createdBy?.email).toBeUndefined();
      expect(newGroup.createdBy?.firstName).toBe(
        users['ian'].mockUser.firstName
      );
      expect(newGroup.createdBy?.lastName).toBe(users['ian'].mockUser.lastName);
      expect(newGroup.createdBy?.createdAt).toBeDefined();
      expect(newGroup.createdBy?.updatedAt).toBeDefined();
      expect(newGroup.createdBy?.groupMembers).toBeUndefined();
    } catch (e) {
      isError = true;
      console.error('Error creating group', e);
    }
    expect(isError).toBe(false);
  });

  it('should have the correct properties for the groupMembers field', async () => {
    let isError = false;
    try {
      const { data: newGroup } = await createGroup(
        {
          name: 'Correct GroupMembers',
          description: 'Checking for correct groupMembers',
        },
        users['ian'].firebaseToken
      );
      groups.push(newGroup);

      expect(newGroup.groupMembers).toBeDefined();
      expect(newGroup.groupMembers?.length).toBe(1);
      expect(Object.keys(newGroup.groupMembers?.[0] || {})).toEqual([
        'id',
        'groupId',
        'memberId',
        'member',
        'invitedById',
        'isAdmin',
        'status',
        'createdAt',
        'updatedAt',
      ]);
    } catch (e) {
      isError = true;
      console.error('Error creating group', e);
    }
    expect(isError).toBe(false);
  });

  it('should have the transactions property but it should be an empty array', async () => {
    let isError = false;
    try {
      const newGroup = await createGroup(
        {
          name: 'Correct Transactions',
          description: 'Checking for correct transactions',
        },
        users['ian'].firebaseToken
      );
      groups.push(newGroup.data);

      const getNewGroup = await getGroup(
        newGroup.data.id,
        users['ian'].firebaseToken
      );

      expect(getNewGroup.data.transactions).toBeDefined();
      expect(getNewGroup.data.transactions?.length).toBe(0);
    } catch (e) {
      isError = true;
      console.error('Error creating group', e);
    }
    expect(isError).toBe(false);
  });

  it('should have the correct values for the groupMembers field', async () => {
    let isError = false;
    try {
      const { data: newGroup } = await createGroup(
        {
          name: 'Correct GroupMembers',
          description: 'Checking for correct groupMembers',
        },
        users['ian'].firebaseToken
      );
      groups.push(newGroup);

      expect(newGroup.groupMembers).toBeDefined();
      expect(newGroup.groupMembers?.length).toBe(1);
      expect(newGroup.groupMembers?.[0].id).toBeDefined();
      expect(newGroup.groupMembers?.[0].groupId).toBe(newGroup.id);
      expect(newGroup.groupMembers?.[0].memberId).toBe(
        users['ian'].firebaseUser.uid
      );
      expect(newGroup.groupMembers?.[0].isAdmin).toBe(true);
      expect(newGroup.groupMembers?.[0].createdAt).toBeDefined();
      expect(newGroup.groupMembers?.[0].updatedAt).toBeDefined();
      expect(newGroup.groupMembers?.[0].status).toBe('Joined');
      expect(newGroup.groupMembers?.[0].invitedById).toBe(
        users['ian'].firebaseUser.uid
      );
    } catch (e) {
      isError = true;
      console.error('Error creating group', e);
    }
    expect(isError).toBe(false);
  });
});

describe('Getting one group', () => {
  it('should return a successful status code of 200', async () => {
    let isError = false;
    try {
      const groupToGet = await createGroup(
        {
          name: 'Group to retrieve',
          description: 'This is a group to retrieve',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToGet.data);

      const response = await getGroup(
        groupToGet.data.id,
        users['ian'].firebaseToken
      );
      expect(response.status).toBe(200);
    } catch (e) {
      isError = true;
      console.error('Error getting groups', e);
    }
    expect(isError).toBe(false);
  });
  it('should return the correct group', async () => {
    let isError = false;
    try {
      const groupToGet = await createGroup(
        {
          name: 'Group to retrieve',
          description: 'This is a group to retrieve',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToGet.data);

      const response = await getGroup(
        groupToGet.data.id,
        users['ian'].firebaseToken
      );
      expect(response.data.id).toBe(groupToGet.data.id);
      expect(response.data.name).toBe('Group to retrieve');
      expect(response.data.description).toBe('This is a group to retrieve');
    } catch (e) {
      isError = true;
      console.error('Error getting groups', e);
    }
    expect(isError).toBe(false);
  });

  it('should have the correct properties on the group object', async () => {
    let isError = false;
    try {
      const groupToGet = await createGroup(
        {
          name: 'property check',
          description: 'property check description',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToGet.data);

      const response = await getGroup(
        groupToGet.data.id,
        users['ian'].firebaseToken
      );
      const group = response.data;
      expect(Object.keys(group)).toEqual([
        'id',
        'name',
        'description',
        'createdById',
        'createdBy',
        'createdAt',
        'updatedAt',
        'groupMembers',
        'transactions',
      ]);
    } catch (e) {
      isError = true;
      console.error('Error getting groups', e);
    }
    expect(isError).toBe(false);
  });
  it('should have the correct values on the group object', async () => {
    let isError = false;
    try {
      const groupToGet = await createGroup(
        {
          name: 'value check',
          description: 'value check description',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToGet.data);

      const response = await getGroup(
        groupToGet.data.id,
        users['ian'].firebaseToken
      );

      const group = response.data;
      expect(group.name).toBe('value check');
      expect(group.description).toBe('value check description');
      expect(group.createdById).toBe(users['ian'].firebaseUser.uid);
      expect(group.id).toBe(groupToGet.data.id);
      expect(group.groupMembers).toBeDefined();
      expect(group.groupMembers?.length).toBe(1);
      expect(group.createdBy).toBeDefined();
    } catch (e) {
      isError = true;
      console.error('Error getting groups', e);
    }
    expect(isError).toBe(false);
  });

  it('should have the correct properties on the createdBy field', async () => {
    let isError = false;
    try {
      const groupToGet = await createGroup(
        {
          name: 'createdBy check',
          description: 'createdBy check description',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToGet.data);

      const response = await getGroup(
        groupToGet.data.id,
        users['ian'].firebaseToken
      );

      const group = response.data;
      expect(Object.keys(group.createdBy || {})).toEqual([
        'id',
        'username',
        'firstName',
        'lastName',
        'createdAt',
        'updatedAt',
      ]);
    } catch (e) {
      isError = true;
      console.error('Error getting groups', e);
    }
    expect(isError).toBe(false);
  });

  it('should have the correct values on the createdBy field', async () => {
    let isError = false;
    try {
      const groupToGet = await createGroup(
        {
          name: 'createdBy check',
          description: 'createdBy check description',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToGet.data);

      const response = await getGroup(
        groupToGet.data.id,
        users['ian'].firebaseToken
      );

      const group = response.data;
      expect(group.createdBy).toBeDefined();
      expect(group.createdBy?.id).toBe(users['ian'].firebaseUser.uid);
      expect(group.createdBy?.username).toBe(users['ian'].mockUser.username);
      expect(group.createdBy?.email).toBeUndefined();
      expect(group.createdBy?.firstName).toBe(users['ian'].mockUser.firstName);
      expect(group.createdBy?.lastName).toBe(users['ian'].mockUser.lastName);
      expect(group.createdBy?.createdAt).toBeDefined();
      expect(group.createdBy?.updatedAt).toBeDefined();
      expect(group.createdBy?.groupMembers).toBeUndefined();
    } catch (e) {
      isError = true;
      console.error('Error getting groups', e);
    }
    expect(isError).toBe(false);
  });

  it('should have the correct properties on the groupMembers field', async () => {
    let isError = false;
    try {
      const groupToGet = await createGroup(
        {
          name: 'groupMembers check',
          description: 'groupMembers check description',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToGet.data);

      const response = await getGroup(
        groupToGet.data.id,
        users['ian'].firebaseToken
      );

      const group = response.data;
      expect(group.groupMembers).toBeDefined();
      expect(group.groupMembers?.length).toBe(1);
      expect(Object.keys(group.groupMembers?.[0] || {})).toEqual([
        'id',
        'groupId',
        'memberId',
        'member',
        'invitedById',
        'isAdmin',
        'status',
        'createdAt',
        'updatedAt',
      ]);
    } catch (e) {
      isError = true;
      console.error('Error getting groups', e);
    }
    expect(isError).toBe(false);
  });

  it('should have the correct properties on the transactions field', async () => {
    let isError = false;
    try {
      const groupToGet = await createGroup(
        {
          name: 'transactions check',
          description: 'transactions check description',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToGet.data);

      await addMembers(
        groupToGet.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToGet.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      // add a transaction to the group
      await createTransaction(
        {
          amount: 100,
          description: 'Test transaction',
          groupId: groupToGet.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 100, recipientId: users['david'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      const response = await getGroup(
        groupToGet.data.id,
        users['ian'].firebaseToken
      );

      const group = response.data;
      expect(group.transactions).toBeDefined();
      expect(group.transactions?.length).toBe(1);

      for (const transaction of group.transactions || {}) {
        expect(Object.keys(transaction || {})).toEqual([
          'id',
          'amount',
          'createdById',
          'createdBy',
          'payerId',
          'payer',
          'description',
          'createdAt',
          'updatedAt',
          'groupId',
          'transactionDetails',
        ]);
      }
    } catch (e) {
      isError = true;
      const axiosError = e as AxiosError;
      console.error(e);
      console.error('Error getting groups', axiosError.response?.data);
    }
    expect(isError).toBe(false);
  });

  it('should have the correct values on the transactions field', async () => {
    let isError = false;
    try {
      const groupToGet = await createGroup(
        {
          name: 'transactions check',
          description: 'transactions check description',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToGet.data);

      await addMembers(
        groupToGet.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToGet.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await addMembers(
        groupToGet.data.id,
        { memberIds: [users['oscar'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToGet.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      // add a transaction to the group
      await createTransaction(
        {
          amount: 100,
          description: 'Test transaction',
          groupId: groupToGet.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 100, recipientId: users['david'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      await createTransaction(
        {
          amount: 50,
          description: 'Test transaction 2',
          groupId: groupToGet.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 25, recipientId: users['oscar'].firebaseUser.uid },
            { amount: 25, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      const response = await getGroup(
        groupToGet.data.id,
        users['ian'].firebaseToken
      );

      const group = response.data;

      expect(group.transactions).toBeDefined();
      expect(group.transactions?.length).toBe(2);
      expect(group.transactions?.[0].amount).toBe(100);
      expect(group.transactions?.[0].description).toBe('Test transaction');
      expect(group.transactions?.[0].groupId).toBe(groupToGet.data.id);
      expect(group.transactions?.[0].payerId).toBe(
        users['ian'].firebaseUser.uid
      );
      expect(group.transactions?.[0].transactionDetails).toBeDefined();
      expect(group.transactions?.[0].transactionDetails?.length).toBe(1);

      expect(group.transactions?.[1].amount).toBe(50);
      expect(group.transactions?.[1].description).toBe('Test transaction 2');
      expect(group.transactions?.[1].groupId).toBe(groupToGet.data.id);
      expect(group.transactions?.[1].payerId).toBe(
        users['david'].firebaseUser.uid
      );
      expect(group.transactions?.[1].transactionDetails).toBeDefined();
      expect(group.transactions?.[1].transactionDetails?.length).toBe(2);
      for (const transaction of group.transactions || []) {
        expect(transaction.transactionDetails).toBeDefined();
        expect(transaction.transactionDetails?.length).toBeGreaterThan(0);
        for (const transactionDetail of transaction.transactionDetails || []) {
          expect(Object.keys(transactionDetail)).toEqual([
            'id',
            'transactionId',
            'recipientId',
            'recipient',
            'amount',
          ]);
        }
      }
    } catch (e) {
      isError = true;
      console.error('Error getting groups', e);
    }
    expect(isError).toBe(false);
  });

  it('should have the correct values on the groupMembers field', async () => {
    let isError = false;
    try {
      const groupToGet = await createGroup(
        {
          name: 'groupMembers check',
          description: 'groupMembers check description',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToGet.data);

      const response = await getGroup(
        groupToGet.data.id,
        users['ian'].firebaseToken
      );

      const group = response.data;
      expect(group.groupMembers).toBeDefined();
      expect(group.groupMembers?.length).toBe(1);
      expect(group.groupMembers?.[0].id).toBeDefined();
      expect(group.groupMembers?.[0].groupId).toBe(group.id);
      expect(group.groupMembers?.[0].memberId).toBe(
        users['ian'].firebaseUser.uid
      );
      expect(group.groupMembers?.[0].isAdmin).toBe(true);
      expect(group.groupMembers?.[0].createdAt).toBeDefined();
      expect(group.groupMembers?.[0].updatedAt).toBeDefined();
      expect(group.groupMembers?.[0].status).toBe('Joined');
      expect(group.groupMembers?.[0].invitedById).toBe(
        users['ian'].firebaseUser.uid
      );
    } catch (e) {
      isError = true;
      console.error('Error getting groups', e);
    }
    expect(isError).toBe(false);
  });

  it('should not allow a user to get a group if they are not a member', async () => {
    let isError = false;
    try {
      const groupToGet = await createGroup(
        {
          name: 'groupMembers check',
          description: 'groupMembers check description',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToGet.data);

      const response = await getGroup(
        groupToGet.data.id,
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'Forbidden: You must be a member of the group to view it'
      );
    }
    expect(isError).toBe(true);
  });

  it('should send a 404 status code if the group does not exist', async () => {
    let isError = false;
    try {
      const response = await getGroup(999999, users['ian'].firebaseToken);
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe('Group not found');
    }
    expect(isError).toBe(true);
  });
});

describe('Updating groups', () => {
  it('should respond with a 200 status code', async () => {
    let isError = false;
    try {
      const groupToUpdate = await createGroup(
        { name: 'Group to update', description: 'This is a group to update' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdate.data);

      const response = await updateGroup(
        groupToUpdate.data.id,
        { description: 'Updated description', name: 'updated named' },
        users['ian'].firebaseToken
      );
      expect(response.status).toBe(200);
    } catch (e) {
      isError = true;
      console.error('Error updating group', e);
    }
    expect(isError).toBe(false);
  });

  it('should return the right message when updated', async () => {
    let isError = false;
    try {
      const groupToUpdate = await createGroup(
        { name: 'Group to update', description: 'This is a group to update' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdate.data);
      const response = await updateGroup(
        groupToUpdate.data.id,
        { description: 'Updated description', name: 'updated named' },
        users['ian'].firebaseToken
      );
      expect(response.data).toBe('Group updated');
    } catch (e) {
      isError = true;
      console.error('Error updating group', e);
    }
    expect(isError).toBe(false);
  });

  it('should update when only a name is provided', async () => {
    let isError = false;
    try {
      const groupToUpdate = await createGroup(
        { name: 'Group to update', description: 'This is a group to update' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdate.data);
      await updateGroup(
        groupToUpdate.data.id,
        { name: 'updated named' },
        users['ian'].firebaseToken
      );

      const updatedGroup = await getGroup(
        groupToUpdate.data.id,
        users['ian'].firebaseToken
      );

      expect(updatedGroup.data.name).toBe('updated named');
      expect(updatedGroup.data.description).toBe('This is a group to update');
    } catch (e) {
      isError = true;
      console.error('Error updating group', e);
    }
    expect(isError).toBe(false);
  });

  it('should update when only a description is provided', async () => {
    let isError = false;
    try {
      const groupToUpdate = await createGroup(
        { name: 'Group to update', description: 'This is a group to update' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdate.data);
      await updateGroup(
        groupToUpdate.data.id,
        { description: 'Updated description' },
        users['ian'].firebaseToken
      );

      const updatedGroup = await getGroup(
        groupToUpdate.data.id,
        users['ian'].firebaseToken
      );

      expect(updatedGroup.data.name).toBe('Group to update');
      expect(updatedGroup.data.description).toBe('Updated description');
    } catch (e) {
      isError = true;
      console.error('Error updating group', e);
    }
    expect(isError).toBe(false);
  });

  it('should update both name and description', async () => {
    let isError = false;
    try {
      const groupToUpdate = await createGroup(
        { name: 'Group to update', description: 'This is a group to update' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdate.data);
      await updateGroup(
        groupToUpdate.data.id,
        { description: 'Updated description', name: 'updated named' },
        users['ian'].firebaseToken
      );

      const updatedGroup = await getGroup(
        groupToUpdate.data.id,
        users['ian'].firebaseToken
      );

      expect(updatedGroup.data.name).toBe('updated named');
      expect(updatedGroup.data.description).toBe('Updated description');
    } catch (e) {
      isError = true;
      console.error('Error updating group', e);
    }
    expect(isError).toBe(false);
  });

  it('should update the updatedAt field', async () => {
    let isError = false;
    try {
      const groupToUpdate = await createGroup(
        { name: 'Group to update', description: 'This is a group to update' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdate.data);

      await updateGroup(
        groupToUpdate.data.id,
        { description: 'Updated description' },
        users['ian'].firebaseToken
      );

      const updatedGroup = await getGroup(
        groupToUpdate.data.id,
        users['ian'].firebaseToken
      );

      expect(updatedGroup.data.updatedAt).not.toBe(
        groupToUpdate.data.updatedAt
      );
    } catch (e) {
      isError = true;
      console.error('Error updating group', e);
    }
    expect(isError).toBe(false);
  });

  it('should not allow a user to update a group if they are not a member', async () => {
    let isError = false;
    try {
      const groupToUpdate = await createGroup(
        { name: 'Group to update', description: 'This is a group to update' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdate.data);
      const response = await updateGroup(
        groupToUpdate.data.id,
        { description: 'Updated description' },
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'Forbidden: You must be a member of the group to update it'
      );
    }
    expect(isError).toBe(true);
  });

  it('should return a 404 status code if the group does not exist', async () => {
    let isError = false;
    try {
      const response = await updateGroup(
        999999,
        { description: 'Updated description' },
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe('Group not found');
    }
    expect(isError).toBe(true);
  });

  it('should return bad request if the request does not have a name or description', async () => {
    let isError = false;
    try {
      const groupToUpdate = await createGroup(
        { name: 'Group to update', description: 'This is a group to update' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdate.data);

      const response = await updateGroup(
        groupToUpdate.data.id,
        {},
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe(
        'You must provide a name or description to update the group'
      );
    }
    expect(isError).toBe(true);
  });

  it('should return bad request if the request has a name longer than 50 characters', async () => {
    let isError = false;
    try {
      const groupToUpdate = await createGroup(
        { name: 'Group to update', description: 'This is a group to update' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdate.data);

      const response = await updateGroup(
        groupToUpdate.data.id,
        {
          name: 'This is a group name that is longer than 50 characters',
        },
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe(
        'Group name must be between 1 and 50 characters'
      );
    }
    expect(isError).toBe(true);
  });

  it('should return bad request if the request has a description longer than 255 characters', async () => {
    let isError = false;
    try {
      const groupToUpdate = await createGroup(
        { name: 'Group to update', description: 'This is a group to update' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdate.data);

      const response = await updateGroup(
        groupToUpdate.data.id,
        {
          description:
            'This description is too long so it can not be used as a valid description and therefore this test case should fail. This group will not be added to the database and a 400 error code should be returned which means bad request. This will be a very long description that will be over 255 characters long.',
        },
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe(
        'Group description must be less than 255 characters'
      );
    }
    expect(isError).toBe(true);
  });

  it('should return bad request if the name is empty', async () => {
    let isError = false;
    try {
      const groupToUpdate = await createGroup(
        { name: 'Group to update', description: 'This is a group to update' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdate.data);

      const response = await updateGroup(
        groupToUpdate.data.id,
        { name: '' },
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe(
        'Group name must be between 1 and 50 characters'
      );
    }
    expect(isError).toBe(true);
  });

  it('should only allow users that are admins to update a group (user is invited)', async () => {
    let isError = false;
    try {
      const groupToUpdate = await createGroup(
        { name: 'Group to update', description: 'This is a group to update' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdate.data);

      // Invite user to group
      await addMembers(
        groupToUpdate.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await updateGroup(
        groupToUpdate.data.id,
        { description: 'Updated description' },
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'Forbidden: You must be a member of the group to update it'
      );
    }
    expect(isError).toBe(true);
  });

  it('should only allow users that are admins to update a group (user is not invited)', async () => {
    let isError = false;
    try {
      const groupToUpdate = await createGroup(
        { name: 'Group to update', description: 'This is a group to update' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdate.data);

      await updateGroup(
        groupToUpdate.data.id,
        { description: 'Updated description' },
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'Forbidden: You must be a member of the group to update it'
      );
    }
    expect(isError).toBe(true);
  });

  it('should only allow users that are admins to update a group (user is a member)', async () => {
    let isError = false;
    try {
      const groupToUpdate = await createGroup(
        { name: 'Group to update', description: 'This is a group to update' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdate.data);

      // Invite user to group
      await addMembers(
        groupToUpdate.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      // Accept invite
      await changeStatus(
        groupToUpdate.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      // Check that user is a member
      const group = await getGroup(
        groupToUpdate.data.id,
        users['david'].firebaseToken
      );

      expect(group.data.groupMembers?.length).toBe(2);
      expect(group.data.groupMembers?.[1].status).toBe('Joined');
      expect(group.data.groupMembers?.[1].isAdmin).toBe(false);
      expect(group.data.groupMembers?.[1].member?.firstName).toBe('david');

      await updateGroup(
        groupToUpdate.data.id,
        { description: 'Updated description' },
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'Forbidden: You must be an admin of the group to update it'
      );
    }
    expect(isError).toBe(true);
  });

  it('should allow a user that is not the creator who joins and is promoted to admin to update the group', async () => {
    let isError = false;
    try {
      const groupToUpdate = await createGroup(
        { name: 'Group to update', description: 'This is a group to update' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdate.data);

      // Invite user to group
      await addMembers(
        groupToUpdate.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      // Accept invite
      await changeStatus(
        groupToUpdate.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      // Promote user to admin
      await promoteMemberToAdmin(
        groupToUpdate.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      await updateGroup(
        groupToUpdate.data.id,
        { description: 'Updated description' },
        users['david'].firebaseToken
      );

      const updatedGroup = await getGroup(
        groupToUpdate.data.id,
        users['ian'].firebaseToken
      );

      expect(updatedGroup.data.description).toBe('Updated description');
    } catch (e) {
      isError = true;
      const axiosError = e as AxiosError;
      console.error('Error updating group', axiosError.response?.data);
    }
    expect(isError).toBe(false);
  });
});

describe('Deleting groups', () => {
  it('should return a 200 status code', async () => {
    let isError = false;
    try {
      const groupToDelete = await createGroup(
        { name: 'Group to delete', description: 'This is a group to delete' },
        users['ian'].firebaseToken
      );
      groups.push(groupToDelete.data);

      const response = await deleteGroup(
        groupToDelete.data.id,
        users['ian'].firebaseToken
      );
      expect(response.status).toBe(200);
    } catch (e) {
      isError = true;
      console.error('Error deleting group', e);
    }
    expect(isError).toBe(false);
  });

  it('should return the right message upon deletion', async () => {
    let isError = false;
    try {
      const groupToDelete = await createGroup(
        { name: 'Group to delete', description: 'This is a group to delete' },
        users['ian'].firebaseToken
      );
      groups.push(groupToDelete.data);

      const response = await deleteGroup(
        groupToDelete.data.id,
        users['ian'].firebaseToken
      );
      expect(response.data).toBe('Group deleted');
    } catch (e) {
      isError = true;
      console.error('Error deleting group', e);
    }
    expect(isError).toBe(false);
  });

  it('should return a 404 status code if the group does not exist', async () => {
    let isError = false;
    try {
      const response = await deleteGroup(999999, users['ian'].firebaseToken);
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe('Group not found');
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user to delete a group if they are not a member', async () => {
    let isError = false;
    try {
      const groupToDelete = await createGroup(
        { name: 'Group to delete', description: 'This is a group to delete' },
        users['ian'].firebaseToken
      );
      groups.push(groupToDelete.data);

      const response = await deleteGroup(
        groupToDelete.data.id,
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'Forbidden: You must be the creator of the group to delete it'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user to delete a group if they are not the creator', async () => {
    let isError = false;
    try {
      const groupToDelete = await createGroup(
        { name: 'Group to delete', description: 'This is a group to delete' },
        users['ian'].firebaseToken
      );
      groups.push(groupToDelete.data);

      // Invite user to group
      await addMembers(
        groupToDelete.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      // Accept invite
      await changeStatus(
        groupToDelete.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const response = await deleteGroup(
        groupToDelete.data.id,
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'Forbidden: You must be the creator of the group to delete it'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow admins to delete the group unless they are the creator', async () => {
    let isError = false;
    try {
      const groupToDelete = await createGroup(
        { name: 'Group to delete', description: 'This is a group to delete' },
        users['ian'].firebaseToken
      );
      groups.push(groupToDelete.data);

      // Invite user to group
      await addMembers(
        groupToDelete.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      // Accept invite
      await changeStatus(
        groupToDelete.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      // Promote user to admin
      await promoteMemberToAdmin(
        groupToDelete.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      const response = await deleteGroup(
        groupToDelete.data.id,
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'Forbidden: You must be the creator of the group to delete it'
      );
    }
    expect(isError).toBe(true);
  });

  it('should allow the creator to delete the group', async () => {
    let isError = false;
    try {
      const groupToDelete = await createGroup(
        { name: 'Group to delete', description: 'This is a group to delete' },
        users['ian'].firebaseToken
      );
      groups.push(groupToDelete.data);

      const response = await deleteGroup(
        groupToDelete.data.id,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      console.error('Error deleting group', e);
    }
    expect(isError).toBe(false);
  });

  it('should delete the group from the database', async () => {
    let isError = false;
    try {
      const groupToDelete = await createGroup(
        { name: 'Group to delete', description: 'This is a group to delete' },
        users['ian'].firebaseToken
      );
      groups.push(groupToDelete.data);

      await getGroup(groupToDelete.data.id, users['ian'].firebaseToken);

      await deleteGroup(groupToDelete.data.id, users['ian'].firebaseToken);

      await getGroup(groupToDelete.data.id, users['ian'].firebaseToken);
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe('Group not found');
    }
    expect(isError).toBe(true);
  });

  it('should delete all group members from the database', async () => {
    let isError = false;
    try {
      const currentGroupMembers = await getAllGroupMembers();

      const groupToDelete = await createGroup(
        { name: 'Group to delete', description: 'This is a group to delete' },
        users['ian'].firebaseToken
      );
      groups.push(groupToDelete.data);

      // Invite user to group
      await addMembers(
        groupToDelete.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      // Accept invite
      await changeStatus(
        groupToDelete.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToDelete.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      const newGroupMembers = await getAllGroupMembers();

      expect(newGroupMembers.data.length).toBeGreaterThan(
        currentGroupMembers.data.length
      );

      await deleteGroup(groupToDelete.data.id, users['ian'].firebaseToken);

      const groupMembersAfterDeletion = await getAllGroupMembers();

      expect(groupMembersAfterDeletion.data.length).toBe(
        currentGroupMembers.data.length
      );

      expect(groupMembersAfterDeletion.data).toEqual(currentGroupMembers.data);
    } catch (e) {
      isError = true;
      console.log('Error deleting group', e);
    }
    expect(isError).toBe(false);
  });

  it('database should have the correct number of groups after deletion', async () => {
    let isError = false;
    try {
      const currentGroups = await getAllGroups();

      const GROUPS_TO_CREATE = 5;
      const groupIds: number[] = [];
      for (let i = 0; i < GROUPS_TO_CREATE; i++) {
        const response = await createGroup(
          {
            name: `Group ${i}`,
            description: `This is group ${i}`,
          },
          users['ian'].firebaseToken
        );
        groupIds.push(response.data.id);
      }

      const groupsAfterCreation = await getAllGroups();

      expect(groupsAfterCreation.data.length).toBe(
        currentGroups.data.length + GROUPS_TO_CREATE
      );

      for (const id of groupIds) {
        await deleteGroup(id, users['ian'].firebaseToken);
      }

      const groupsAfterDeletion = await getAllGroups();

      expect(groupsAfterDeletion.data.length).toBe(
        groupsAfterCreation.data.length - GROUPS_TO_CREATE
      );
    } catch (e) {
      isError = true;
      console.log('Error deleting group', e);
    }
    expect(isError).toBe(false);
  });
});

describe('adding members to groups', () => {
  it('should return a 200 status code', async () => {
    let isError = false;
    try {
      const groupToAddMember = await createGroup(
        {
          name: 'Group to add member',
          description: 'This is a group to add member',
        },
        users['ian'].firebaseToken
      );

      groups.push(groupToAddMember.data);

      const response = await addMembers(
        groupToAddMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );
      expect(response.status).toBe(200);
    } catch (e) {
      isError = true;
      console.error('Error adding member to group', e);
    }
    expect(isError).toBe(false);
  });

  it('should return the right message upon adding a member', async () => {
    let isError = false;
    try {
      const groupToAddMember = await createGroup(
        {
          name: 'Group to add member',
          description: 'This is a group to add member',
        },
        users['ian'].firebaseToken
      );

      groups.push(groupToAddMember.data);

      const response = await addMembers(
        groupToAddMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );
      expect(response.data.endsWith('members added to the group')).toBe(true);
    } catch (e) {
      isError = true;
      console.error('Error adding member to group', e);
    }
    expect(isError).toBe(false);
  });

  it('the repsonse message should indicate how many users were added', async () => {
    let isError = false;
    try {
      const groupToAddMember = await createGroup(
        {
          name: 'Group to add member',
          description: 'This is a group to add member',
        },
        users['ian'].firebaseToken
      );

      groups.push(groupToAddMember.data);

      const response = await addMembers(
        groupToAddMember.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );
      expect(response.data).toBe('3 members added to the group');
    } catch (e) {
      isError = true;
      console.error('Error adding member to group', e);
    }
    expect(isError).toBe(false);
  });

  it('should return a 404 status code if the group does not exist', async () => {
    let isError = false;
    try {
      const response = await addMembers(
        999999,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe('Group not found');
    }
    expect(isError).toBe(true);
  });

  it('should return a 404 status code if the user does not exist', async () => {
    let isError = false;
    try {
      const groupToAddMember = await createGroup(
        {
          name: 'Group to add member',
          description: 'This is a group to add member',
        },
        users['ian'].firebaseToken
      );

      groups.push(groupToAddMember.data);

      const response = await addMembers(
        groupToAddMember.data.id,
        { memberIds: ['invalid-user-id'] },
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe(
        'One of the users you tried to add to the group does not exist'
      );
    }
    expect(isError).toBe(true);
  });

  it('should return a 404 if a user is not found, even if some users are valid', async () => {
    let isError = false;
    try {
      const groupToAddMember = await createGroup(
        {
          name: 'Group to add member',
          description: 'This is a group to add member',
        },
        users['ian'].firebaseToken
      );

      groups.push(groupToAddMember.data);

      const response = await addMembers(
        groupToAddMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid, 'invalid-user-id'] },
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe(
        'One of the users you tried to add to the group does not exist'
      );
    }
    expect(isError).toBe(true);
  });

  it('should return a 400 status code if no memberIds are provided', async () => {
    let isError = false;
    try {
      const groupToAddMember = await createGroup(
        {
          name: 'Group to add member',
          description: 'This is a group to add member',
        },
        users['ian'].firebaseToken
      );

      groups.push(groupToAddMember.data);

      const response = await addMembers(
        groupToAddMember.data.id,
        { memberIds: [] },
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe(
        'You must provide at least one member to add to the group'
      );
    }
    expect(isError).toBe(true);
  });

  it('should return a 400 status code if the user is already invited', async () => {
    let isError = false;
    try {
      const groupToAddMember = await createGroup(
        {
          name: 'Group to add member',
          description: 'This is a group to add member',
        },
        users['ian'].firebaseToken
      );

      groups.push(groupToAddMember.data);

      await addMembers(
        groupToAddMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      const response = await addMembers(
        groupToAddMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe(
        'A user you tried to add has already been invited to the group'
      );
    }
    expect(isError).toBe(true);
  });

  it('should return a 400 status code if the user is already a member', async () => {
    let isError = false;
    try {
      const groupToAddMember = await createGroup(
        {
          name: 'Group to add member',
          description: 'This is a group to add member',
        },
        users['ian'].firebaseToken
      );

      groups.push(groupToAddMember.data);

      await addMembers(
        groupToAddMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToAddMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const response = await addMembers(
        groupToAddMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe(
        'A user you tried to add is already in the group'
      );
    }
    expect(isError).toBe(true);
  });

  it('should allow a user to be invited if they have declined the invite', async () => {
    let isError = false;
    try {
      const groupToAddMember = await createGroup(
        {
          name: 'Group to add member',
          description: 'This is a group to add member',
        },
        users['ian'].firebaseToken
      );

      groups.push(groupToAddMember.data);

      const currentGroupMembers = await getAllGroupMembers();

      await addMembers(
        groupToAddMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      const groupMembersAfterInvite = await getAllGroupMembers();

      expect(groupMembersAfterInvite.data.length).toBe(
        currentGroupMembers.data.length + 1
      );

      await changeStatus(
        groupToAddMember.data.id,
        users['david'].firebaseUser.uid,
        'Declined',
        users['david'].firebaseToken
      );

      const groupMembersAfterDecline = await getAllGroupMembers();

      const declinedGroupMember = groupMembersAfterDecline.data.find(
        (member) =>
          member.memberId === users['david'].firebaseUser.uid &&
          member.groupId === groupToAddMember.data.id
      );

      expect(groupMembersAfterDecline.data.length).toBe(
        groupMembersAfterInvite.data.length
      );
      expect(declinedGroupMember?.status).toBe('Declined');

      await addMembers(
        groupToAddMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      const groupMembersAfterReinvite = await getAllGroupMembers();

      expect(groupMembersAfterReinvite.data.length).toBe(
        currentGroupMembers.data.length + 1
      );

      const reinvitedGroupMember = groupMembersAfterReinvite.data.find(
        (member) =>
          member.memberId === users['david'].firebaseUser.uid &&
          member.groupId === groupToAddMember.data.id
      );

      expect(reinvitedGroupMember?.status).toBe('Invited');
    } catch (e) {
      isError = true;
      console.error('Error adding member to group', e);
    }
    expect(isError).toBe(false);
  });

  it('should allow a user to be invited if they have left the group', async () => {
    let isError = false;
    try {
      const groupToAddMember = await createGroup(
        {
          name: 'Group to add member',
          description: 'This is a group to add member',
        },
        users['ian'].firebaseToken
      );

      groups.push(groupToAddMember.data);

      await addMembers(
        groupToAddMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToAddMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const groupMembersAfterJoining = await getAllGroupMembers();

      const joinedGroupMember = groupMembersAfterJoining.data.find(
        (member) =>
          member.memberId === users['david'].firebaseUser.uid &&
          member.groupId === groupToAddMember.data.id
      );

      expect(joinedGroupMember?.status).toBe('Joined');

      await leaveGroup(groupToAddMember.data.id, users['david'].firebaseToken);

      const groupMembersAfterLeaving = await getAllGroupMembers();

      const leftGroupMember = groupMembersAfterLeaving.data.find(
        (member) =>
          member.memberId === users['david'].firebaseUser.uid &&
          member.groupId === groupToAddMember.data.id
      );

      expect(leftGroupMember?.status).toBe('Left');

      await addMembers(
        groupToAddMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      const groupMembersAfterReinvite = await getAllGroupMembers();

      const reinvitedGroupMember = groupMembersAfterReinvite.data.find(
        (member) =>
          member.memberId === users['david'].firebaseUser.uid &&
          member.groupId === groupToAddMember.data.id
      );

      expect(reinvitedGroupMember?.status).toBe('Invited');
    } catch (e) {
      isError = true;
      console.error('Error adding member to group', e);
    }
  });

  it('should not allow a user that has been banned to be invited', async () => {
    let isError = false;
    try {
      const groupToAddMember = await createGroup(
        {
          name: 'Group to add member',
          description: 'This is a group to add member',
        },
        users['ian'].firebaseToken
      );

      groups.push(groupToAddMember.data);

      await addMembers(
        groupToAddMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToAddMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToAddMember.data.id,
        users['david'].firebaseUser.uid,
        'Banned',
        users['ian'].firebaseToken
      );

      const response = await addMembers(
        groupToAddMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe(
        'A user you tried to add is banned from the group'
      );
    }
    expect(isError).toBe(true);
  });

  it('should allow a user who has been kicked to be invited', async () => {
    let isError = false;
    try {
      const groupToAddMember = await createGroup(
        {
          name: 'Group to add member',
          description: 'This is a group to add member',
        },
        users['ian'].firebaseToken
      );

      groups.push(groupToAddMember.data);

      await addMembers(
        groupToAddMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToAddMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToAddMember.data.id,
        users['david'].firebaseUser.uid,
        'Kicked',
        users['ian'].firebaseToken
      );

      const groupMembersAfterKick = await getAllGroupMembers();

      const kickedGroupMember = groupMembersAfterKick.data.find(
        (member) =>
          member.memberId === users['david'].firebaseUser.uid &&
          member.groupId === groupToAddMember.data.id
      );

      expect(kickedGroupMember?.status).toBe('Kicked');

      await addMembers(
        groupToAddMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      const groupMembersAfterReinvite = await getAllGroupMembers();

      const reinvitedMember = groupMembersAfterReinvite.data.find(
        (member) =>
          member.memberId === users['david'].firebaseUser.uid &&
          member.groupId === groupToAddMember.data.id
      );

      expect(reinvitedMember?.status).toBe('Invited');
    } catch (e) {
      isError = true;
      console.error('Error adding member to group', e);
    }
    expect(isError).toBe(false);
  });

  it('should add multiple members to a group at once', async () => {
    let isError = false;
    try {
      const groupToAddMember = await createGroup(
        {
          name: 'Group to add member',
          description: 'This is a group to add member',
        },
        users['ian'].firebaseToken
      );

      groups.push(groupToAddMember.data);

      const currentGroupMembers = await getAllGroupMembers();

      const memberIds = [
        users['david'].firebaseUser.uid,
        users['oscar'].firebaseUser.uid,
      ];

      await addMembers(
        groupToAddMember.data.id,
        { memberIds },
        users['ian'].firebaseToken
      );

      const groupMembersAfterInvite = await getAllGroupMembers();

      expect(groupMembersAfterInvite.data.length).toBe(
        currentGroupMembers.data.length + memberIds.length
      );
    } catch (e) {
      isError = true;
      console.error('Error adding member to group', e);
    }
    expect(isError).toBe(false);
  });
  it('should not add any group members if the operation fails in any way', async () => {
    let isError = false;
    try {
      const groupToAddMember = await createGroup(
        {
          name: 'Group to add member',
          description: 'This is a group to add member',
        },
        users['ian'].firebaseToken
      );

      groups.push(groupToAddMember.data);

      const currentGroupMembers = await getAllGroupMembers();

      const memberIds = [
        users['david'].firebaseUser.uid,
        'invalid-user-id',
        users['oscar'].firebaseUser.uid,
      ];

      const response = await addMembers(
        groupToAddMember.data.id,
        { memberIds },
        users['ian'].firebaseToken
      );

      const groupMembersAfterInvite = await getAllGroupMembers();

      expect(groupMembersAfterInvite.data.length).toBe(
        currentGroupMembers.data.length
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe(
        'One of the users you tried to add to the group does not exist'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not add an group members if all but one user can be added', async () => {
    let isError = false;
    try {
      const groupToAddMember = await createGroup(
        {
          name: 'Group to add member',
          description: 'This is a group to add member',
        },
        users['ian'].firebaseToken
      );

      groups.push(groupToAddMember.data);

      const currentGroupMembers = await getAllGroupMembers();

      const memberIds = [
        users['david'].firebaseUser.uid,
        users['oscar'].firebaseUser.uid,
      ];

      await addMembers(
        groupToAddMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToAddMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToAddMember.data.id,
        users['david'].firebaseUser.uid,
        'Banned',
        users['ian'].firebaseToken
      );

      await addMembers(
        groupToAddMember.data.id,
        { memberIds },
        users['ian'].firebaseToken
      );

      const groupMembersAfterInvite = await getAllGroupMembers();

      expect(groupMembersAfterInvite.data.length - memberIds.length).toBe(
        currentGroupMembers.data.length
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe(
        'A user you tried to add is banned from the group'
      );
    }
    expect(isError).toBe(true);
  });

  it('should allow joined members to invite others to the group', async () => {
    let isError = false;
    try {
      const groupToAddMember = await createGroup(
        {
          name: 'Group to add member',
          description: 'This is a group to add member',
        },
        users['ian'].firebaseToken
      );

      groups.push(groupToAddMember.data);

      await addMembers(
        groupToAddMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToAddMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const currentGroupMembers = await getAllGroupMembers();

      const memberIds = [
        users['oscar'].firebaseUser.uid,
        users['gabe'].firebaseUser.uid,
      ];

      await addMembers(
        groupToAddMember.data.id,
        { memberIds },
        users['david'].firebaseToken
      );

      const groupMembersAfterInvite = await getAllGroupMembers();

      expect(groupMembersAfterInvite.data.length).toBe(
        currentGroupMembers.data.length + memberIds.length
      );
    } catch (e) {
      isError = true;
      console.error('Error adding member to group', e);
    }
    expect(isError).toBe(false);
  });
});

describe('leaving a group', () => {
  it('should return a 200 status code on a valid request', async () => {
    let isError = false;
    try {
      const groupToLeave = await createGroup(
        { name: 'Group to leave', description: 'This is a group to leave' },
        users['ian'].firebaseToken
      );

      groups.push(groupToLeave.data);

      await addMembers(
        groupToLeave.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToLeave.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const response = await leaveGroup(
        groupToLeave.data.id,
        users['david'].firebaseToken
      );
      expect(response.status).toBe(200);
    } catch (e) {
      isError = true;
      console.error('Error leaving group', e);
    }
    expect(isError).toBe(false);
  });

  it('should return the right message upon leaving a group', async () => {
    let isError = false;
    try {
      const groupToLeave = await createGroup(
        { name: 'Group to leave', description: 'This is a group to leave' },
        users['ian'].firebaseToken
      );

      groups.push(groupToLeave.data);

      await addMembers(
        groupToLeave.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToLeave.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const response = await leaveGroup(
        groupToLeave.data.id,
        users['david'].firebaseToken
      );
      expect(response.data).toBe('You have left the group');
    } catch (e) {
      isError = true;
      console.error('Error leaving group', e);
    }
    expect(isError).toBe(false);
  });

  it('should change the status of the group member to "left"', async () => {
    let isError = false;
    try {
      const groupToLeave = await createGroup(
        { name: 'Group to leave', description: 'This is a group to leave' },
        users['ian'].firebaseToken
      );

      groups.push(groupToLeave.data);

      await addMembers(
        groupToLeave.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToLeave.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await leaveGroup(groupToLeave.data.id, users['david'].firebaseToken);

      const groupMembers = await getAllGroupMembers();

      const leftMember = groupMembers.data.find(
        (member) =>
          member.memberId === users['david'].firebaseUser.uid &&
          member.groupId === groupToLeave.data.id
      );

      expect(leftMember?.status).toBe('Left');
    } catch (e) {
      isError = true;
      console.error('Error leaving group', e);
    }
    expect(isError).toBe(false);
  });

  it('should have the same number of group members even after leaving the group (status is changed, record not deleted)', async () => {
    let isError = false;
    try {
      const groupToLeave = await createGroup(
        { name: 'Group to leave', description: 'This is a group to leave' },
        users['ian'].firebaseToken
      );

      groups.push(groupToLeave.data);

      const currentGroupMembers = await getAllGroupMembers();

      await addMembers(
        groupToLeave.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToLeave.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const groupMembersAfterJoining = await getAllGroupMembers();

      expect(groupMembersAfterJoining.data.length).toBe(
        currentGroupMembers.data.length + 1
      );

      await leaveGroup(groupToLeave.data.id, users['david'].firebaseToken);

      const groupMembersAfterLeaving = await getAllGroupMembers();

      expect(groupMembersAfterLeaving.data.length).toBe(
        currentGroupMembers.data.length + 1
      );
    } catch (e) {
      isError = true;
      console.error('Error leaving group', e);
    }
    expect(isError).toBe(false);
  });

  it('should not allow a user to leave a group if they are not a member', async () => {
    let isError = false;
    try {
      const groupToLeave = await createGroup(
        { name: 'Group to leave', description: 'This is a group to leave' },
        users['ian'].firebaseToken
      );

      groups.push(groupToLeave.data);

      const response = await leaveGroup(
        groupToLeave.data.id,
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'Forbidden: You must be a member of the group to leave it'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user to leave a group if they are only invited but have not joined', async () => {
    let isError = false;
    try {
      const groupToLeave = await createGroup(
        { name: 'Group to leave', description: 'This is a group to leave' },
        users['ian'].firebaseToken
      );

      groups.push(groupToLeave.data);

      await addMembers(
        groupToLeave.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      const response = await leaveGroup(
        groupToLeave.data.id,
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe('You are not in the group');
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user to leave a group if they are banned', async () => {
    let isError = false;
    try {
      const groupToLeave = await createGroup(
        { name: 'Group to leave', description: 'This is a group to leave' },
        users['ian'].firebaseToken
      );

      groups.push(groupToLeave.data);

      await addMembers(
        groupToLeave.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToLeave.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToLeave.data.id,
        users['david'].firebaseUser.uid,
        'Banned',
        users['ian'].firebaseToken
      );

      const response = await leaveGroup(
        groupToLeave.data.id,
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'Forbidden: You are banned from the group'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user to leave a group if they are kicked', async () => {
    let isError = false;
    try {
      const groupToLeave = await createGroup(
        { name: 'Group to leave', description: 'This is a group to leave' },
        users['ian'].firebaseToken
      );

      groups.push(groupToLeave.data);

      await addMembers(
        groupToLeave.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToLeave.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToLeave.data.id,
        users['david'].firebaseUser.uid,
        'Kicked',
        users['ian'].firebaseToken
      );

      const response = await leaveGroup(
        groupToLeave.data.id,
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe('You are not in the group');
    }
    expect(isError).toBe(true);
  });

  it('should not allow the creator to leave the group', async () => {
    let isError = false;
    try {
      const groupToLeave = await createGroup(
        { name: 'Group to leave', description: 'This is a group to leave' },
        users['ian'].firebaseToken
      );

      groups.push(groupToLeave.data);

      const response = await leaveGroup(
        groupToLeave.data.id,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You cannot leave a group you created. Delete the group instead'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user to leave a group if they have declined the invite', async () => {
    let isError = false;
    try {
      const groupToLeave = await createGroup(
        { name: 'Group to leave', description: 'This is a group to leave' },
        users['ian'].firebaseToken
      );

      groups.push(groupToLeave.data);

      await addMembers(
        groupToLeave.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToLeave.data.id,
        users['david'].firebaseUser.uid,
        'Declined',
        users['david'].firebaseToken
      );

      const response = await leaveGroup(
        groupToLeave.data.id,
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe('You are not in the group');
    }
    expect(isError).toBe(true);
  });

  it('should return a 404 status code if the group does not exist', async () => {
    let isError = false;
    try {
      const response = await leaveGroup(999999, users['david'].firebaseToken);
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe('Group not found');
    }
    expect(isError).toBe(true);
  });

  it('should have the same number of transactions', async () => {
    let isError = false;
    try {
      const groupToLeave = await createGroup(
        { name: 'Group to leave', description: 'This is a group to leave' },
        users['ian'].firebaseToken
      );

      groups.push(groupToLeave.data);

      const currentGroupMembers = await getAllGroupMembers();

      await addMembers(
        groupToLeave.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToLeave.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const responseBeforeTransaction = await getGroup(
        groupToLeave.data.id,
        users['ian'].firebaseToken
      );

      const transactionsBeforeTransaction =
        responseBeforeTransaction.data.transactions;

      await createTransaction(
        {
          amount: 100,
          description: 'Test transaction',
          groupId: groupToLeave.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 100, recipientId: users['david'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      await createTransaction(
        {
          amount: 100,
          description: 'Test transaction',
          groupId: groupToLeave.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 100, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      const responseBeforeLeaving = await getGroup(
        groupToLeave.data.id,
        users['ian'].firebaseToken
      );

      const transactionsBeforeLeaving = responseBeforeLeaving.data.transactions;

      expect(transactionsBeforeLeaving.length).toBe(
        transactionsBeforeTransaction.length + 2
      );

      await leaveGroup(groupToLeave.data.id, users['david'].firebaseToken);

      const responseAfterLeaving = await getGroup(
        groupToLeave.data.id,
        users['ian'].firebaseToken
      );

      const transactionsAfterLeaving = responseAfterLeaving.data.transactions;

      expect(transactionsAfterLeaving.length).toBe(
        transactionsBeforeLeaving.length
      );
    } catch (e) {
      isError = true;
      console.error('Error leaving group', e);
    }
    expect(isError).toBe(false);
  });

  it('each transaction should have the member who left information removed when user is the recipient', async () => {
    let isError = false;
    try {
      const groupToLeave = await createGroup(
        { name: 'Group to leave', description: 'This is a group to leave' },
        users['ian'].firebaseToken
      );

      groups.push(groupToLeave.data);

      await addMembers(
        groupToLeave.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToLeave.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await createTransaction(
        {
          amount: 100,
          description: 'Test transaction',
          groupId: groupToLeave.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 100, recipientId: users['david'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      const responseBeforeLeaving = await getGroup(
        groupToLeave.data.id,
        users['ian'].firebaseToken
      );

      const [transactionBeforeLeaving] =
        responseBeforeLeaving.data.transactions;

      expect(transactionBeforeLeaving.payerId).toBe(
        users['ian'].firebaseUser.uid
      );
      const transactionDetailsBeforeLeaving =
        transactionBeforeLeaving.transactionDetails;
      expect(transactionDetailsBeforeLeaving?.length).toBe(1);
      expect(transactionDetailsBeforeLeaving?.[0].recipientId).toBe(
        users['david'].firebaseUser.uid
      );
      expect(transactionDetailsBeforeLeaving?.[0].recipient).toBeDefined();

      await leaveGroup(groupToLeave.data.id, users['david'].firebaseToken);

      const response = await getGroup(
        groupToLeave.data.id,
        users['ian'].firebaseToken
      );

      const [transaction] = response.data.transactions;

      expect(transaction.payerId).toBe(users['ian'].firebaseUser.uid);
      const transactionDetails = transaction.transactionDetails;

      expect(transactionDetails?.length).toBe(1);
      expect(transactionDetails?.[0].recipientId).toBe(null);
      expect(transactionDetails?.[0].recipient).toBe(null);
      expect(transactionDetails?.[0].amount).toBe(100);
    } catch (e) {
      isError = true;
      console.error('Error leaving group', (e as AxiosError).response?.data);
    }
    expect(isError).toBe(false);
  });

  it('each transaction should have information removed when user is the payer', async () => {
    let isError = false;
    try {
      const groupToLeave = await createGroup(
        { name: 'Group to leave', description: 'This is a group to leave' },
        users['ian'].firebaseToken
      );

      groups.push(groupToLeave.data);

      await addMembers(
        groupToLeave.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToLeave.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await createTransaction(
        {
          amount: 100,
          description: 'Test transaction',
          groupId: groupToLeave.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 100, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await leaveGroup(groupToLeave.data.id, users['david'].firebaseToken);

      const response = await getGroup(
        groupToLeave.data.id,
        users['ian'].firebaseToken
      );

      const [transaction] = response.data.transactions;

      expect(transaction?.payerId).toBe(null);
      const transactionDetails = transaction.transactionDetails;

      expect(transactionDetails?.length).toBe(1);
      expect(transactionDetails?.[0].recipientId).toBe(
        users['ian'].firebaseUser.uid
      );
      expect(transactionDetails?.[0].recipient).toBeDefined();
      expect(transactionDetails?.[0].amount).toBe(100);
    } catch (e) {
      isError = true;
      console.error('Error leaving group', e);
    }
    expect(isError).toBe(false);
  });

  it('should remove users information if they created a transaction and leave the group', async () => {
    let isError = false;
    try {
      const groupToLeave = await createGroup(
        { name: 'Group to leave', description: 'This is a group to leave' },
        users['ian'].firebaseToken
      );

      groups.push(groupToLeave.data);

      await addMembers(
        groupToLeave.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToLeave.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToLeave.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await createTransaction(
        {
          amount: 100,
          description: 'Test transaction',
          groupId: groupToLeave.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 50, recipientId: users['ian'].firebaseUser.uid },
            { amount: 50, recipientId: users['oscar'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await leaveGroup(groupToLeave.data.id, users['david'].firebaseToken);

      const response = await getGroup(
        groupToLeave.data.id,
        users['ian'].firebaseToken
      );

      const [transaction] = response.data.transactions;
      expect(transaction?.payerId).toBe(users['ian'].firebaseUser.uid);
      expect(transaction.createdBy).toBeNull();
      expect(transaction.createdById).toBeNull();
      expect(transaction.transactionDetails?.length).toBe(2);
    } catch (e) {
      isError = true;
      console.error('Error leaving group', (e as AxiosError).response?.data);
    }
    expect(isError).toBe(false);
  });

  it('should remove admin status if user is an admin and leaves the group', async () => {
    let isError = false;
    try {
      const groupToLeave = await createGroup(
        { name: 'Group to leave', description: 'This is a group to leave' },
        users['ian'].firebaseToken
      );

      groups.push(groupToLeave.data);

      await addMembers(
        groupToLeave.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToLeave.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToLeave.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToLeave.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      const responseBeforeLeaving = await getAllGroupMembers();

      const adminBeforeLeaving = responseBeforeLeaving.data.find(
        (gm) =>
          gm.groupId === groupToLeave.data.id &&
          gm.memberId === users['david'].firebaseUser.uid
      );

      expect(adminBeforeLeaving?.isAdmin).toBe(true);

      await leaveGroup(groupToLeave.data.id, users['david'].firebaseToken);

      const response = await getAllGroupMembers();

      const adminAfterLeaving = response.data.find(
        (member) =>
          member.groupId === groupToLeave.data.id &&
          member.memberId === users['david'].firebaseUser.uid
      );

      expect(adminAfterLeaving?.status).toBe('Left');
      expect(adminAfterLeaving?.isAdmin).toBe(false);
    } catch (e) {
      isError = true;
      console.error('Error leaving group', e);
    }
    expect(isError).toBe(false);
  });
});

describe('Removing a group member', () => {
  it('should return a 200 status code on a valid request', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      await addMembers(
        groupToRemoveMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const response = await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
      expect(response.status).toBe(200);
    } catch (e) {
      isError = true;
      console.error('Error removing member from group', e);
    }
    expect(isError).toBe(false);
  });

  it('should return the right message upon removing a member', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      await addMembers(
        groupToRemoveMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const response = await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      expect(response.data).toBe('Member removed from group');
    } catch (e) {
      isError = true;
      console.error('Error removing member from group', e);
    }
    expect(isError).toBe(false);
  });

  it('should change the status of the group member to "Kicked"', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      await addMembers(
        groupToRemoveMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      const groupMembers = await getAllGroupMembers();

      const kickedMember = groupMembers.data.find(
        (gm) =>
          gm.memberId === users['david'].firebaseUser.uid &&
          gm.groupId === groupToRemoveMember.data.id
      );

      expect(kickedMember?.status).toBe('Kicked');
    } catch (e) {
      isError = true;
      console.error('Error removing member from group', e);
    }
    expect(isError).toBe(false);
  });

  it('should have the same number of group members even after removing a member (status is changed, record not deleted)', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      const currentGroupMembers = await getAllGroupMembers();

      await addMembers(
        groupToRemoveMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const groupMembersAfterJoining = await getAllGroupMembers();

      expect(groupMembersAfterJoining.data.length).toBe(
        currentGroupMembers.data.length + 1
      );

      await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      const groupMembersAfterRemoving = await getAllGroupMembers();

      expect(groupMembersAfterRemoving.data.length).toBe(
        currentGroupMembers.data.length + 1
      );
    } catch (e) {
      isError = true;
      console.error('Error removing member from group', e);
    }
    expect(isError).toBe(false);
  });

  it('should not allow non-admins to remove members', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      await addMembers(
        groupToRemoveMember.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      const response = await removeMember(
        groupToRemoveMember.data.id,
        users['oscar'].firebaseUser.uid,
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You must be an admin to remove users from the group'
      );
    }
    expect(isError).toBe(true);
  });

  it('should allow admins to remove members', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      await addMembers(
        groupToRemoveMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const response = await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      console.error('Error removing member from group', e);
    }
    expect(isError).toBe(false);
  });

  it('should allow an admin that is not the creator to remove members', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      await addMembers(
        groupToRemoveMember.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToRemoveMember.data.id,
        users['oscar'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      const response = await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['oscar'].firebaseToken
      );
    } catch (e) {
      isError = true;
      console.error('Error removing member from group', e);
    }
    expect(isError).toBe(false);
  });

  it('should not allow a user to remove themselves from the group', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      await addMembers(
        groupToRemoveMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const response = await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You cannot remove yourself from the group. Leave the group instead'
      );
    }
    expect(isError).toBe(true);
  });

  it('should return 404 if the group does not exist', async () => {
    let isError = false;
    try {
      const response = await removeMember(
        999999,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe('Group not found');
    }
    expect(isError).toBe(true);
  });

  it('should return 404 if the member does not exist', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      const response = await removeMember(
        groupToRemoveMember.data.id,
        'invalid-user-id',
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe('User not found');
    }
    expect(isError).toBe(true);
  });

  it('should not allow a removal of a user that is not in the group', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      const response = await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe('User not found in group');
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user that has been banned to be removed', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      await addMembers(
        groupToRemoveMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        'Banned',
        users['ian'].firebaseToken
      );

      const response = await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe('User is not in the group');
    }
    expect(isError).toBe(true);
  });
  it('should not allow a user who has been kicked to be removed', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      await addMembers(
        groupToRemoveMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      const response = await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user who has declined the invite to be removed', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      await addMembers(
        groupToRemoveMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        'Declined',
        users['david'].firebaseToken
      );

      const response = await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe('User is not in the group');
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user who has been invited to be removed', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      await addMembers(
        groupToRemoveMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      const response = await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe('User is not in the group');
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user that has left to be removed', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      await addMembers(
        groupToRemoveMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await leaveGroup(
        groupToRemoveMember.data.id,
        users['david'].firebaseToken
      );

      const response = await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe('User is not in the group');
    }
    expect(isError).toBe(true);
  });

  it('should not allow the creator to be removed', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      const response = await removeMember(
        groupToRemoveMember.data.id,
        users['ian'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You cannot remove the creator of the group'
      );
    }
    expect(isError).toBe(true);
  });

  it('should allow the creator to remove an admin', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      await addMembers(
        groupToRemoveMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      const response = await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      console.error('Error removing member from group', e);
    }
    expect(isError).toBe(false);
  });

  it('should change an admin role to false if they are removed from the group', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      await addMembers(
        groupToRemoveMember.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      const groupMembers = await getAllGroupMembers();
      const removedMember = groupMembers.data.filter(
        (gm) =>
          gm.memberId === users['david'].firebaseUser.uid &&
          gm.groupId === groupToRemoveMember.data.id
      );

      expect(removedMember.length).toBe(1);
      expect(removedMember[0].isAdmin).toBe(false);
    } catch (e) {
      isError = true;
      console.error('Error removing member from group', e);
    }
    expect(isError).toBe(false);
  });

  it('should have the same number of tranactions after removing a member', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      await addMembers(
        groupToRemoveMember.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      const groupBeforeTransactions = await getGroup(
        groupToRemoveMember.data.id,
        users['ian'].firebaseToken
      );

      // User creates the transaction but isn't part of it
      await createTransaction(
        {
          amount: 100,
          description: 'Test transaction',
          groupId: groupToRemoveMember.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 50, recipientId: users['ian'].firebaseUser.uid },
            { amount: 50, recipientId: users['oscar'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      // user creates the transaction as a recipient and payer
      await createTransaction(
        {
          amount: 100,
          description: 'Test transaction',
          groupId: groupToRemoveMember.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 50, recipientId: users['ian'].firebaseUser.uid },
            { amount: 50, recipientId: users['david'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      // user is only a recipient
      await createTransaction(
        {
          amount: 100,
          description: 'Test transaction',
          groupId: groupToRemoveMember.data.id,
          payerId: users['oscar'].firebaseUser.uid,
          transactionDetails: [
            { amount: 100, recipientId: users['david'].firebaseUser.uid },
          ],
        },
        users['oscar'].firebaseToken
      );

      // user is only a payer
      await createTransaction(
        {
          amount: 100,
          description: 'Test transaction',
          groupId: groupToRemoveMember.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 100, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      const groupsAfterTransactions = await getGroup(
        groupToRemoveMember.data.id,
        users['ian'].firebaseToken
      );

      expect(groupsAfterTransactions.data.transactions.length).toBe(
        groupBeforeTransactions.data.transactions.length + 4
      );

      await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      const groupsAfterRemoving = await getGroup(
        groupToRemoveMember.data.id,
        users['ian'].firebaseToken
      );

      expect(groupsAfterRemoving.data.transactions.length).toBe(
        groupsAfterTransactions.data.transactions.length
      );
      expect(groupsAfterRemoving.data.transactions.length).toBe(
        groupBeforeTransactions.data.transactions.length + 4
      );
    } catch (e) {
      isError = true;
      console.error('Error removing member from group', e);
    }
    expect(isError).toBe(false);
  });

  it('should remove the user information from transactions if they are the payer only', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      await addMembers(
        groupToRemoveMember.data.id,
        {
          memberIds: [users['david'].firebaseUser.uid],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await createTransaction(
        {
          amount: 100,
          description: 'Test transaction',
          groupId: groupToRemoveMember.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 100, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      const groupAfterRemoving = await getGroup(
        groupToRemoveMember.data.id,
        users['ian'].firebaseToken
      );

      const [transaction] = groupAfterRemoving.data.transactions;

      expect(transaction.payerId).toBeNull();
      expect(transaction.payer).toBeNull();
    } catch (e) {
      isError = true;
      console.error('Error removing member from group', e);
    }
    expect(isError).toBe(false);
  });

  it('should remove the user information from transactions if they are the recipient only', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      await addMembers(
        groupToRemoveMember.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await createTransaction(
        {
          amount: 100,
          description: 'Test transaction',
          groupId: groupToRemoveMember.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 60, recipientId: users['david'].firebaseUser.uid },
            { amount: 40, recipientId: users['oscar'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      const groupAfterRemoving = await getGroup(
        groupToRemoveMember.data.id,
        users['ian'].firebaseToken
      );

      const [transaction] = groupAfterRemoving.data.transactions;

      const davidTransaction = transaction.transactionDetails?.find(
        (td) => td.recipientId === null && td.amount === 60
      );

      const oscarsTransaction = transaction.transactionDetails?.find(
        (td) => td.recipientId === users['oscar'].firebaseUser.uid
      );

      expect(davidTransaction).toBeDefined();
      expect(davidTransaction?.recipientId).toBe(null);
      expect(davidTransaction?.recipient).toBe(null);
      expect(davidTransaction?.amount).toBe(60);
      expect(oscarsTransaction).toBeDefined();
      expect(transaction.transactionDetails?.length).toBe(2);
    } catch (e) {
      isError = true;
      console.error('Error removing member from group', e);
    }
    expect(isError).toBe(false);
  });

  it('should remove the user information from transactions if they are the payer and recipient', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      await addMembers(
        groupToRemoveMember.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await createTransaction(
        {
          amount: 100,
          description: 'Test transaction',
          groupId: groupToRemoveMember.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 60, recipientId: users['david'].firebaseUser.uid },
            { amount: 40, recipientId: users['oscar'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      const groupAfterRemoving = await getGroup(
        groupToRemoveMember.data.id,
        users['ian'].firebaseToken
      );

      const [transaction] = groupAfterRemoving.data.transactions;

      expect(transaction.payerId).toBe(null);

      const davidTransaction = transaction.transactionDetails?.find(
        (td) => td.recipientId === null && td.amount === 60
      );

      const oscarsTransaction = transaction.transactionDetails?.find(
        (td) => td.recipientId === users['oscar'].firebaseUser.uid
      );

      expect(davidTransaction).toBeDefined();
      expect(davidTransaction?.recipientId).toBe(null);
      expect(davidTransaction?.recipient).toBeNull();
      expect(davidTransaction?.amount).toBe(60);
      expect(oscarsTransaction).toBeDefined();
      expect(oscarsTransaction?.recipientId).toBe(
        users['oscar'].firebaseUser.uid
      );
      expect(oscarsTransaction?.recipient).toBeDefined();
      expect(transaction.transactionDetails?.length).toBe(2);
    } catch (e) {
      isError = true;
      console.error('Error removing member from group', e);
    }
    expect(isError).toBe(false);
  });

  it('should remove the user information from transactions if they are the creator only', async () => {
    let isError = false;
    try {
      const groupToRemoveMember = await createGroup(
        {
          name: 'Group to remove member',
          description: 'This is a group to remove member',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToRemoveMember.data);

      await addMembers(
        groupToRemoveMember.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToRemoveMember.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await createTransaction(
        {
          amount: 120,
          groupId: groupToRemoveMember.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 70, recipientId: users['ian'].firebaseUser.uid },
            { amount: 50, recipientId: users['oscar'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await removeMember(
        groupToRemoveMember.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      const groupAfterRemoving = await getGroup(
        groupToRemoveMember.data.id,
        users['ian'].firebaseToken
      );

      const [transaction] = groupAfterRemoving.data.transactions;

      expect(transaction.createdBy).toBeNull();
      expect(transaction.createdById).toBeNull();
      expect(transaction.payerId).toBe(users['ian'].firebaseUser.uid);
      expect(transaction.payer).toBeDefined();
      expect(transaction.transactionDetails?.length).toBe(2);
    } catch (e) {
      isError = true;
      console.error('Error removing member from group', e);
    }
    expect(isError).toBe(false);
  });
});

describe('change status of a group member', () => {
  it('should return a 200 status code on a successful change', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to change status',
          description: 'This is a group to change status',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await addMembers(
        groupToChangeStatus.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      const response = await changeStatus(
        groupToChangeStatus.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      expect(response.status).toBe(200);
    } catch (e) {
      isError = true;
      console.error('Error creating group', (e as AxiosError).response?.data);
    }
    expect(isError).toBe(false);
  });

  it('should return a 404 status code if the group does not exist', async () => {
    let isError = false;
    try {
      await changeStatus(
        999999,
        users['david'].firebaseUser.uid,
        'Joined',
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe('Group not found');
    }
    expect(isError).toBe(true);
  });

  it('should return a 404 status code if the request member is not in the group', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to change status',
          description: 'This is a group to change status',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await changeStatus(
        groupToChangeStatus.data.id,
        'invalid-user-id',
        'Banned',
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe('User not found in group');
    }
    expect(isError).toBe(true);
  });

  it('should return a 404 if the member to change  is not in the group', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to change status',
          description: 'This is a group to change status',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await changeStatus(
        groupToChangeStatus.data.id,
        users['david'].firebaseUser.uid,
        'Banned',
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe('User not found in group');
    }
    expect(isError).toBe(true);
  });

  it('should return a 400 status code if the status is invalid', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to change status',
          description: 'This is a group to change status',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await addMembers(
        groupToChangeStatus.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['david'].firebaseUser.uid,
        'Invalid' as GroupMemberStatus,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user who is banned change another members status', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to change status',
          description: 'This is a group to change status',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await addMembers(
        groupToChangeStatus.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToChangeStatus.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['david'].firebaseUser.uid,
        'Banned',
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['oscar'].firebaseUser.uid,
        'Banned',
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You are banned from the group'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user who is invited to change another members status', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to change status',
          description: 'This is a group to change status',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await addMembers(
        groupToChangeStatus.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['oscar'].firebaseUser.uid,
        'Banned',
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You can not change the status of another user'
      );
    }
    expect(isError).toBe(true);
  });

  it('should allow a user who is invited to accept the invite', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to change status',
          description: 'This is a group to change status',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await addMembers(
        groupToChangeStatus.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );
    } catch (e) {
      isError = true;
      console.error(
        'Error changing status of group member',
        (e as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });

  it('should allow a user who is invited to decline the invite', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to change status',
          description: 'This is a group to change status',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await addMembers(
        groupToChangeStatus.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['oscar'].firebaseUser.uid,
        'Declined',
        users['oscar'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['david'].firebaseUser.uid,
        'Declined',
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      console.error('Error changing status of group member', e);
    }
    expect(isError).toBe(false);
  });

  it('should not allow an invited user to change their status to anything other than declined or joined', async () => {
    let numberOfErrors = 0;
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to change status',
          description: 'This is a group to change status',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await addMembers(
        groupToChangeStatus.data.id,
        {
          memberIds: [users['oscar'].firebaseUser.uid],
        },
        users['ian'].firebaseToken
      );

      try {
        await changeStatus(
          groupToChangeStatus.data.id,
          users['oscar'].firebaseUser.uid,
          'Banned',
          users['oscar'].firebaseToken
        );
      } catch (e) {
        numberOfErrors++;
      }
      try {
        await changeStatus(
          groupToChangeStatus.data.id,
          users['oscar'].firebaseUser.uid,
          'Kicked',
          users['oscar'].firebaseToken
        );
      } catch (e) {
        numberOfErrors++;
      }
      try {
        await changeStatus(
          groupToChangeStatus.data.id,
          users['oscar'].firebaseUser.uid,
          'Left',
          users['oscar'].firebaseToken
        );
      } catch (e) {
        numberOfErrors++;
      }
      try {
        await changeStatus(
          groupToChangeStatus.data.id,
          users['oscar'].firebaseUser.uid,
          'Invited',
          users['oscar'].firebaseToken
        );
      } catch (e) {
        numberOfErrors++;
      }
      // This call does not increment counter, just causes failure
      await changeStatus(
        groupToChangeStatus.data.id,
        users['oscar'].firebaseUser.uid,
        'Invited',
        users['oscar'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You can only accept or decline an invite'
      );
    }
    expect(numberOfErrors).toBe(4);
    expect(isError).toBe(true);
  });

  it('should not allow an invited user to accept another invited users invite', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to change status',
          description: 'This is a group to change status',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await addMembers(
        groupToChangeStatus.data.id,
        {
          memberIds: [
            users['oscar'].firebaseUser.uid,
            users['david'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You can not change the status of another user'
      );
    }
    expect(isError).toBe(true);
  });

  it('should only allow admins to change the status of other members', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to change status',
          description: 'This is a group to change status',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await addMembers(
        groupToChangeStatus.data.id,
        {
          memberIds: [
            users['oscar'].firebaseUser.uid,
            users['david'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );
      await changeStatus(
        groupToChangeStatus.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToChangeStatus.data.id,
        users['oscar'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['david'].firebaseUser.uid,
        'Banned',
        users['oscar'].firebaseToken
      );

      const groupMembersResponse = await getAllGroupMembers();
      const bannedMember = groupMembersResponse.data.find(
        (gm) =>
          gm.memberId === users['david'].firebaseUser.uid &&
          gm.groupId === groupToChangeStatus.data.id
      );

      expect(bannedMember).toBeDefined();
      expect(bannedMember?.status).toBe('Banned');
    } catch (e) {
      isError = true;
      console.log((e as AxiosError).response?.data);
    }
    expect(isError).toBe(false);
  });

  it('should not let an admin change the status of another admin (Banning)', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to change status',
          description: 'This is a group to change status',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await addMembers(
        groupToChangeStatus.data.id,
        {
          memberIds: [
            users['oscar'].firebaseUser.uid,
            users['david'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );
      await changeStatus(
        groupToChangeStatus.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToChangeStatus.data.id,
        users['oscar'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToChangeStatus.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['david'].firebaseUser.uid,
        'Banned',
        users['oscar'].firebaseToken
      );

      const groupMembersResponse = await getAllGroupMembers();
      const bannedMember = groupMembersResponse.data.find(
        (gm) =>
          gm.memberId === users['david'].firebaseUser.uid &&
          gm.groupId === groupToChangeStatus.data.id
      );
      expect(bannedMember).toBeDefined();
      expect(bannedMember?.status).toBe('Banned');
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You cannot change the status of an admin'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not let an admin change the status of another admin (Kicking)', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to change status',
          description: 'This is a group to change status',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await addMembers(
        groupToChangeStatus.data.id,
        {
          memberIds: [
            users['oscar'].firebaseUser.uid,
            users['david'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );
      await changeStatus(
        groupToChangeStatus.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToChangeStatus.data.id,
        users['oscar'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToChangeStatus.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['david'].firebaseUser.uid,
        'Kicked',
        users['oscar'].firebaseToken
      );

      const groupMembersResponse = await getAllGroupMembers();
      const kickedMember = groupMembersResponse.data.find(
        (gm) =>
          gm.memberId === users['david'].firebaseUser.uid &&
          gm.groupId === groupToChangeStatus.data.id
      );
      expect(kickedMember).toBeDefined();
      expect(kickedMember?.status).toBe('Kicked');
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You cannot change the status of an admin'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user to change their own status', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to change status',
          description: 'This is a group to change status',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await addMembers(
        groupToChangeStatus.data.id,
        { memberIds: [users['ian'].firebaseUser.uid] },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['ian'].firebaseUser.uid,
        'Joined',
        users['ian'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToChangeStatus.data.id,
        users['ian'].firebaseUser.uid,
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['ian'].firebaseUser.uid,
        'Banned',
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You cannot change your own status'
      );
    }
    expect(isError).toBe(true);
  });

  it('should allow a user who is banned to be unbanned and set to kicked', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to change status',
          description: 'This is a group to change status',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await addMembers(
        groupToChangeStatus.data.id,
        { memberIds: [users['ian'].firebaseUser.uid] },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['ian'].firebaseUser.uid,
        'Joined',
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['ian'].firebaseUser.uid,
        'Banned',
        users['david'].firebaseToken
      );

      const currentGroupMembersResponse = await getAllGroupMembers();
      const bannedMember = currentGroupMembersResponse.data.find(
        (gm) =>
          gm.memberId === users['ian'].firebaseUser.uid &&
          gm.groupId === groupToChangeStatus.data.id
      );
      expect(bannedMember).toBeDefined();
      expect(bannedMember?.status).toBe('Banned');

      await changeStatus(
        groupToChangeStatus.data.id,
        users['ian'].firebaseUser.uid,
        'Kicked',
        users['david'].firebaseToken
      );

      const groupMembersResponse = await getAllGroupMembers();
      const kickedMember = groupMembersResponse.data.find(
        (gm) =>
          gm.memberId === users['ian'].firebaseUser.uid &&
          gm.groupId === groupToChangeStatus.data.id
      );

      expect(kickedMember).toBeDefined();
      expect(kickedMember?.status).toBe('Kicked');
    } catch (e) {
      isError = true;
      console.error(
        'Error changing status of group member',
        (e as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });

  it('should not allow someone who is not an admin to change the status of another member', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to change status',
          description: 'This is a group to change status',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await addMembers(
        groupToChangeStatus.data.id,
        {
          memberIds: [
            users['ian'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
          ],
        },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['ian'].firebaseUser.uid,
        'Joined',
        users['ian'].firebaseToken
      );
      await changeStatus(
        groupToChangeStatus.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['oscar'].firebaseUser.uid,
        'Banned',
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You must be an admin of the group to update it'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user who is not joined to have their status changed', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to change status',
          description: 'This is a group to change status',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await addMembers(
        groupToChangeStatus.data.id,
        { memberIds: [users['ian'].firebaseUser.uid] },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['ian'].firebaseUser.uid,
        'Banned',
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You cannot change the status of a user who is not in the group'
      );
    }
    expect(isError).toBe(true);
  });

  it('admins can not change the status of the creator of the group', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to change status',
          description: 'This is a group to change status',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await addMembers(
        groupToChangeStatus.data.id,
        { memberIds: [users['ian'].firebaseUser.uid] },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['ian'].firebaseUser.uid,
        'Joined',
        users['ian'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToChangeStatus.data.id,
        users['ian'].firebaseUser.uid,
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['david'].firebaseUser.uid,
        'Banned',
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You cannot change the status of the creator of the group'
      );
    }
    expect(isError).toBe(true);
  });

  it('should allow an admin to revoke an invite to a group', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to revoke invite',
          description: 'This is a group to revoke invite',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await addMembers(
        groupToChangeStatus.data.id,
        { memberIds: [users['ian'].firebaseUser.uid] },
        users['david'].firebaseToken
      );

      const currentGroupMembersResponse = await getAllGroupMembers();
      const invitedMember = currentGroupMembersResponse.data.find(
        (gm) =>
          gm.memberId === users['ian'].firebaseUser.uid &&
          gm.groupId === groupToChangeStatus.data.id
      );
      expect(invitedMember).toBeDefined();
      expect(invitedMember?.status).toBe('Invited');

      await changeStatus(
        groupToChangeStatus.data.id,
        users['ian'].firebaseUser.uid,
        'Kicked',
        users['david'].firebaseToken
      );

      const groupMembersResponse = await getAllGroupMembers();
      const kickedMember = groupMembersResponse.data.find(
        (gm) =>
          gm.memberId === users['ian'].firebaseUser.uid &&
          gm.groupId === groupToChangeStatus.data.id
      );
      expect(kickedMember).toBeDefined();
      expect(kickedMember?.status).toBe('Kicked');
    } catch (e) {
      isError = true;
      console.error(
        'Error changing status of group member',
        (e as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });

  it('should allow a non-admin to rescind an invite to a group IF they invited the user', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to rescind invite',
          description: 'This is a group to rescind invite',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await addMembers(
        groupToChangeStatus.data.id,
        { memberIds: [users['ian'].firebaseUser.uid] },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['ian'].firebaseUser.uid,
        'Joined',
        users['ian'].firebaseToken
      );

      await addMembers(
        groupToChangeStatus.data.id,
        { memberIds: [users['oscar'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['oscar'].firebaseUser.uid,
        'Kicked',
        users['ian'].firebaseToken
      );

      const groupMembersResponse = await getAllGroupMembers();
      const invitingMember = groupMembersResponse.data.find(
        (gm) =>
          gm.groupId === groupToChangeStatus.data.id &&
          gm.invitedById === users['ian'].firebaseUser.uid
      );
      expect(invitingMember).toBeDefined();
      expect(invitingMember?.status).toBe('Kicked');

      const kickedMember = groupMembersResponse.data.find(
        (gm) =>
          gm.memberId === users['oscar'].firebaseUser.uid &&
          gm.groupId === groupToChangeStatus.data.id
      );
      expect(kickedMember).toBeDefined();
      expect(kickedMember?.status).toBe('Kicked');
    } catch (e) {
      isError = true;
      console.error(
        'Error changing status of group member',
        (e as AxiosError).response?.data
      );
      console.log(e);
    }
    expect(isError).toBe(false);
  });

  it('should remove admin status if an admin is kicked from a group', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to remove admin status',
          description: 'This is a group to remove admin status',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await addMembers(
        groupToChangeStatus.data.id,
        { memberIds: [users['ian'].firebaseUser.uid] },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['ian'].firebaseUser.uid,
        'Joined',
        users['ian'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToChangeStatus.data.id,
        users['ian'].firebaseUser.uid,
        users['david'].firebaseToken
      );

      const groupMembersResponse = await getAllGroupMembers();
      const adminMember = groupMembersResponse.data.find(
        (gm) =>
          gm.memberId === users['ian'].firebaseUser.uid &&
          gm.groupId === groupToChangeStatus.data.id
      );
      expect(adminMember).toBeDefined();
      expect(adminMember?.isAdmin).toBe(true);

      await changeStatus(
        groupToChangeStatus.data.id,
        users['ian'].firebaseUser.uid,
        'Kicked',
        users['david'].firebaseToken
      );

      const groupMembersAfterKickResponse = await getAllGroupMembers();

      const kickedMember = groupMembersAfterKickResponse.data.find(
        (gm) =>
          gm.memberId === users['ian'].firebaseUser.uid &&
          gm.groupId === groupToChangeStatus.data.id
      );

      expect(kickedMember).toBeDefined();
      expect(kickedMember?.isAdmin).toBe(false);
    } catch (e) {
      isError = true;
      console.error(e);
      console.error(
        'Error changing status of group member',
        (e as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('should remove admin status if an admin is banned from a group', async () => {
    let isError = false;
    try {
      const groupToChangeStatus = await createGroup(
        {
          name: 'Group to remove admin status',
          description: 'This is a group to remove admin status',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToChangeStatus.data);

      await addMembers(
        groupToChangeStatus.data.id,
        { memberIds: [users['ian'].firebaseUser.uid] },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToChangeStatus.data.id,
        users['ian'].firebaseUser.uid,
        'Joined',
        users['ian'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToChangeStatus.data.id,
        users['ian'].firebaseUser.uid,
        users['david'].firebaseToken
      );

      const groupMembersResponse = await getAllGroupMembers();
      const adminMember = groupMembersResponse.data.find(
        (gm) =>
          gm.memberId === users['ian'].firebaseUser.uid &&
          gm.groupId === groupToChangeStatus.data.id
      );
      expect(adminMember).toBeDefined();
      expect(adminMember?.isAdmin).toBe(true);

      await changeStatus(
        groupToChangeStatus.data.id,
        users['ian'].firebaseUser.uid,
        'Banned',
        users['david'].firebaseToken
      );

      const groupMembersAfterBanResponse = await getAllGroupMembers();

      const bannedMember = groupMembersAfterBanResponse.data.find(
        (gm) =>
          gm.memberId === users['ian'].firebaseUser.uid &&
          gm.groupId === groupToChangeStatus.data.id
      );
      expect(bannedMember).toBeDefined();
      expect(bannedMember?.isAdmin).toBe(false);
    } catch (e) {
      isError = true;
      console.error(
        'Error changing status of group member',
        (e as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
});

describe('Demoting admins', () => {
  it('should return a 200 status code on a successful demotion', async () => {
    let isError = false;
    try {
      const groupToDemoteAdmin = await createGroup(
        {
          name: 'Group to demote admin',
          description: 'This is a group to demote admin',
        },
        users['ian'].firebaseToken
      );

      groups.push(groupToDemoteAdmin.data);

      await addMembers(
        groupToDemoteAdmin.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToDemoteAdmin.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToDemoteAdmin.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      const response = await demoteAdminToMember(
        groupToDemoteAdmin.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
      expect(response.status).toBe(200);
      expect(response.data).toBe('Admin demoted to member');
    } catch (e) {
      isError = true;
      console.error('Error creating group', (e as AxiosError).response?.data);
    }
    expect(isError).toBe(false);
  });

  it('should not allow a non-admin to demote an admin', async () => {
    let isError = false;
    try {
      const groupToDemoteAdmin = await createGroup(
        {
          name: 'Group to demote admin',
          description: 'This is a group to demote admin',
        },
        users['david'].firebaseToken
      );

      groups.push(groupToDemoteAdmin.data);

      await addMembers(
        groupToDemoteAdmin.data.id,
        {
          memberIds: [
            users['ian'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
          ],
        },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToDemoteAdmin.data.id,
        users['ian'].firebaseUser.uid,
        'Joined',
        users['ian'].firebaseToken
      );
      await changeStatus(
        groupToDemoteAdmin.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToDemoteAdmin.data.id,
        users['ian'].firebaseUser.uid,
        users['david'].firebaseToken
      );

      await demoteAdminToMember(
        groupToDemoteAdmin.data.id,
        users['ian'].firebaseUser.uid,
        users['oscar'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You must be the creator of the group to demote an admin to member'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow an admin to demote another admin (unless they are the creator)', async () => {
    let isError = false;
    try {
      const groupToDemoteAdmin = await createGroup(
        {
          name: 'Group to demote admin',
          description: 'This is a group to demote admin',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToDemoteAdmin.data);

      await addMembers(
        groupToDemoteAdmin.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToDemoteAdmin.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToDemoteAdmin.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToDemoteAdmin.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToDemoteAdmin.data.id,
        users['oscar'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      await demoteAdminToMember(
        groupToDemoteAdmin.data.id,
        users['david'].firebaseUser.uid,
        users['oscar'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You must be the creator of the group to demote an admin to member'
      );
    }
    expect(isError).toBe(true);
  });

  it(`should return not found if the group doesn't exist`, async () => {
    let isError = false;
    try {
      await demoteAdminToMember(
        999999,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe('Group not found');
    }
    expect(isError).toBe(true);
  });

  it('should return not found when the user to demote is not in the group', async () => {
    let isError = false;
    try {
      const groupToDemoteAdmin = await createGroup(
        {
          name: 'Group to demote admin',
          description: 'This is a group to demote admin',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToDemoteAdmin.data);

      await demoteAdminToMember(
        groupToDemoteAdmin.data.id,
        'invalid-user-id',
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe('User not found in group');
    }
    expect(isError).toBe(true);
  });

  it('should return bad request when the users status is not joined', async () => {
    const groupToDemoteAdmin = await createGroup(
      {
        name: 'Group to demote admin',
        description: 'This is a group to demote admin',
      },
      users['ian'].firebaseToken
    );
    groups.push(groupToDemoteAdmin.data);

    await addMembers(
      groupToDemoteAdmin.data.id,
      {
        memberIds: [
          users['david'].firebaseUser.uid,
          users['oscar'].firebaseUser.uid,
          users['gabe'].firebaseUser.uid,
        ],
      },
      users['ian'].firebaseToken
    );

    // Demote an invited but not joined member
    try {
      await demoteAdminToMember(
        groupToDemoteAdmin.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe('User not found in group');
    }

    // Demote a joined but kicked member
    try {
      await changeStatus(
        groupToDemoteAdmin.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToDemoteAdmin.data.id,
        users['oscar'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToDemoteAdmin.data.id,
        users['oscar'].firebaseUser.uid,
        'Kicked',
        users['ian'].firebaseToken
      );

      await demoteAdminToMember(
        groupToDemoteAdmin.data.id,
        users['oscar'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe('User not found in group');
    }

    // Demote a banned member
    try {
      await changeStatus(
        groupToDemoteAdmin.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      await changeStatus(
        groupToDemoteAdmin.data.id,
        users['gabe'].firebaseUser.uid,
        'Banned',
        users['ian'].firebaseToken
      );

      await demoteAdminToMember(
        groupToDemoteAdmin.data.id,
        users['gabe'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe('User not found in group');
    }

    // Demote a declined member
    try {
      await changeStatus(
        groupToDemoteAdmin.data.id,
        users['david'].firebaseUser.uid,
        'Declined',
        users['david'].firebaseToken
      );

      await demoteAdminToMember(
        groupToDemoteAdmin.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe('User not found in group');
    }
  });

  it('should not allow a user to demote themselves', async () => {
    let isError = false;
    try {
      const groupToDemoteAdmin = await createGroup(
        {
          name: 'Group to demote admin',
          description: 'This is a group to demote admin',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToDemoteAdmin.data);

      await addMembers(
        groupToDemoteAdmin.data.id,
        { memberIds: [users['ian'].firebaseUser.uid] },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToDemoteAdmin.data.id,
        users['ian'].firebaseUser.uid,
        'Joined',
        users['ian'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToDemoteAdmin.data.id,
        users['ian'].firebaseUser.uid,
        users['david'].firebaseToken
      );

      await demoteAdminToMember(
        groupToDemoteAdmin.data.id,
        users['ian'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You must be the creator of the group to demote an admin to member'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow the creator to be demoted', async () => {
    let isError = false;
    try {
      const groupToDemoteAdmin = await createGroup(
        {
          name: 'Group to demote admin',
          description: 'This is a group to demote admin',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToDemoteAdmin.data);

      await demoteAdminToMember(
        groupToDemoteAdmin.data.id,
        users['david'].firebaseUser.uid,
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You cannot edit the creator of the group'
      );
    }
    expect(isError).toBe(true);
  });
});

describe('Promoting members to admins', () => {
  it('should return a 200 status code on a successful promotion', async () => {
    let isError = false;
    try {
      const groupToPromoteAdmin = await createGroup(
        {
          name: 'Group to promote admin',
          description: 'This is a group to promote admin',
        },
        users['ian'].firebaseToken
      );

      groups.push(groupToPromoteAdmin.data);

      await addMembers(
        groupToPromoteAdmin.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToPromoteAdmin.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const response = await promoteMemberToAdmin(
        groupToPromoteAdmin.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
      expect(response.status).toBe(200);
      expect(response.data).toBe('Member promoted to admin');
    } catch (e) {
      isError = true;
      console.error('Error creating group', (e as AxiosError).response?.data);
    }
    expect(isError).toBe(false);
  });

  it('should return 404 when the group does not exist', async () => {
    let isError = false;
    try {
      await promoteMemberToAdmin(
        999999,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe('Group not found');
    }
    expect(isError).toBe(true);
  });

  it('should not allow a member that is not in the group to promote another member', async () => {
    let isError = false;
    try {
      const groupToPromoteAdmin = await createGroup(
        {
          name: 'Group to promote admin',
          description: 'This is a group to promote admin',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToPromoteAdmin.data);

      await promoteMemberToAdmin(
        groupToPromoteAdmin.data.id,
        users['oscar'].firebaseUser.uid,
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You must be a member of the group to promote a member to admin'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow a non-admin to promote a member to admin', async () => {
    let isError = false;
    try {
      const groupToPromoteAdmin = await createGroup(
        {
          name: 'Group to promote admin',
          description: 'This is a group to promote admin',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToPromoteAdmin.data);

      await addMembers(
        groupToPromoteAdmin.data.id,
        {
          memberIds: [
            users['ian'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
          ],
        },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToPromoteAdmin.data.id,
        users['ian'].firebaseUser.uid,
        'Joined',
        users['ian'].firebaseToken
      );
      await changeStatus(
        groupToPromoteAdmin.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToPromoteAdmin.data.id,
        users['oscar'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You must be an admin to promote a member to admin'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow promotion to admin if they do not have a status of joined', async () => {
    let isError = false;
    try {
      const groupToPromoteAdmin = await createGroup(
        {
          name: 'Group to promote admin',
          description: 'This is a group to promote admin',
        },
        users['david'].firebaseToken
      );

      groups.push(groupToPromoteAdmin.data);

      await addMembers(
        groupToPromoteAdmin.data.id,
        { memberIds: [users['ian'].firebaseUser.uid] },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToPromoteAdmin.data.id,
        users['ian'].firebaseUser.uid,
        'Joined',
        users['ian'].firebaseToken
      );

      await leaveGroup(groupToPromoteAdmin.data.id, users['ian'].firebaseToken);

      await promoteMemberToAdmin(
        groupToPromoteAdmin.data.id,
        users['ian'].firebaseUser.uid,
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(400);
      expect((e as AxiosError).response?.data).toBe('User is not in the group');
    }
    expect(isError).toBe(true);
  });

  it('should return 404 if the member to promote does not exist', async () => {
    let isError = false;
    try {
      const groupToPromoteAdmin = await createGroup(
        {
          name: 'Group to promote admin',
          description: 'This is a group to promote admin',
        },
        users['david'].firebaseToken
      );

      groups.push(groupToPromoteAdmin.data);

      await promoteMemberToAdmin(
        groupToPromoteAdmin.data.id,
        'invalid-user-id',
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe('User not found in group');
    }
  });

  it('should not allow an admin to edit the creator of the group', async () => {
    let isError = false;
    try {
      const groupToPromoteAdmin = await createGroup(
        {
          name: 'Group to promote admin',
          description: 'This is a group to promote admin',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToPromoteAdmin.data);

      await addMembers(
        groupToPromoteAdmin.data.id,
        { memberIds: [users['ian'].firebaseUser.uid] },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToPromoteAdmin.data.id,
        users['ian'].firebaseUser.uid,
        'Joined',
        users['ian'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToPromoteAdmin.data.id,
        users['ian'].firebaseUser.uid,
        users['david'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToPromoteAdmin.data.id,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You cannot edit the creator of the group'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user to promote themselves', async () => {
    let isError = false;
    try {
      const groupToPromoteAdmin = await createGroup(
        {
          name: 'Group to promote admin',
          description: 'This is a group to promote admin',
        },
        users['ian'].firebaseToken
      );
      groups.push(groupToPromoteAdmin.data);

      await addMembers(
        groupToPromoteAdmin.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToPromoteAdmin.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToPromoteAdmin.data.id,
        users['david'].firebaseUser.uid,
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You must be an admin to promote a member to admin'
      );
    }
    expect(isError).toBe(true);
  });
});

describe('transferring ownership of a group', () => {
  it('should return a 200 status code on a successful transfer', async () => {
    let isError = false;
    try {
      const groupToTransfer = await createGroup(
        {
          name: 'Group to transfer ownership',
          description: 'This is a group to transfer ownership',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToTransfer.data);

      await addMembers(
        groupToTransfer.data.id,
        { memberIds: [users['ian'].firebaseUser.uid] },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToTransfer.data.id,
        users['ian'].firebaseUser.uid,
        'Joined',
        users['ian'].firebaseToken
      );

      const response = await transferGroupOwnership(
        groupToTransfer.data.id,
        users['ian'].firebaseUser.uid,
        users['david'].firebaseToken
      );

      expect(response.status).toBe(200);
      expect(response.data).toBe('Ownership transferred');
    } catch (e) {
      isError = true;
      console.error(
        'Error transferring group ownership',
        (e as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('should have new owner listed on properties', async () => {
    let isError = false;
    try {
      const groupToTransfer = await createGroup(
        {
          name: 'Group to transfer ownership',
          description: 'This is a group to transfer ownership',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToTransfer.data);

      await addMembers(
        groupToTransfer.data.id,
        { memberIds: [users['ian'].firebaseUser.uid] },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToTransfer.data.id,
        users['ian'].firebaseUser.uid,
        'Joined',
        users['ian'].firebaseToken
      );

      await transferGroupOwnership(
        groupToTransfer.data.id,
        users['ian'].firebaseUser.uid,
        users['david'].firebaseToken
      );

      const response = await getGroup(
        groupToTransfer.data.id,
        users['david'].firebaseToken
      );
      expect(response.data.createdById).toBe(users['ian'].firebaseUser.uid);
      const groupMembers = response.data.groupMembers;
      const owner = groupMembers.find(
        (gm) => gm.memberId === users['ian'].firebaseUser.uid
      );

      expect(owner?.isAdmin).toBe(true);
      expect(owner?.memberId).toBe(users['ian'].firebaseUser.uid);
      expect(owner?.memberId).toBe(response.data.createdById);
    } catch (e) {
      isError = true;
      console.error(
        'Error transferring group ownership',
        (e as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });

  it('should remove ownership of the previous owner', async () => {
    let isError = false;
    try {
      const groupToTransfer = await createGroup(
        {
          name: 'Group to transfer ownership',
          description: 'This is a group to transfer ownership',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToTransfer.data);

      await addMembers(
        groupToTransfer.data.id,
        { memberIds: [users['ian'].firebaseUser.uid] },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToTransfer.data.id,
        users['ian'].firebaseUser.uid,
        'Joined',
        users['ian'].firebaseToken
      );

      await transferGroupOwnership(
        groupToTransfer.data.id,
        users['ian'].firebaseUser.uid,
        users['david'].firebaseToken
      );

      const response = await getGroup(
        groupToTransfer.data.id,
        users['david'].firebaseToken
      );
      const groupMembers = response.data.groupMembers;
      const owner = groupMembers.find(
        (gm) => gm.memberId === users['ian'].firebaseUser.uid
      );

      expect(owner?.isAdmin).toBe(true);
      expect(owner?.memberId).toBe(users['ian'].firebaseUser.uid);
      expect(owner?.memberId).toBe(response.data.createdById);
    } catch (e) {
      isError = true;
      console.error(
        'Error transferring group ownership',
        (e as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });

  it('should not allow anyone that is not the creator to transfer ownership (admin)', async () => {
    let isError = false;
    try {
      const groupToTransfer = await createGroup(
        {
          name: 'Group to transfer ownership',
          description: 'This is a group to transfer ownership',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToTransfer.data);

      await addMembers(
        groupToTransfer.data.id,
        { memberIds: [users['ian'].firebaseUser.uid] },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToTransfer.data.id,
        users['ian'].firebaseUser.uid,
        'Joined',
        users['ian'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToTransfer.data.id,
        users['ian'].firebaseUser.uid,
        users['david'].firebaseToken
      );

      await transferGroupOwnership(
        groupToTransfer.data.id,
        users['ian'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You must be the creator of the group to transfer ownership'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow anyone that is not the creator to transfer ownership (member)', async () => {
    let isError = false;
    try {
      const groupToTransfer = await createGroup(
        {
          name: 'Group to transfer ownership',
          description: 'This is a group to transfer ownership',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToTransfer.data);

      await addMembers(
        groupToTransfer.data.id,
        { memberIds: [users['ian'].firebaseUser.uid] },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToTransfer.data.id,
        users['ian'].firebaseUser.uid,
        'Joined',
        users['ian'].firebaseToken
      );

      await transferGroupOwnership(
        groupToTransfer.data.id,
        users['ian'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'You must be the creator of the group to transfer ownership'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user to transfer ownership to themselves', async () => {
    let isError = false;
    try {
      const groupToTransfer = await createGroup(
        {
          name: 'Group to transfer ownership',
          description: 'This is a group to transfer ownership',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToTransfer.data);

      await transferGroupOwnership(
        groupToTransfer.data.id,
        users['david'].firebaseUser.uid,
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(403);
      expect((e as AxiosError).response?.data).toBe(
        'User is already the owner of the group'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user to transfer ownership to a user that is not in the group', async () => {
    let isError = false;
    try {
      const groupToTransfer = await createGroup(
        {
          name: 'Group to transfer ownership',
          description: 'This is a group to transfer ownership',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToTransfer.data);

      await transferGroupOwnership(
        groupToTransfer.data.id,
        'invalid-user-id',
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe('User is not in the group');
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user to transfer ownership to a user that is not joined (invited)', async () => {
    let isError = false;
    try {
      const groupToTransfer = await createGroup(
        {
          name: 'Group to transfer ownership',
          description: 'This is a group to transfer ownership',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToTransfer.data);

      await addMembers(
        groupToTransfer.data.id,
        { memberIds: [users['ian'].firebaseUser.uid] },
        users['david'].firebaseToken
      );

      await transferGroupOwnership(
        groupToTransfer.data.id,
        users['ian'].firebaseUser.uid,
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe('User is not in the group');
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user to transfer ownership to a user that is not joined (banned)', async () => {
    let isError = false;
    try {
      const groupToTransfer = await createGroup(
        {
          name: 'Group to transfer ownership',
          description: 'This is a group to transfer ownership',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToTransfer.data);

      await addMembers(
        groupToTransfer.data.id,
        { memberIds: [users['ian'].firebaseUser.uid] },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToTransfer.data.id,
        users['ian'].firebaseUser.uid,
        'Joined',
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToTransfer.data.id,
        users['ian'].firebaseUser.uid,
        'Banned',
        users['david'].firebaseToken
      );

      await transferGroupOwnership(
        groupToTransfer.data.id,
        users['ian'].firebaseUser.uid,
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe('User is not in the group');
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user to transfer ownership to a user that is not joined (kicked)', async () => {
    let isError = false;
    try {
      const groupToTransfer = await createGroup(
        {
          name: 'Group to transfer ownership',
          description: 'This is a group to transfer ownership',
        },
        users['david'].firebaseToken
      );
      groups.push(groupToTransfer.data);

      await addMembers(
        groupToTransfer.data.id,
        { memberIds: [users['ian'].firebaseUser.uid] },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToTransfer.data.id,
        users['ian'].firebaseUser.uid,
        'Joined',
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToTransfer.data.id,
        users['ian'].firebaseUser.uid,
        'Kicked',
        users['david'].firebaseToken
      );

      await transferGroupOwnership(
        groupToTransfer.data.id,
        users['ian'].firebaseUser.uid,
        users['david'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe('User is not in the group');
    }
    expect(isError).toBe(true);
  });

  it('should return not found if the group does not exist', async () => {
    let isError = false;
    try {
      await transferGroupOwnership(
        999999,
        users['david'].firebaseUser.uid,
        users['ian'].firebaseToken
      );
    } catch (e) {
      isError = true;
      expect((e as AxiosError).response?.status).toBe(404);
      expect((e as AxiosError).response?.data).toBe('Group not found');
    }
    expect(isError).toBe(true);
  });
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
        continue;
      }
      const firstName = groupToDelete.createdBy?.firstName;

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
