const subscribeToMessagesDoc = /* GraphQL */ `
  subscription SubscribeToMessages($meetingId: String!, $recipientId: String) {
    subscribeToMessages(meetingId: $meetingId, recipientId: $recipientId) {
      meetingId
      recipientId
      message {
        __typename
        id
        time
        attributes
        ... on Event {
          event
        }
        ... on Notification {
          text
          type
        }
      }
    }
  }
`;

// eslint-disable-next-line import/prefer-default-export
export { subscribeToMessagesDoc };
