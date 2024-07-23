import {
  IconChatClosed,
  IconChatOpen,
  IconPeopleClosed,
  IconPeopleOpen
} from '@Assets/icons';
import sounds from '@Assets/sounds';
import { ButtonGroup } from '@Components';
import { getMeetingMessage } from '@Content';
import { useChat } from '@Contexts/Chat';
import { clsm } from '@Utils';
import { useEffect, useRef, useState } from 'react';

import { MeetingControls } from '../../components';
import { Sidebar } from '../../types';

interface MeetingRoomFooterProps {
  activeSidebar: Sidebar;
  changeSidebar: (sidebar: Sidebar) => void;
  leaveMeeting: () => void;
}

const sidebars: NonNullable<Sidebar>[] = ['people', 'chat'];
const sidebarIcons: Record<
  NonNullable<Sidebar>,
  {
    open: React.FC<React.SVGProps<SVGSVGElement>>;
    closed: React.FC<React.SVGProps<SVGSVGElement>>;
  }
> = {
  people: { open: IconPeopleOpen, closed: IconPeopleClosed },
  chat: { open: IconChatOpen, closed: IconChatClosed }
};

function MeetingRoomFooter({
  activeSidebar,
  changeSidebar,
  leaveMeeting
}: MeetingRoomFooterProps) {
  const { messages } = useChat();
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const startingMessagesCount = useRef<number | null>(null);
  const isChatOpen = activeSidebar === 'chat';

  useEffect(() => {
    if (hasNewMessages) {
      const id = sounds.howl?.play('chatNotification');
      sounds.howl?.volume(0.35, id as number);
    }
  }, [hasNewMessages]);

  useEffect(() => {
    if (isChatOpen) {
      setHasNewMessages(false);
      startingMessagesCount.current = null;
    } else if (startingMessagesCount.current === null) {
      startingMessagesCount.current = messages.size;
    } else {
      setHasNewMessages(messages.size > startingMessagesCount.current);
    }
  }, [isChatOpen, messages.size]);

  return (
    <footer
      className={clsm([
        'grid',
        'p-4',
        'w-screen',
        'gap-3',
        'grid-cols-[1fr_auto_1fr]',
        '[&>*:first-child]:col-start-2',
        '[&>*:first-child]:place-content-center',
        '[&>*:last-child]:place-content-end',
        'sm:grid-cols-[auto_min-content]',
        'sm:[&>*:first-child]:col-start-1'
      ])}
    >
      <MeetingControls leaveMeeting={leaveMeeting} />
      <ButtonGroup
        isIcon
        collapseAt="md"
        variant="transparent"
        className={clsm(['flex', 'justify-end'])}
        buttons={sidebars.map((sb) => {
          const { open: OpenIcon, closed: ClosedIcon } = sidebarIcons[sb];
          const isActive = activeSidebar === sb;
          const hasPing = !isActive && sb === 'chat' && hasNewMessages;

          return {
            name: sb,
            hasPing,
            children: isActive ? <OpenIcon /> : <ClosedIcon />,
            onClick: () => changeSidebar(sb),
            ...(isActive && {
              darkVariant: 'secondary',
              lightVariant: 'tertiary'
            }),
            'aria-label': isActive
              ? getMeetingMessage('closeSidebar', { sidebar: sb })
              : getMeetingMessage('openSidebar', { sidebar: sb })
          };
        })}
      />
    </footer>
  );
}

export default MeetingRoomFooter;
