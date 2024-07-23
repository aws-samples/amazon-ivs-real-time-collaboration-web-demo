import { Context, NONERequest } from '@aws-appsync/utils';
import {
  SubscriptionSubscribeToMessagesArgs,
  Topic
} from '@Shared/codegen.types';

type ReqContext = Context<SubscriptionSubscribeToMessagesArgs>;
type ResContext = Context<
  SubscriptionSubscribeToMessagesArgs,
  object,
  object,
  object,
  Topic
>;

function request(_ctx: ReqContext): NONERequest {
  return { payload: null };
}

function response(ctx: ResContext) {
  const { meetingId, recipientId = null } = ctx.args;

  extensions.setSubscriptionFilter(
    util.transform.toSubscriptionFilter({
      and: [
        { meetingId: { eq: meetingId } },
        { recipientId: { in: [recipientId, null] } }
      ]
    })
  );

  return null;
}

export { request, response };
