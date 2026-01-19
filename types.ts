
export enum EChatType {
  group = 1,
  personal = 2,
}

export enum EChannelStatus {
  active = 1,
  deactivated = 2,
}

export enum EMessageStatus {
  sent = 1,
  delivered = 2,
  read = 3,
}

export interface IUser {
  _id: string;
  userName: string;
  email: string;
  name?: string;
  isOnline?: boolean;
}

export interface IDashboardItem {
  chatId: string;
  type: EChatType;
  name: string;
  channelId?: string;
  userId?: string;
}

export interface IMessage {
  _id: string;
  message: string;
  senderName: string;
  readBy?: string[];
  createdAt?: string;
}

export interface ISocketResponse<T> {
  success: number;
  errormessage: string;
  response: T;
}
