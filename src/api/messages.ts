import {
  EventInput,
  Message,
  Mutation,
  NotificationInput,
  Subscription,
  SubscriptionSubscribeToMessagesArgs
} from '@Shared/codegen.types';
import {
  generateClient,
  GraphQLQuery,
  GraphQLSubscription
} from 'aws-amplify/api';

import { mutations, subscriptions } from './graphql';

type AppSyncMutation = GraphQLQuery<Mutation>;
type AppSyncSubscription = GraphQLSubscription<Subscription>;

interface MessageDestination {
  meetingId: string;
  recipientId?: string;
}

const client = generateClient();
const gql = client.graphql.bind(client);

function sendEvent(data: EventInput & MessageDestination) {
  /**
   * Prevent against unintentional delivery of an event to all meeting participants
   * when a recipientId is provided to sendEvent with a value of `undefined`.
   *
   * This check ensures that an event is delivered to the intended receiving parties.
   */
  if (Object.hasOwn(data, 'recipientId') && data.recipientId === undefined) {
    return;
  }

  return gql<AppSyncMutation>({
    query: mutations.sendEventDoc,
    variables: data
  });
}

function sendNotif(data: NotificationInput & MessageDestination) {
  /**
   * Prevent against unintentional delivery of a notification to all meeting participants
   * when a recipientId is provided to sendNotif with a value of `undefined`.
   *
   * This check ensures that an notification is delivered to the intended receiving parties.
   */
  if (Object.hasOwn(data, 'recipientId') && data.recipientId === undefined) {
    return;
  }

  return gql<AppSyncMutation>({
    query: mutations.sendNotifDoc,
    variables: data
  });
}

function dismissNotif(notifId: string, dest: MessageDestination) {
  /**
   * Prevent against unintentional dismissal of a notification for all meeting participants
   * when a recipientId is provided to dismissNotif with a value of `undefined`.
   *
   * This check ensures that the notification is dismissed for the intended receiving parties.
   */
  if (Object.hasOwn(dest, 'recipientId') && dest.recipientId === undefined) {
    return;
  }

  const data = {
    ...dest,
    attributes: JSON.stringify({ toastOptions: { id: notifId } })
  };

  return gql<AppSyncMutation>({
    query: mutations.dismissNotifDoc,
    variables: data
  });
}

function subscribeToMessages({
  meetingId,
  recipientId,
  onMessage,
  onError = console.error
}: SubscriptionSubscribeToMessagesArgs & {
  onMessage: (msg: Message) => void;
  onError?: (error: unknown) => void;
}) {
  const observable = gql<AppSyncSubscription>({
    query: subscriptions.subscribeToMessagesDoc,
    variables: { meetingId, recipientId }
  });

  const subscription = observable.subscribe({
    next: ({ data }) => {
      const topic = data.subscribeToMessages;
      const message = topic?.message;

      if (message) {
        onMessage(message as Message);
      }
    },
    error: onError
  });

  return subscription;
}

export { dismissNotif, sendEvent, sendNotif, subscribeToMessages };
