export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  AWSDate: { input: string; output: string };
  AWSDateTime: { input: string; output: string };
  AWSEmail: { input: string; output: string };
  AWSIPAddress: { input: string; output: string };
  AWSJSON: { input: string; output: string };
  AWSPhone: { input: string; output: string };
  AWSTime: { input: string; output: string };
  AWSTimestamp: { input: number; output: number };
  AWSURL: { input: string; output: string };
};

export type Event = IMessage & {
  __typename?: 'Event';
  attributes?: Maybe<Scalars['AWSJSON']['output']>;
  event: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  time: Scalars['AWSDateTime']['output'];
};

export type EventInput = {
  attributes?: InputMaybe<Scalars['AWSJSON']['input']>;
  event: Scalars['String']['input'];
};

export type IMessage = {
  attributes?: Maybe<Scalars['AWSJSON']['output']>;
  id: Scalars['ID']['output'];
  time: Scalars['AWSDateTime']['output'];
};

export type Message = Event | Notification;

export type Mutation = {
  __typename?: 'Mutation';
  sendEvent?: Maybe<Topic>;
  sendNotif?: Maybe<Topic>;
};

export type MutationSendEventArgs = {
  eventInput: EventInput;
  meetingId: Scalars['String']['input'];
  recipientId?: InputMaybe<Scalars['String']['input']>;
};

export type MutationSendNotifArgs = {
  meetingId: Scalars['String']['input'];
  notificationInput: NotificationInput;
  recipientId?: InputMaybe<Scalars['String']['input']>;
};

export type Notification = IMessage & {
  __typename?: 'Notification';
  attributes?: Maybe<Scalars['AWSJSON']['output']>;
  id: Scalars['ID']['output'];
  text?: Maybe<Scalars['String']['output']>;
  time: Scalars['AWSDateTime']['output'];
  type: Scalars['String']['output'];
};

export type NotificationInput = {
  attributes?: InputMaybe<Scalars['AWSJSON']['input']>;
  text?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type Query = {
  __typename?: 'Query';
  getTopic?: Maybe<Topic>;
};

export type Subscription = {
  __typename?: 'Subscription';
  subscribeToMessages?: Maybe<Topic>;
};

export type SubscriptionSubscribeToMessagesArgs = {
  meetingId: Scalars['String']['input'];
  recipientId?: InputMaybe<Scalars['String']['input']>;
};

export type Topic = {
  __typename?: 'Topic';
  meetingId: Scalars['String']['output'];
  message: IMessage;
  recipientId?: Maybe<Scalars['String']['output']>;
};
