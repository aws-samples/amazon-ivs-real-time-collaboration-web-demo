import { IconArrowDown } from '@Assets/icons';
import { Button } from '@Components';
import { getMeetingMessage } from '@Content';
import { useChat } from '@Contexts/Chat';
import { Transition } from '@headlessui/react';
import { clsm } from '@Utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useResizeDetector } from 'react-resize-detector';

import ChatComposer from './ChatComposer';
import ChatMessage from './ChatMessage';

interface ChatSidebarProps {
  isVisible?: boolean;
}

function ChatSidebar({ isVisible = true }: ChatSidebarProps) {
  const { messages } = useChat();
  const [isSticky, setIsSticky] = useState(true);
  const messagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, []);

  useResizeDetector({
    onResize: scrollToBottom,
    targetRef: messagesRef,
    handleHeight: isSticky,
    handleWidth: false
  });

  useEffect(() => {
    if (isSticky) {
      scrollToBottom();
    }
  }, [scrollToBottom, isSticky, isVisible, messages.size]);

  useEffect(() => {
    const messagesEl = messagesRef.current;

    const updateSticky = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      if (messagesEl) {
        const { scrollHeight, clientHeight, scrollTop } = messagesEl;
        const isStuckToBottom = scrollHeight - scrollTop - clientHeight <= 5;
        setIsSticky(isStuckToBottom);
      }
    };

    messagesEl?.addEventListener('scroll', updateSticky, { passive: false });

    return () => messagesEl?.removeEventListener('scroll', updateSticky);
  }, []);

  return (
    <div
      className={clsm([
        'flex',
        'flex-col',
        'justify-between',
        'w-full',
        'h-full',
        !isVisible && 'hidden'
      ])}
    >
      <div className={clsm(['relative', 'h-full', 'min-h-[48px]'])}>
        <div
          role="log"
          ref={messagesRef}
          className={clsm([
            'flex',
            'flex-col',
            'items-start',
            'gap-y-2',
            'pr-2',
            'pb-2',
            '-mr-4',
            'h-full',
            'scrollbar-stable',
            'overflow-y-auto',
            'overflow-x-hidden'
          ])}
        >
          {Array.from(messages).map(([id, message]) => (
            <Transition
              key={id}
              show
              appear
              unmount={false}
              enterFrom="opacity-50 scale-95"
              enterTo="opacity-100 scale-100"
            >
              <ChatMessage message={message} />
            </Transition>
          ))}
        </div>
        <Transition
          appear
          show={!isSticky}
          enterFrom="opacity-0 scale-0"
          enterTo="opacity-100 scale-100"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-0"
        >
          <Button
            isIcon
            variant="secondary"
            className={clsm([
              'absolute',
              'bottom-2',
              'left-1/2',
              'drop-shadow-sm',
              'transition-all',
              '-translate-x-1/2',
              'drop-shadow-sm',
              'ring-1',
              'ring-inset',
              'ring-gray-300',
              'dark:ring-zinc-600'
            ])}
            onClick={scrollToBottom}
            aria-label={getMeetingMessage('scrollChatToBottom')}
          >
            <IconArrowDown />
          </Button>
        </Transition>
      </div>
      <ChatComposer />
    </div>
  );
}

export default ChatSidebar;
