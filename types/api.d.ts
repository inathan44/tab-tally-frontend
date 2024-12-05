import { User as FirebaseUser } from 'firebase/auth';

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

// *********************** Request Bodies ***********************

export type AddGroupMemberRequestBody = {
  memberIds: string[];
};

export type CreateGroupRequestBody = {
  name: string;
  description?: string;
};

interface ITransactionDetailsPartial {
  payerId: string;
  recipientId: string;
  groupId: number;
  amount: number;
}

export type CreateTransactionRequestBody = {
  payerId: string;
  amount: number;
  groupId: int;
  description?: string;
  transactionDetails: CreateTransactionTransactionDetail[];
};

export type CreateTransactionTransactionDetail = {
  amount: number;
  recipientId: string;
};

export type UpdateGroupRequestBody = {
  name?: string;
  description?: string;
};

type UpdateTransactionDTO = {
  payerId?: string;
  amount?: number;
  description?: string;
  transactionDetails?: UpdateTransactionDetailsDTO[];
};

type UpdateTransactionDetailsDTO = {
  amount: number;
  recipientId: string;
};

export type UpdateUserBody = {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
};

export type UpdateGroupRequestBody = {
  name?: string;
  description?: string;
};

export type AddMembersRequestBody = {
  memberIds: string[];
};

// export type ChangeStatusRequestBody = {
//   status: GroupMemberStatus;
// };

// *********************** Responses ***********************

export type CreateGroupResponse = {
  id: number;
  name: string;
  createdById: string;
  createdBy: User;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  groupMembers: GroupMember[];
};

export type CreateGroupMemberResponse = {
  id: number;
  groupId: number;
  memberId: string;
  isAdmin?: boolean;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  invitedById: string;
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
  transactions: Transaction[];
};

export type GetTransactionResponse = TransactionSummary & {
  group?: GroupSummaryDTO;
};

// *********************** Other ***********************
export type CreatedUser = {
  firebaseUser: FirebaseUser;
  firebaseToken: string;
  status: number;
  mockUser: UpdateUserBody;
};

export type TransactionDetailSummary = {
  id: number;
  transactionId: number;
  recipientId: string | null;
  recipient: UserSummaryDTO | null;
  amount: number;
};

export type TransactionSummary = {
  id: number;
  amount: number;
  createdById: string | null;
  createdBy: UserSummaryDTO | null;
  payerId: string | null;
  payer: UserSummaryDTO | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  groupId: number;
  transactionDetails: TransactionDetailSummary[];
};

export type GroupSummaryDTO = {
  id: number;
  name: string;
  description: string;
  createdById: number;
  createdBy: UserSummaryDTO | null;
  createdAt: Date;
  updatedAt: Date;
  groupMembers: GroupMemberSummaryDTO[];
  transactions: TransactionSummary[];
};

export type UserSummaryDTO = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
};

export type GroupMemberSummaryDTO = {
  id: number;
  memberId: string;
  member: UserSummaryDTO;
  invitedById: string;
  invitedBy: UserSummaryDTO;
  isAdmin: boolean;
  status: GroupMemberStatus;
  createdAt: Date;
  updatedAt: Date;
};
