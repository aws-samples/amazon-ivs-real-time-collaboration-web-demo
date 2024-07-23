import { messagesApi } from '@Api';
import { CustomStageEvents } from '@Contexts/StageManager';
import { exhaustiveSwitchGuard, noop } from '@Utils';
import toast, { ToastOptions, ToastType } from 'react-hot-toast';

let messageSubscriptions: Array<
  ReturnType<typeof messagesApi.subscribeToMessages>
> = [];

function subscribeToMessages(
  meetingId: string,
  recipientId: string,
  onReceivedCustomStageEvent: (event: string) => void = noop
) {
  const subscription = messagesApi.subscribeToMessages({
    meetingId,
    recipientId,
    onMessage: (msg) => {
      switch (msg.__typename) {
        case 'Event': {
          // Verify that the event we emit is specifically a CUSTOM stage event
          const isCustomStageEvent = Object.values(CustomStageEvents).find(
            (cse) => cse === msg.event
          );

          if (isCustomStageEvent) {
            onReceivedCustomStageEvent(msg.event);
          }

          break;
        }

        case 'Notification': {
          const attrs = JSON.parse(msg.attributes || '{}');
          const toastOpts: ToastOptions = { id: msg.id, ...attrs.toastOptions };
          const toastType = msg.type as ToastType;

          if (msg.text !== undefined) {
            if (msg.text === null) {
              toast.dismiss(toastOpts.id);
            } else if (toastType === 'blank') {
              toast(msg.text, toastOpts);
            } else {
              toast[toastType](msg.text, toastOpts);
            }
          }

          break;
        }

        default: {
          if (msg.__typename) {
            exhaustiveSwitchGuard(msg.__typename);
          }
        }
      }
    }
  });

  messageSubscriptions.push(subscription);
}

function unsubscribeFromMessages() {
  messageSubscriptions.forEach((subscription) => subscription.unsubscribe());
  messageSubscriptions = [];
}

export { subscribeToMessages, unsubscribeFromMessages };
