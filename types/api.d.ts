// *********************** Models ***********************
export type GroupMember = {
  id: number;
  groupId: number;
  memberId: string;
  invitedById: string;
  isAdmin: boolean;
  status: GroupMemberStatus;
  createdAt: Date;
  updatedAt: Date;
  group?: Group;
  member?: User;
  invitedBy?: User;
};

export type GroupMemberStatus =
  | 'Invited'
  | 'Joined'
  | 'Left'
  | 'Declined'
  | 'Kicked'
  | 'Banned';

export type Group = {
  id: number;
  name: string;
  createdById: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  groupMembers?: GroupMember[];
  createdBy?: User;
};

export type Transaction = {
  id: number;
  createdById: string;
  createdBy: User;
  payerId: string;
  amount: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  groupId: number;
  user?: User;
  payer?: User;
  group?: Group;
  transactionDetails?: TransactionDetail[];
};

export type TransactionDetail = {
  id: number;
  transactionId: number;
  recipientId: string;
  groupId: number;
  amount: number;
  transaction?: Transaction;
  recipient?: User;
  group?: Group;
};

export type User = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
  groupMembers?: GroupMember[];
};

// Request and response types for the API

export type UpdateUserBody = {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
};

export type GetGroupResponse = {
  id: number;
  name: string;
  description?: string;
  createdById: string;
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
  groupMembers: GroupMember[];
  transactions: Partial<Transaction[]>;
};

export type getUserGroupsResponse = {
  id: number;
  name: string;
  description?: string;
  createdById: string;
  createdBy: Partial<User>;
  createdAt: Date;
  updatedAt: Date;
  groupMembers: Partial<GroupMember>[];
};
