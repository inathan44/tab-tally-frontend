import axios, { AxiosError } from 'axios';
import {
  createTransaction,
  deleteTransaction,
  getAllTransactionDetails,
  getTransaction,
  updateTransaction,
} from '../../../utils/transactionhelpers';

import {
  createUserInDbAndFirebase,
  deleteUserFromDbAndFirebase,
  generateMockUserInformation,
} from '../../../utils/userhelpers';
import { CreatedUser, GetGroupResponse } from '../../../types/api';
import {
  addMembers,
  changeStatus,
  createGroup,
  deleteGroup,
  getAllGroups,
  getGroup,
  leaveGroup,
  promoteMemberToAdmin,
} from '../../../utils/grouphelpers';

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
      // await new Promise((resolve) => setTimeout(resolve, 600));
      // users['ev'] = await createUserInDbAndFirebase({
      //   ...generateMockUserInformation(),
      //   firstName: 'ev',
      // });
    } catch (e) {
      isError = true;
      console.error('Error creating user', e);
    }
    expect(isError).toBe(false);
  }, 30000);
});

describe('creating transactions', () => {
  it('should return a successful status code on a valid transaction', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const createTransactionResponse = await createTransaction(
        {
          amount: 100,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 100, recipientId: users['david'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      expect(createTransactionResponse.status).toBe(201);
    } catch (error) {
      isError = true;
      console.error(
        'Error creating transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });

  it('should return a transaction object with the correct properties', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const createTransactionResponse = await createTransaction(
        {
          amount: 100,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 100, recipientId: users['david'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      expect(Object.keys(createTransactionResponse.data)).toEqual([
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
    } catch (error) {
      isError = true;
      console.error(
        'Error creating transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('should return a transaction with the correct values for each property', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );
      await changeStatus(
        groupToCreateTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );
      await changeStatus(
        groupToCreateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createTransactionResponse = await createTransaction(
        {
          amount: 150,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 60, recipientId: users['oscar'].firebaseUser.uid },
            { amount: 50, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      expect(createTransactionResponse.data.amount).toBe(150);
      expect(createTransactionResponse.data.createdById).toBe(
        users['ian'].firebaseUser.uid
      );
      expect(createTransactionResponse.data.payerId).toBe(
        users['ian'].firebaseUser.uid
      );
      expect(createTransactionResponse.data.description).toBe('test');
      expect(createTransactionResponse.data.groupId).toBe(
        groupToCreateTransaction.data.id
      );
      expect(createTransactionResponse.data.transactionDetails.length).toBe(3);
    } catch (error) {
      isError = true;
      console.error(
        'Error creating transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('should have the correct properties on the createdBy object', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );
      await changeStatus(
        groupToCreateTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );
      await changeStatus(
        groupToCreateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createTransactionResponse = await createTransaction(
        {
          amount: 150,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 60, recipientId: users['oscar'].firebaseUser.uid },
            { amount: 50, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      expect(
        Object.keys(createTransactionResponse.data.createdBy || {})
      ).toEqual([
        'id',
        'username',
        'firstName',
        'lastName',
        'createdAt',
        'updatedAt',
      ]);
    } catch (error) {
      isError = true;
      console.error(
        'Error creating transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('should have the correct properties on the payer object', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );
      await changeStatus(
        groupToCreateTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );
      await changeStatus(
        groupToCreateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createTransactionResponse = await createTransaction(
        {
          amount: 150,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 60, recipientId: users['oscar'].firebaseUser.uid },
            { amount: 50, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      expect(Object.keys(createTransactionResponse.data.payer || {})).toEqual([
        'id',
        'username',
        'firstName',
        'lastName',
        'createdAt',
        'updatedAt',
      ]);
    } catch (error) {
      isError = true;
      console.error(
        'Error creating transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('should have the correct properties on the transactionDetails array', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );
      await changeStatus(
        groupToCreateTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );
      await changeStatus(
        groupToCreateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createTransactionResponse = await createTransaction(
        {
          amount: 150,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 60, recipientId: users['oscar'].firebaseUser.uid },
            { amount: 50, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      expect(createTransactionResponse.data.transactionDetails.length).toBe(3);

      for (const transactionDetail of createTransactionResponse.data
        .transactionDetails) {
        expect(Object.keys(transactionDetail)).toEqual([
          'id',
          'transactionId',
          'recipientId',
          'recipient',
          'amount',
        ]);
      }
    } catch (error) {
      isError = true;
      console.error(
        'Error creating transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('should have the correct values for each property on the createdBy object', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );
      await changeStatus(
        groupToCreateTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );
      await changeStatus(
        groupToCreateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createTransactionResponse = await createTransaction(
        {
          amount: 150,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 60, recipientId: users['oscar'].firebaseUser.uid },
            { amount: 50, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      expect(createTransactionResponse.data.createdBy?.id).toBe(
        users['ian'].firebaseUser.uid
      );
      expect(createTransactionResponse.data.createdBy?.username).toBe(
        users['ian'].mockUser.username
      );
      expect(createTransactionResponse.data.createdBy?.firstName).toBe(
        users['ian'].mockUser.firstName
      );
      expect(createTransactionResponse.data.createdBy?.lastName).toBe(
        users['ian'].mockUser.lastName
      );
      expect(createTransactionResponse.data.createdBy?.createdAt).toBeDefined();
      expect(createTransactionResponse.data.createdBy?.updatedAt).toBeDefined();
    } catch (e) {
      isError = true;
      console.error('Error creating transaction', e);
    }
    expect(isError).toBe(false);
  });
  it('should have the correct values for each property on the payer object', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );
      await changeStatus(
        groupToCreateTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );
      await changeStatus(
        groupToCreateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createTransactionResponse = await createTransaction(
        {
          amount: 150,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 60, recipientId: users['oscar'].firebaseUser.uid },
            { amount: 50, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      expect(createTransactionResponse.data.payer?.id).toBe(
        users['ian'].firebaseUser.uid
      );
      expect(createTransactionResponse.data.payer?.username).toBe(
        users['ian'].mockUser.username
      );
      expect(createTransactionResponse.data.payer?.firstName).toBe(
        users['ian'].mockUser.firstName
      );
      expect(createTransactionResponse.data.payer?.lastName).toBe(
        users['ian'].mockUser.lastName
      );
      expect(createTransactionResponse.data.payer?.createdAt).toBeDefined();
      expect(createTransactionResponse.data.payer?.updatedAt).toBeDefined();
    } catch (e) {
      isError = true;
      console.error('Error creating transaction', e);
    }
    expect(isError).toBe(false);
  });
  it('should have the correct values for each property on the transactionDetails array', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );
      await changeStatus(
        groupToCreateTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );
      await changeStatus(
        groupToCreateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createTransactionResponse = await createTransaction(
        {
          amount: 150,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 60, recipientId: users['oscar'].firebaseUser.uid },
            { amount: 50, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      const details = createTransactionResponse.data.transactionDetails;
      expect(details.length).toBe(3);
      const detail1 = details.find((d) => d.amount === 40);
      const detail2 = details.find((d) => d.amount === 60);
      const detail3 = details.find((d) => d.amount === 50);

      expect(detail1?.amount).toBe(40);
      expect(detail1?.recipientId).toBe(users['david'].firebaseUser.uid);
      expect(detail1?.transactionId).toBe(createTransactionResponse.data.id);

      expect(detail2?.amount).toBe(60);
      expect(detail2?.recipientId).toBe(users['oscar'].firebaseUser.uid);
      expect(detail2?.transactionId).toBe(createTransactionResponse.data.id);

      expect(detail3?.amount).toBe(50);
      expect(detail3?.recipientId).toBe(users['gabe'].firebaseUser.uid);
      expect(detail3?.transactionId).toBe(createTransactionResponse.data.id);
    } catch (e) {
      isError = true;
      console.error('Error creating transaction', e);
    }
    expect(isError).toBe(false);
  });
  it('should return a 400 error on a malformed request body', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );
      await changeStatus(
        groupToCreateTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );
      await changeStatus(
        groupToCreateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      await createTransaction(
        {
          amount: 100,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 100, recipientId: users['gabe'].firebaseUser.uid },
          ],
        } as any,
        users['ian'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(400);
    }
    expect(isError).toBe(true);
  });
  it('should return a 404 if the group it is adding the transaction to does not exist', async () => {
    let isError = false;
    try {
      await createTransaction(
        {
          amount: 100,
          description: 'test',
          groupId: 9999999,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 60, recipientId: users['oscar'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(404);
    }
    expect(isError).toBe(true);
  });
  it('should allow a request to be made without a description', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );
      await changeStatus(
        groupToCreateTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );
      await changeStatus(
        groupToCreateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createTransactionResponse = await createTransaction(
        {
          amount: 150,
          groupId: groupToCreateTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 60, recipientId: users['oscar'].firebaseUser.uid },
            { amount: 50, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      expect(createTransactionResponse.status).toBe(201);
    } catch (error) {
      isError = true;
      console.error(
        'Error creating transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('should return 404 if any of the users that are being added to the transaction do not exist', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );
      await changeStatus(
        groupToCreateTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );
      await changeStatus(
        groupToCreateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      await createTransaction(
        {
          amount: 150,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 60, recipientId: users['oscar'].firebaseUser.uid },
            { amount: 50, recipientId: 'notarealuser' },
          ],
        },
        users['ian'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(404);
      expect((error as AxiosError).response?.data).toBe('user not found');
    }
    expect(isError).toBe(true);
  });
  it('should return a 404 if the user does exist but is not in the group', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [users['david'].firebaseUser.uid],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await createTransaction(
        {
          amount: 150,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 60, recipientId: users['oscar'].firebaseUser.uid },
            { amount: 50, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(404);
      expect((error as AxiosError).response?.data).toBe(
        'One or more recipients are not in this group'
      );
    }
    expect(isError).toBe(true);
  });
  it('should return 404 if the user has a groupmember status of something other than joined', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await createTransaction(
        {
          amount: 150,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 60, recipientId: users['oscar'].firebaseUser.uid },
            { amount: 50, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(404);
      expect((error as AxiosError).response?.data).toBe(
        'One or more recipients are not in this group'
      );
    }
    expect(isError).toBe(true);
  });
  it('should not allow a user who is not in the group to create a transaction', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await createTransaction(
        {
          amount: 150,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 60, recipientId: users['oscar'].firebaseUser.uid },
            { amount: 50, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(403);
      expect((error as AxiosError).response?.data).toBe(
        'Must be in the group to create a transaction'
      );
    }
    expect(isError).toBe(true);
  });
  it('should not allow a user who is not in the group to be added to a transaction as the payer', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [users['david'].firebaseUser.uid],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await createTransaction(
        {
          amount: 150,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['oscar'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(404);
      expect((error as AxiosError).response?.data).toBe(
        'Payer is not in this group'
      );
    }
    expect(isError).toBe(true);
  });
  it('should not allow a user who is not in the group to be added to a transaction as a recipient', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [users['david'].firebaseUser.uid],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await createTransaction(
        {
          amount: 150,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['oscar'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(404);
      expect((error as AxiosError).response?.data).toBe(
        'One or more recipients are not in this group'
      );
    }
    expect(isError).toBe(true);
  });
  it('should not allow a user who is not in the group to be added to a transaction as a creator', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      await createTransaction(
        {
          amount: 150,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['oscar'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(403);
      expect((error as AxiosError).response?.data).toBe(
        'Must be in the group to create a transaction'
      );
    }
    expect(isError).toBe(true);
  });
  it('should return bad request if the transaction details amount do not match the total amount', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [users['david'].firebaseUser.uid],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await createTransaction(
        {
          amount: 150,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(400);
      expect((error as AxiosError).response?.data).toBe(
        'Transaction total does not match transaction details total'
      );
    }
    expect(isError).toBe(true);
  });

  it('should allow negative amounts in transaction and details, indicating a repayment', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['david'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [users['oscar'].firebaseUser.uid],
        },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      const createTransactionResponse = await createTransaction(
        {
          amount: -50,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: -50, recipientId: users['oscar'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      expect(createTransactionResponse.status).toBe(201);
      expect(createTransactionResponse.data.amount).toBe(-50);
      expect(createTransactionResponse.data.transactionDetails[0].amount).toBe(
        -50
      );
    } catch (error) {
      isError = true;
      console.error(
        'Error creating transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });

  it('if there is a negative number as the transaction amount, the number of transaction details must be 1', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['david'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [
            users['oscar'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      await createTransaction(
        {
          amount: -50,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: -25, recipientId: users['oscar'].firebaseUser.uid },
            { amount: -25, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(400);
      expect((error as AxiosError).response?.data).toBe(
        'Repayment transactions must have exactly one recipient'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow someone to record a repayment for someone else', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['david'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [users['oscar'].firebaseUser.uid],
        },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await createTransaction(
        {
          amount: -50,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: -50, recipientId: users['oscar'].firebaseUser.uid },
          ],
        },
        users['oscar'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(403);
      expect((error as AxiosError).response?.data).toBe(
        'Cannot create a repayment for another user'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user to record a repayment for themselves', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['david'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [users['oscar'].firebaseUser.uid],
        },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await createTransaction(
        {
          amount: -50,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: -50, recipientId: users['david'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(403);
      expect((error as AxiosError).response?.data).toBe(
        'Transaction payer cannot be the only recipient'
      );
    }
  });
  it('should not allow a user to owe themselves money', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['david'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [users['oscar'].firebaseUser.uid],
        },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await createTransaction(
        {
          amount: 50,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 50, recipientId: users['david'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(400);
      expect((error as AxiosError).response?.data).toBe(
        'Transaction payer cannot be the only recipient'
      );
    }
  });
  it('should not allow a transaction amount to be 0', async () => {
    let isError = false;
    try {
      const groupToCreateTransaction = await createGroup(
        { name: 'test' },
        users['david'].firebaseToken
      );

      groups.push(groupToCreateTransaction.data);

      await addMembers(
        groupToCreateTransaction.data.id,
        {
          memberIds: [users['oscar'].firebaseUser.uid],
        },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToCreateTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await createTransaction(
        {
          amount: 0,
          description: 'test',
          groupId: groupToCreateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 0, recipientId: users['oscar'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(400);
      expect((error as AxiosError).response?.data).toBe('Amount is required');
    }
  });
});

describe('getting a transaction', () => {
  it('should return a successful response on a valid request', async () => {
    let isError = false;
    try {
      const groupToGetTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToGetTransaction.data);

      await addMembers(
        groupToGetTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );
      await changeStatus(
        groupToGetTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );
      await changeStatus(
        groupToGetTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 150,
          description: 'test',
          groupId: groupToGetTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 60, recipientId: users['oscar'].firebaseUser.uid },
            { amount: 50, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      const getTransactionResponse = await getTransaction(
        createdTransaction.data.id,
        users['ian'].firebaseToken
      );

      expect(getTransactionResponse.status).toBe(200);
    } catch (error) {
      isError = true;
      console.error(
        'Error creating transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });

  it('should return a 404 if the transaction does not exist', async () => {
    let isError = false;
    try {
      await getTransaction(99999999, users['ian'].firebaseToken);
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(404);
      expect((error as AxiosError).response?.data).toBe(
        'Transaction not found'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user who is not in the group to view a transaction', async () => {
    let isError = false;
    try {
      const groupToGetTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToGetTransaction.data);

      await addMembers(
        groupToGetTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 100,
          description: 'test',
          groupId: groupToGetTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 60, recipientId: users['oscar'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      await getTransaction(
        createdTransaction.data.id,
        users['gabe'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(403);
      expect((error as AxiosError).response?.data).toBe(
        'Must be in the group to view transaction'
      );
    }
    expect(isError).toBe(true);
  });

  it('should not allow a user who was previously in the group, but no longer has a status of joined, to view a transaction', async () => {
    let isError = false;
    try {
      const groupToGetTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToGetTransaction.data);

      await addMembers(
        groupToGetTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 100,
          description: 'test',
          groupId: groupToGetTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 60, recipientId: users['oscar'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      await leaveGroup(
        groupToGetTransaction.data.id,
        users['oscar'].firebaseToken
      );

      await getTransaction(
        createdTransaction.data.id,
        users['oscar'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(403);
      expect((error as AxiosError).response?.data).toBe(
        'Must be in the group to view transaction'
      );
    }
    expect(isError).toBe(true);
  });

  it('should have the correct properties on the transasction object', async () => {
    let isError = false;
    try {
      const groupToGetTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToGetTransaction.data);

      await addMembers(
        groupToGetTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 150,
          description: 'test',
          groupId: groupToGetTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 60, recipientId: users['oscar'].firebaseUser.uid },
            { amount: 50, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      const getTransactionResponse = await getTransaction(
        createdTransaction.data.id,
        users['ian'].firebaseToken
      );

      const transaction = getTransactionResponse.data;

      expect(Object.keys(transaction)).toEqual([
        'group',
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
    } catch (error) {
      isError = true;
      console.error('Error getting transaction', error);
    }
    expect(isError).toBe(false);
  });

  it('should have the correct values on the transaction object', async () => {
    let isError = false;
    try {
      const groupToGetTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToGetTransaction.data);

      await addMembers(
        groupToGetTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 150,
          description: 'testing this',
          groupId: groupToGetTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 60, recipientId: users['oscar'].firebaseUser.uid },
            { amount: 50, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      const getTransactionResponse = await getTransaction(
        createdTransaction.data.id,
        users['ian'].firebaseToken
      );

      const transaction = getTransactionResponse.data;

      expect(transaction.id).toBe(createdTransaction.data.id);
      expect(transaction.amount).toBe(150);
      expect(transaction.createdById).toBe(users['ian'].firebaseUser.uid);
      expect(transaction.createdBy?.id).toBe(users['ian'].firebaseUser.uid);
      expect(transaction.createdBy?.username).toBe(
        users['ian'].mockUser.username
      );
      expect(transaction.createdBy?.firstName).toBe(
        users['ian'].mockUser.firstName
      );
      expect(transaction.createdBy?.lastName).toBe(
        users['ian'].mockUser.lastName
      );
      expect(transaction.payerId).toBe(users['ian'].firebaseUser.uid);
      expect(transaction.description).toBe('testing this');
      expect(transaction.groupId).toBe(groupToGetTransaction.data.id);
      expect(transaction?.transactionDetails?.length).toBe(3);
    } catch (error) {
      isError = true;
      console.error(
        'Error getting transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });

  it('should have the correct properties on the transaction details object', async () => {
    let isError = false;
    try {
      const groupToGetTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToGetTransaction.data);

      await addMembers(
        groupToGetTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 150,
          description: 'testing this',
          groupId: groupToGetTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 60, recipientId: users['oscar'].firebaseUser.uid },
            { amount: 50, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      const getTransactionResponse = await getTransaction(
        createdTransaction.data.id,
        users['ian'].firebaseToken
      );

      const transaction = getTransactionResponse.data;

      for (const detail of transaction.transactionDetails || []) {
        expect(Object.keys(detail)).toEqual([
          'id',
          'transactionId',
          'recipientId',
          'recipient',
          'amount',
        ]);
      }
    } catch (error) {
      isError = true;
      console.error(
        'Error getting transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });

  it('should have the correct values on the transaction details object', async () => {
    let isError = false;
    try {
      const groupToGetTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToGetTransaction.data);

      await addMembers(
        groupToGetTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 150,
          description: 'testing this',
          groupId: groupToGetTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 60, recipientId: users['oscar'].firebaseUser.uid },
            { amount: 50, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      const getTransactionResponse = await getTransaction(
        createdTransaction.data.id,
        users['ian'].firebaseToken
      );

      const transaction = getTransactionResponse.data;

      const details = transaction.transactionDetails || [];

      const detail1 = details.find((detail) => detail.amount === 60);
      const detail2 = details.find((detail) => detail.amount === 50);
      const detail3 = details.find((detail) => detail.amount === 40);

      expect(detail1?.id).toBeDefined();
      expect(detail1?.recipientId).toBe(users['oscar'].firebaseUser.uid);
      expect(detail1?.amount).toBe(60);
      expect(detail1?.recipient?.id).toBe(users['oscar'].firebaseUser.uid);
      expect(detail1?.recipient?.username).toBe(
        users['oscar'].mockUser.username
      );
      expect(detail1?.recipient?.firstName).toBe(
        users['oscar'].mockUser.firstName
      );

      expect(detail2?.id).toBeDefined();
      expect(detail2?.recipientId).toBe(users['gabe'].firebaseUser.uid);
      expect(detail2?.amount).toBe(50);
      expect(detail2?.recipient?.id).toBe(users['gabe'].firebaseUser.uid);
      expect(detail2?.recipient?.username).toBe(
        users['gabe'].mockUser.username
      );
      expect(detail2?.recipient?.firstName).toBe(
        users['gabe'].mockUser.firstName
      );

      expect(detail3?.id).toBeDefined();
      expect(detail3?.recipientId).toBe(users['david'].firebaseUser.uid);
      expect(detail3?.amount).toBe(40);
      expect(detail3?.recipient?.id).toBe(users['david'].firebaseUser.uid);
      expect(detail3?.recipient?.username).toBe(
        users['david'].mockUser.username
      );
      expect(detail3?.recipient?.firstName).toBe(
        users['david'].mockUser.firstName
      );

      for (const detail of details) {
        expect(detail.transactionId).toBe(transaction.id);
        expect(detail.recipientId).toBe(
          users[detail.recipient?.firstName || ''].firebaseUser.uid
        );
      }
    } catch (error) {
      isError = true;
      console.error('Error getting transaction', error);
    }
    expect(isError).toBe(false);
  });

  it('should have the correct properties on the group object', async () => {
    let isError = false;
    try {
      const groupToGetTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToGetTransaction.data);

      await addMembers(
        groupToGetTransaction.data.id,
        {
          memberIds: [users['david'].firebaseUser.uid],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'testing this',
          groupId: groupToGetTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      const getTransactionResponse = await getTransaction(
        createdTransaction.data.id,
        users['ian'].firebaseToken
      );

      const transaction = getTransactionResponse.data;

      const group = transaction.group;

      expect(Object.keys(group || [])).toEqual([
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
    } catch (error) {
      isError = true;
      console.log('Error getting transaction', error);
    }
    expect(isError).toBe(false);
  });

  it('should have the correct values on the group object', async () => {
    let isError = false;
    try {
      const groupToGetTransaction = await createGroup(
        { name: 'test' },
        users['david'].firebaseToken
      );
      groups.push(groupToGetTransaction.data);

      await addMembers(
        groupToGetTransaction.data.id,
        {
          memberIds: [users['oscar'].firebaseUser.uid],
        },
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'testing this',
          groupId: groupToGetTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['oscar'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      const getTransactionResponse = await getTransaction(
        createdTransaction.data.id,
        users['david'].firebaseToken
      );

      const group = getTransactionResponse.data.group;

      expect(group?.id).toBe(groupToGetTransaction.data.id);
      expect(group?.name).toBe(groupToGetTransaction.data.name);
      expect(group?.description).toBe(groupToGetTransaction.data.description);
      expect(group?.createdById).toBe(users['david'].firebaseUser.uid);
      expect(group?.createdBy?.firstName).toBe(
        users['david'].mockUser.firstName
      );
      expect(group?.description).toBe(groupToGetTransaction.data.description);
      expect(group?.groupMembers).toBeNull();
      expect(group?.transactions).toBeNull();
    } catch (error) {
      isError = true;
      console.error('Error getting transaction', error);
    }
    expect(isError).toBe(false);
  });

  it('should return a 403 if the user is not in the group', async () => {
    let isError = false;
    try {
      const groupToGetTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );

      groups.push(groupToGetTransaction.data);

      await addMembers(
        groupToGetTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['oscar'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToGetTransaction.data.id,
        users['oscar'].firebaseUser.uid,
        'Joined',
        users['oscar'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 150,
          description: 'test',
          groupId: groupToGetTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
            { amount: 110, recipientId: users['oscar'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      await getTransaction(
        createdTransaction.data.id,
        users['gabe'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(403);
      expect((error as AxiosError).response?.data).toBe(
        'Must be in the group to view transaction'
      );
    }
    expect(isError).toBe(true);
  });

  it('should return a 404 if the transaction does not exist', async () => {
    let isError = false;
    try {
      await getTransaction(99999999, users['ian'].firebaseToken);
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(404);
      expect((error as AxiosError).response?.data).toBe(
        'Transaction not found'
      );
    }
    expect(isError).toBe(true);
  });
});

describe('Deleting a transaction', () => {
  it('should return a 200 on a successful request', async () => {
    const groupToDeleteTransaction = await createGroup(
      { name: 'test' },
      users['ian'].firebaseToken
    );
    groups.push(groupToDeleteTransaction.data);

    await addMembers(
      groupToDeleteTransaction.data.id,
      {
        memberIds: [users['david'].firebaseUser.uid],
      },
      users['ian'].firebaseToken
    );

    await changeStatus(
      groupToDeleteTransaction.data.id,
      users['david'].firebaseUser.uid,
      'Joined',
      users['david'].firebaseToken
    );

    const createdTransaction = await createTransaction(
      {
        amount: 40,
        description: 'test',
        groupId: groupToDeleteTransaction.data.id,
        payerId: users['ian'].firebaseUser.uid,
        transactionDetails: [
          { amount: 40, recipientId: users['david'].firebaseUser.uid },
        ],
      },
      users['ian'].firebaseToken
    );

    const deleteTransactionResponse = await deleteTransaction(
      createdTransaction.data.id,
      users['ian'].firebaseToken
    );

    expect(deleteTransactionResponse.status).toBe(200);
  });
  it('should return the correct message on a successful request', async () => {
    const groupToDeleteTransaction = await createGroup(
      { name: 'test' },
      users['ian'].firebaseToken
    );
    groups.push(groupToDeleteTransaction.data);

    await addMembers(
      groupToDeleteTransaction.data.id,
      {
        memberIds: [users['david'].firebaseUser.uid],
      },
      users['ian'].firebaseToken
    );

    await changeStatus(
      groupToDeleteTransaction.data.id,
      users['david'].firebaseUser.uid,
      'Joined',
      users['david'].firebaseToken
    );

    const createdTransaction = await createTransaction(
      {
        amount: 40,
        description: 'test',
        groupId: groupToDeleteTransaction.data.id,
        payerId: users['ian'].firebaseUser.uid,
        transactionDetails: [
          { amount: 40, recipientId: users['david'].firebaseUser.uid },
        ],
      },
      users['ian'].firebaseToken
    );

    const deleteTransactionResponse = await deleteTransaction(
      createdTransaction.data.id,
      users['ian'].firebaseToken
    );

    expect(deleteTransactionResponse.data).toBe('Transaction deleted');
  });
  it('should return a 404 if the transaction does not exist', async () => {
    let isError = false;
    try {
      await deleteTransaction(99999999, users['ian'].firebaseToken);
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(404);
      expect((error as AxiosError).response?.data).toBe(
        'Transaction not found'
      );
    }
    expect(isError).toBe(true);
  });
  it('should return a 403 if the user is not in the group', async () => {
    let isError = false;
    try {
      const groupToDeleteTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToDeleteTransaction.data);

      await addMembers(
        groupToDeleteTransaction.data.id,
        {
          memberIds: [users['david'].firebaseUser.uid],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToDeleteTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToDeleteTransaction.data.id,
          payerId: users['ian'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['david'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      await deleteTransaction(
        createdTransaction.data.id,
        users['gabe'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(403);
      expect((error as AxiosError).response?.data).toBe(
        'Must be in the group to delete transaction'
      );
    }
    expect(isError).toBe(true);
  });
  it('should return a 403 if the user does not have a status of joined', async () => {
    const groupToDeleteTransaction = await createGroup(
      { name: 'test' },
      users['ian'].firebaseToken
    );
    groups.push(groupToDeleteTransaction.data);

    await addMembers(
      groupToDeleteTransaction.data.id,
      {
        memberIds: [
          users['david'].firebaseUser.uid,
          users['gabe'].firebaseUser.uid,
        ],
      },
      users['ian'].firebaseToken
    );

    await changeStatus(
      groupToDeleteTransaction.data.id,
      users['gabe'].firebaseUser.uid,
      'Joined',
      users['gabe'].firebaseToken
    );

    const createdTransaction = await createTransaction(
      {
        amount: 40,
        description: 'test',
        groupId: groupToDeleteTransaction.data.id,
        payerId: users['ian'].firebaseUser.uid,
        transactionDetails: [
          { amount: 40, recipientId: users['gabe'].firebaseUser.uid },
        ],
      },
      users['ian'].firebaseToken
    );

    try {
      // INVITED
      await deleteTransaction(
        createdTransaction.data.id,
        users['david'].firebaseToken
      );
    } catch (error) {
      expect((error as AxiosError).response?.status).toBe(403);
      expect((error as AxiosError).response?.data).toBe(
        'Must be in the group to delete transaction'
      );
    }

    // DECLINED
    try {
      await changeStatus(
        groupToDeleteTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Declined',
        users['david'].firebaseToken
      );
      await deleteTransaction(
        createdTransaction.data.id,
        users['david'].firebaseToken
      );
    } catch (error) {
      expect((error as AxiosError).response?.status).toBe(403);
      expect((error as AxiosError).response?.data).toBe(
        'Must be in the group to delete transaction'
      );
    }

    // LEFT
    try {
      await addMembers(
        groupToDeleteTransaction.data.id,
        {
          memberIds: [users['david'].firebaseUser.uid],
        },
        users['ian'].firebaseToken
      );
      await changeStatus(
        groupToDeleteTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );
      await leaveGroup(
        groupToDeleteTransaction.data.id,
        users['david'].firebaseToken
      );
      await deleteTransaction(
        createdTransaction.data.id,
        users['david'].firebaseToken
      );
    } catch (error) {
      expect((error as AxiosError).response?.status).toBe(403);
      expect((error as AxiosError).response?.data).toBe(
        'Must be in the group to delete transaction'
      );
    }

    // KICKED
    try {
      await addMembers(
        groupToDeleteTransaction.data.id,
        {
          memberIds: [users['david'].firebaseUser.uid],
        },
        users['ian'].firebaseToken
      );
      await changeStatus(
        groupToDeleteTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );
      await changeStatus(
        groupToDeleteTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Kicked',
        users['ian'].firebaseToken
      );
      await deleteTransaction(
        createdTransaction.data.id,
        users['david'].firebaseToken
      );
    } catch (error) {
      expect((error as AxiosError).response?.status).toBe(403);
      expect((error as AxiosError).response?.data).toBe(
        'Must be in the group to delete transaction'
      );
    }

    // BANNED
    try {
      await addMembers(
        groupToDeleteTransaction.data.id,
        {
          memberIds: [users['david'].firebaseUser.uid],
        },
        users['ian'].firebaseToken
      );
      await changeStatus(
        groupToDeleteTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );
      await changeStatus(
        groupToDeleteTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Banned',
        users['ian'].firebaseToken
      );
      await deleteTransaction(
        createdTransaction.data.id,
        users['david'].firebaseToken
      );
    } catch (error) {
      expect((error as AxiosError).response?.status).toBe(403);
      expect((error as AxiosError).response?.data).toBe(
        'Must be in the group to delete transaction'
      );
    }

    const getTransactionResponse = await getTransaction(
      createdTransaction.data.id,
      users['ian'].firebaseToken
    );

    expect(getTransactionResponse.status).toBe(200);
    expect(getTransactionResponse.data).toBeDefined();
    expect(getTransactionResponse.data.id).toBe(createdTransaction.data.id);
  });
  it('should allow a user who is the payer to delete the transaction', async () => {
    let isError = false;
    try {
      const groupToDeleteTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToDeleteTransaction.data);

      await addMembers(
        groupToDeleteTransaction.data.id,
        {
          memberIds: [users['david'].firebaseUser.uid],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToDeleteTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToDeleteTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      const deleteTransactionResponse = await deleteTransaction(
        createdTransaction.data.id,
        users['david'].firebaseToken
      );

      expect(deleteTransactionResponse.status).toBe(200);
    } catch (error) {
      isError = true;
      console.error(
        'Error deleting transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('should allow an admin to delete the transaction', async () => {
    let isError = false;
    try {
      const groupToDeleteTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToDeleteTransaction.data);

      await addMembers(
        groupToDeleteTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToDeleteTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToDeleteTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToDeleteTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToDeleteTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      const deleteTransactionResponse = await deleteTransaction(
        createdTransaction.data.id,
        users['gabe'].firebaseToken
      );

      expect(deleteTransactionResponse.status).toBe(200);
    } catch (error) {
      isError = true;
      console.error(
        'Error deleting transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('should allow the creator of the transaction to delete the transaction', async () => {
    let isError = false;
    try {
      const groupToDeleteTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToDeleteTransaction.data);

      await addMembers(
        groupToDeleteTransaction.data.id,
        {
          memberIds: [users['david'].firebaseUser.uid],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToDeleteTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToDeleteTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      const deleteTransactionResponse = await deleteTransaction(
        createdTransaction.data.id,
        users['david'].firebaseToken
      );

      expect(deleteTransactionResponse.status).toBe(200);
    } catch (error) {
      isError = true;
      console.error(
        'Error deleting transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('should not allow a user who is not the payer, admin, or creator to delete the transaction', async () => {
    let isError = false;
    try {
      const groupToDeleteTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToDeleteTransaction.data);

      await addMembers(
        groupToDeleteTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToDeleteTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );
      await changeStatus(
        groupToDeleteTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToDeleteTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await deleteTransaction(
        createdTransaction.data.id,
        users['gabe'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(403);
      expect((error as AxiosError).response?.data).toBe(
        'Must be the payer, an admin, or the creator to delete transaction'
      );
    }
    expect(isError).toBe(true);
  });
  it('should have one less transaction after deleting the transaction', async () => {
    let isError = false;
    try {
      const groupToDeleteTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToDeleteTransaction.data);

      await addMembers(
        groupToDeleteTransaction.data.id,
        {
          memberIds: [users['david'].firebaseUser.uid],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToDeleteTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const transactionOneResponse = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToDeleteTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );
      const transactionTwoResponse = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToDeleteTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );
      const transactionThreeResponse = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToDeleteTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      const groupBeforeDeletion = await getGroup(
        groupToDeleteTransaction.data.id,
        users['ian'].firebaseToken
      );

      const numOfTransactionsBeforeDeletion =
        groupBeforeDeletion.data.transactions.length;

      await deleteTransaction(
        transactionOneResponse.data.id,
        users['david'].firebaseToken
      );
      await deleteTransaction(
        transactionTwoResponse.data.id,
        users['david'].firebaseToken
      );
      await deleteTransaction(
        transactionThreeResponse.data.id,
        users['david'].firebaseToken
      );

      const groupAfterDeletion = await getGroup(
        groupToDeleteTransaction.data.id,
        users['ian'].firebaseToken
      );

      const numOfTransactionsAfterDeletion =
        groupAfterDeletion.data.transactions.length;

      expect(numOfTransactionsAfterDeletion).toBe(
        numOfTransactionsBeforeDeletion - 3
      );
    } catch (error) {
      isError = true;
      console.error(
        'Error deleting transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('should remove the transaction details after deleting the transaction', async () => {
    let isError = false;
    try {
      const groupToDeleteTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToDeleteTransaction.data);

      await addMembers(
        groupToDeleteTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToDeleteTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToDeleteTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToDeleteTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 20, recipientId: users['ian'].firebaseUser.uid },
            { amount: 20, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      const detailsBeforeDeletion = await getAllTransactionDetails();

      await deleteTransaction(
        createdTransaction.data.id,
        users['david'].firebaseToken
      );

      const detailsAfterDeletion = await getAllTransactionDetails();

      expect(detailsBeforeDeletion.data.length).toBe(
        detailsAfterDeletion.data.length + 2
      );
    } catch (error) {
      isError = true;
      console.error('Error deleting transaction', error);
    }
    expect(isError).toBe(false);
  });
  it('should return a 404 when trying to delete a transaction that has already been deleted', async () => {
    let isError = false;
    try {
      const groupToDeleteTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToDeleteTransaction.data);

      await addMembers(
        groupToDeleteTransaction.data.id,
        {
          memberIds: [users['david'].firebaseUser.uid],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToDeleteTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToDeleteTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await deleteTransaction(
        createdTransaction.data.id,
        users['david'].firebaseToken
      );

      await deleteTransaction(
        createdTransaction.data.id,
        users['david'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(404);
      expect((error as AxiosError).response?.data).toBe(
        'Transaction not found'
      );
    }
    expect(isError).toBe(true);
  });
});

describe('Updating a transaction', () => {
  it('should return a 200 on a successful request', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);

      await addMembers(
        groupToUpdateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 20, recipientId: users['ian'].firebaseUser.uid },
            { amount: 20, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      const updateTransactionResponse = await updateTransaction(
        createdTransaction.data.id,
        {
          amount: 50,
          description: 'updated',
          payerId: users['gabe'].firebaseUser.uid,
          transactionDetails: [
            { amount: 30, recipientId: users['ian'].firebaseUser.uid },
            { amount: 20, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['gabe'].firebaseToken
      );

      expect(updateTransactionResponse.status).toBe(200);
    } catch (error) {
      isError = true;
      console.error('Error updating transaction', error);
    }
    expect(isError).toBe(false);
  });
  it('should return the correct message on a successful request', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);

      await addMembers(
        groupToUpdateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 20, recipientId: users['ian'].firebaseUser.uid },
            { amount: 20, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      const updateTransactionResponse = await updateTransaction(
        createdTransaction.data.id,
        {
          amount: 50,
          description: 'updated',
          payerId: users['gabe'].firebaseUser.uid,
          transactionDetails: [
            { amount: 30, recipientId: users['ian'].firebaseUser.uid },
            { amount: 20, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['gabe'].firebaseToken
      );

      expect(updateTransactionResponse.data).toBe('Transaction updated');
    } catch (error) {
      isError = true;
      console.error(
        'Error updating transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('the transaction should have the updated values', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);

      await addMembers(
        groupToUpdateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 20, recipientId: users['ian'].firebaseUser.uid },
            { amount: 20, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await updateTransaction(
        createdTransaction.data.id,
        {
          amount: 50,
          description: 'updated',
          payerId: users['gabe'].firebaseUser.uid,
          transactionDetails: [
            { amount: 25, recipientId: users['gabe'].firebaseUser.uid },
            { amount: 25, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['gabe'].firebaseToken
      );

      const getTransactionResponse = await getTransaction(
        createdTransaction.data.id,
        users['gabe'].firebaseToken
      );

      const updatedTransaction = getTransactionResponse.data;

      expect(updatedTransaction.amount).toBe(50);
      expect(updatedTransaction.description).toBe('updated');
      expect(updatedTransaction.payerId).toBe(users['gabe'].firebaseUser.uid);
      expect(updatedTransaction.transactionDetails.length).toBe(2);

      const details = updatedTransaction.transactionDetails;

      const gabeDetail = details.find(
        (detail) => detail.recipientId === users['gabe'].firebaseUser.uid
      );

      expect(gabeDetail).toBeDefined();
      expect(gabeDetail?.amount).toBe(25);
      expect(gabeDetail?.recipientId).toBe(users['gabe'].firebaseUser.uid);

      const ianDetail = details.find(
        (detail) => detail.recipientId === users['ian'].firebaseUser.uid
      );
      expect(ianDetail).toBeDefined();
      expect(ianDetail?.amount).toBe(25);
      expect(ianDetail?.recipientId).toBe(users['ian'].firebaseUser.uid);
    } catch (error) {
      isError = true;
      console.error('Error updating transaction', error);
    }
    expect(isError).toBe(false);
  });
  it('should return a 404 if the transaction does not exist', async () => {
    let isError = false;
    try {
      await updateTransaction(99999999, {}, users['ian'].firebaseToken);
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(404);
      expect((error as AxiosError).response?.data).toBe(
        'Transaction not found'
      );
    }
    expect(isError).toBe(true);
  });
  it('should return a 403 if the user is not in the group', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);

      await addMembers(
        groupToUpdateTransaction.data.id,
        {
          memberIds: [users['david'].firebaseUser.uid],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 20, recipientId: users['ian'].firebaseUser.uid },
            { amount: 20, recipientId: users['david'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await updateTransaction(
        createdTransaction.data.id,
        {},
        users['gabe'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(403);
      expect((error as AxiosError).response?.data).toBe(
        'Must be in the group to update transaction'
      );
    }
    expect(isError).toBe(true);
  });
  it('should return a 403 if the user does not have a status of joined', async () => {});
  it('should allow anyone who is in the group to update the transaction regardless of if they are involved', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);

      await addMembers(
        groupToUpdateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await updateTransaction(
        createdTransaction.data.id,
        {
          amount: 50,
          description: 'updated',
          payerId: users['gabe'].firebaseUser.uid,
          transactionDetails: [
            { amount: 30, recipientId: users['ian'].firebaseUser.uid },
            { amount: 20, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['gabe'].firebaseToken
      );
    } catch (error) {
      isError = true;
      console.error(
        'Error updating transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('should allow the payer to update the transaction', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);

      await addMembers(
        groupToUpdateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await updateTransaction(
        createdTransaction.data.id,
        {
          amount: 50,
          description: 'updated',
          payerId: users['gabe'].firebaseUser.uid,
          transactionDetails: [
            { amount: 30, recipientId: users['ian'].firebaseUser.uid },
            { amount: 20, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );
    } catch (error) {
      isError = true;
      console.error(
        'Error updating transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('should allow an admin to update the transaction', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);

      await addMembers(
        groupToUpdateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      await promoteMemberToAdmin(
        groupToUpdateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        users['ian'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await updateTransaction(
        createdTransaction.data.id,
        {
          amount: 50,
          description: 'updated',
          payerId: users['gabe'].firebaseUser.uid,
          transactionDetails: [
            { amount: 30, recipientId: users['ian'].firebaseUser.uid },
            { amount: 20, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['gabe'].firebaseToken
      );
    } catch (error) {
      isError = true;
      console.error(
        'Error updating transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('should allow the creator of the transaction to update the transaction', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);

      await addMembers(
        groupToUpdateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['gabe'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await updateTransaction(
        createdTransaction.data.id,
        {
          amount: 50,
          description: 'updated',
          payerId: users['gabe'].firebaseUser.uid,
          transactionDetails: [
            { amount: 30, recipientId: users['ian'].firebaseUser.uid },
            { amount: 20, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );
    } catch (error) {
      isError = true;
      console.error(
        'Error updating transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('should be able to change the payer of the transaction', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);

      await addMembers(
        groupToUpdateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await updateTransaction(
        createdTransaction.data.id,
        {
          amount: 50,
          description: 'updated',
          payerId: users['gabe'].firebaseUser.uid,
          transactionDetails: [
            { amount: 30, recipientId: users['ian'].firebaseUser.uid },
            { amount: 20, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['gabe'].firebaseToken
      );

      const getTransactionResponse = await getTransaction(
        createdTransaction.data.id,
        users['gabe'].firebaseToken
      );

      const updatedTransaction = getTransactionResponse.data;
      expect(updatedTransaction.payerId).toBe(users['gabe'].firebaseUser.uid);
    } catch (error) {
      isError = true;
      console.error(
        'Error updating transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('should be able to change the amount of the transaction', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);

      await addMembers(
        groupToUpdateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await updateTransaction(
        createdTransaction.data.id,
        {
          amount: 50,
          description: 'updated',
          payerId: users['gabe'].firebaseUser.uid,
          transactionDetails: [
            { amount: 30, recipientId: users['ian'].firebaseUser.uid },
            { amount: 20, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['gabe'].firebaseToken
      );

      const getTransactionResponse = await getTransaction(
        createdTransaction.data.id,
        users['gabe'].firebaseToken
      );

      const updatedTransaction = getTransactionResponse.data;
      expect(updatedTransaction.amount).toBe(50);
    } catch (error) {
      isError = true;
      console.error(
        'Error updating transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('should be able to change the description of the transaction', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);

      await addMembers(
        groupToUpdateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await updateTransaction(
        createdTransaction.data.id,
        {
          amount: 50,
          description: 'updated',
          payerId: users['gabe'].firebaseUser.uid,
          transactionDetails: [
            { amount: 30, recipientId: users['ian'].firebaseUser.uid },
            { amount: 20, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['gabe'].firebaseToken
      );

      const getTransactionResponse = await getTransaction(
        createdTransaction.data.id,
        users['gabe'].firebaseToken
      );

      const updatedTransaction = getTransactionResponse.data;
      expect(updatedTransaction.description).toBe('updated');
    } catch (error) {
      isError = true;
      console.error(
        'Error updating transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('should be able to change the transaction details of the transaction', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);

      await addMembers(
        groupToUpdateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await updateTransaction(
        createdTransaction.data.id,
        {
          amount: 50,
          description: 'updated',
          payerId: users['gabe'].firebaseUser.uid,
          transactionDetails: [
            { amount: 30, recipientId: users['ian'].firebaseUser.uid },
            { amount: 20, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['gabe'].firebaseToken
      );

      const getTransactionResponse = await getTransaction(
        createdTransaction.data.id,
        users['gabe'].firebaseToken
      );

      const updatedTransaction = getTransactionResponse.data;
      expect(updatedTransaction.transactionDetails.length).toBe(2);

      const details = updatedTransaction.transactionDetails;

      expect(details[0].amount).toBe(30);
      expect(details[0].recipientId).toBe(users['ian'].firebaseUser.uid);

      expect(details[1].amount).toBe(20);
      expect(details[1].recipientId).toBe(users['gabe'].firebaseUser.uid);
    } catch (error) {
      isError = true;
      console.error(
        'Error updating transaction',
        (error as AxiosError).response?.data
      );
    }
  });
  it('should allow the number of transaction details to change', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);

      await addMembers(
        groupToUpdateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await updateTransaction(
        createdTransaction.data.id,
        {
          amount: 60,
          description: 'updated',
          payerId: users['gabe'].firebaseUser.uid,
          transactionDetails: [
            { amount: 30, recipientId: users['ian'].firebaseUser.uid },
            { amount: 20, recipientId: users['gabe'].firebaseUser.uid },
            { amount: 10, recipientId: users['david'].firebaseUser.uid },
          ],
        },
        users['gabe'].firebaseToken
      );

      const getTransactionResponse = await getTransaction(
        createdTransaction.data.id,
        users['gabe'].firebaseToken
      );

      const updatedTransaction = getTransactionResponse.data;
      expect(updatedTransaction.transactionDetails.length).toBe(3);

      const details = updatedTransaction.transactionDetails;

      expect(details[0].amount).toBe(30);
      expect(details[0].recipientId).toBe(users['ian'].firebaseUser.uid);

      expect(details[1].amount).toBe(20);
      expect(details[1].recipientId).toBe(users['gabe'].firebaseUser.uid);

      expect(details[2].amount).toBe(10);
      expect(details[2].recipientId).toBe(users['david'].firebaseUser.uid);
    } catch (error) {
      isError = true;
      console.error(
        'Error updating transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
  it('should not allow transaction details that do not match the amount of the transaction', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);

      await addMembers(
        groupToUpdateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await updateTransaction(
        createdTransaction.data.id,
        {
          amount: 50,
          description: 'updated',
          payerId: users['gabe'].firebaseUser.uid,
          transactionDetails: [
            { amount: 30, recipientId: users['ian'].firebaseUser.uid },
            { amount: 20, recipientId: users['gabe'].firebaseUser.uid },
            { amount: 10, recipientId: users['david'].firebaseUser.uid },
          ],
        },
        users['gabe'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(400);
      expect((error as AxiosError).response?.data).toBe(
        'Transaction details do not match transaction amount'
      );
    }
    expect(isError).toBe(true);
  });
  it('should not allow a repayment transaction to be changed to a non-repayment transaction', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);

      await addMembers(
        groupToUpdateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: -40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: -40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await updateTransaction(
        createdTransaction.data.id,
        {
          amount: 50,
          description: 'updated',
          payerId: users['gabe'].firebaseUser.uid,
          transactionDetails: [
            { amount: 30, recipientId: users['ian'].firebaseUser.uid },
            { amount: 20, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['gabe'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(400);
      expect((error as AxiosError).response?.data).toBe(
        'Repayment transactions cannot be switched to non-repayment transactions'
      );
    }
    expect(isError).toBe(true);
  });
  it('should not allow a non-repayment transaction to be changed to a repayment transaction', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);

      await addMembers(
        groupToUpdateTransaction.data.id,
        {
          memberIds: [users['david'].firebaseUser.uid],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await updateTransaction(
        createdTransaction.data.id,
        {
          amount: -40,
          description: 'updated',
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: -40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(400);
      expect((error as AxiosError).response?.data).toBe(
        'Non-repayment transactions cannot be switched to repayment transactions'
      );
    }
    expect(isError).toBe(true);
  });
  it('should require details to be updated when the amount of the transaction changes', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);

      await addMembers(
        groupToUpdateTransaction.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await updateTransaction(
        createdTransaction.data.id,
        {
          amount: 50,
          description: 'updated',
          payerId: users['david'].firebaseUser.uid,
        },
        users['david'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(400);
      expect((error as AxiosError).response?.data).toBe(
        'Transaction details must be updated when the amount of the transaction changes'
      );
    }
    expect(isError).toBe(true);
  });
  it('should not allow the updated amount to be zero', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);

      await addMembers(
        groupToUpdateTransaction.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await updateTransaction(
        createdTransaction.data.id,
        {
          amount: 0,
          description: 'updated',
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 0, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(400);
      expect((error as AxiosError).response?.data).toBe(
        'Transaction amount cannot be zero'
      );
    }
    expect(isError).toBe(true);
  });
  it('should not allow the new payer to be a user who is not in the group', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);

      await addMembers(
        groupToUpdateTransaction.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );

      await updateTransaction(
        createdTransaction.data.id,
        {
          amount: 30,
          description: 'updated',
          payerId: users['gabe'].firebaseUser.uid,
          transactionDetails: [
            { amount: 30, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['ian'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(404);
      expect((error as AxiosError).response?.data).toBe(
        'New payer is not in this group'
      );
    }
    expect(isError).toBe(true);
  });
  it('should not let the transaction details have anyone who is not in the group', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);
      await addMembers(
        groupToUpdateTransaction.data.id,
        { memberIds: [users['david'].firebaseUser.uid] },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      await updateTransaction(
        createdTransaction.data.id,
        {
          amount: 30,
          description: 'updated',
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 30, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );
    } catch (error) {
      isError = true;
      expect((error as AxiosError).response?.status).toBe(404);
      expect((error as AxiosError).response?.data).toBe(
        'One or more recipients are not in this group'
      );
    }
    expect(isError).toBe(true);
  });
  it('should delete the previous transaction details and create new ones (if updating amount/details)', async () => {
    let isError = false;
    try {
      const groupToUpdateTransaction = await createGroup(
        { name: 'test' },
        users['ian'].firebaseToken
      );
      groups.push(groupToUpdateTransaction.data);

      await addMembers(
        groupToUpdateTransaction.data.id,
        {
          memberIds: [
            users['david'].firebaseUser.uid,
            users['gabe'].firebaseUser.uid,
          ],
        },
        users['ian'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['david'].firebaseUser.uid,
        'Joined',
        users['david'].firebaseToken
      );

      await changeStatus(
        groupToUpdateTransaction.data.id,
        users['gabe'].firebaseUser.uid,
        'Joined',
        users['gabe'].firebaseToken
      );

      const createdTransaction = await createTransaction(
        {
          amount: 40,
          description: 'test',
          groupId: groupToUpdateTransaction.data.id,
          payerId: users['david'].firebaseUser.uid,
          transactionDetails: [
            { amount: 40, recipientId: users['ian'].firebaseUser.uid },
          ],
        },
        users['david'].firebaseToken
      );

      const detailsResponseBeforeUpdate = await getAllTransactionDetails();

      await updateTransaction(
        createdTransaction.data.id,
        {
          amount: 30,
          description: 'updated',
          payerId: users['gabe'].firebaseUser.uid,
          transactionDetails: [
            { amount: 20, recipientId: users['ian'].firebaseUser.uid },
            { amount: 10, recipientId: users['gabe'].firebaseUser.uid },
          ],
        },
        users['gabe'].firebaseToken
      );

      const detailsResponseAfterUpdate = await getAllTransactionDetails();

      expect(detailsResponseBeforeUpdate.data.length).toBe(
        detailsResponseAfterUpdate.data.length - 1
      );
    } catch (error) {
      isError = true;
      console.error(
        'Error updating transaction',
        (error as AxiosError).response?.data
      );
    }
    expect(isError).toBe(false);
  });
});

// Add tests that allow a user to create a peer to peer transaction

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
