import { Context, NONERequest, util } from '@aws-appsync/utils';
import {
  MutationSendNotifArgs,
  Notification,
  Topic
} from '@Shared/codegen.types';

type ReqContext = Context<MutationSendNotifArgs>;
type ResContext = Context<MutationSendNotifArgs, object, object, object, Topic>;

function request(ctx: ReqContext): NONERequest {
  const { meetingId, recipientId, notificationInput } = ctx.args;
  const { type, ...restNotificationInput } = notificationInput;

  const __typename = 'Notification';
  const id = util.autoId();
  const time = util.time.nowISO8601();
  const message: Notification = {
    __typename,
    id,
    time,
    type: type || 'blank',
    ...restNotificationInput
  };
  const topic: Topic = { message, meetingId, recipientId };

  return { payload: topic };
}

function response(ctx: ResContext): Topic {
  return ctx.result;
}

export { request, response };
