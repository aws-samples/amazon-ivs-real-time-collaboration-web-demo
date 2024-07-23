import { Context, NONERequest, util } from '@aws-appsync/utils';
import { Event, MutationSendEventArgs, Topic } from '@Shared/codegen.types';

type ReqContext = Context<MutationSendEventArgs>;
type ResContext = Context<MutationSendEventArgs, object, object, object, Topic>;

function request(ctx: ReqContext): NONERequest {
  const { meetingId, recipientId, eventInput } = ctx.args;

  const __typename = 'Event';
  const id = util.autoId();
  const time = util.time.nowISO8601();
  const message: Event = { __typename, id, time, ...eventInput };
  const topic: Topic = { message, meetingId, recipientId };

  return { payload: topic };
}

function response(ctx: ResContext): Topic {
  return ctx.result;
}

export { request, response };
