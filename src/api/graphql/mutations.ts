const sendEventDoc = /* GraphQL */ `
  mutation SendEvent(
    $meetingId: String!
    $recipientId: String
    $event: String!
    $attributes: AWSJSON
  ) {
    sendEvent(
      meetingId: $meetingId
      recipientId: $recipientId
      eventInput: { event: $event, attributes: $attributes }
    ) {
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
      }
    }
  }
`;

const sendNotifDoc = /* GraphQL */ `
  mutation SendNotif(
    $meetingId: String!
    $recipientId: String
    $text: String!
    $type: String
    $attributes: AWSJSON
  ) {
    sendNotif(
      meetingId: $meetingId
      recipientId: $recipientId
      notificationInput: { text: $text, type: $type, attributes: $attributes }
    ) {
      meetingId
      recipientId
      message {
        __typename
        id
        time
        attributes
        ... on Notification {
          text
          type
        }
      }
    }
  }
`;

const dismissNotifDoc = /* GraphQL */ `
  mutation DismissNotif(
    $meetingId: String!
    $recipientId: String
    $attributes: AWSJSON!
  ) {
    sendNotif(
      meetingId: $meetingId
      recipientId: $recipientId
      notificationInput: { text: null, attributes: $attributes }
    ) {
      meetingId
      recipientId
      message {
        __typename
        attributes
        id
        time
        ... on Notification {
          type
          text
        }
      }
    }
  }
`;

export { dismissNotifDoc, sendEventDoc, sendNotifDoc };
