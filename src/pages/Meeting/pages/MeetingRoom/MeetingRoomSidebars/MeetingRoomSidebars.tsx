import { IconClose } from '@Assets/icons';
import { Button } from '@Components';
import { getMeetingMessage } from '@Content';
import { clsm } from '@Utils';
import { useEffect, useRef } from 'react';

import { Sidebar } from '../../../types';
import ChatSidebar from './ChatSidebar';
import PeopleSidebar from './PeopleSidebar';

interface MeetingRoomSidebarsProps {
  activeSidebar: Sidebar;
  changeSidebar: (sidebar: Sidebar) => void;
}

function MeetingRoomSidebars({
  activeSidebar,
  changeSidebar
}: MeetingRoomSidebarsProps) {
  const asideRef = useRef<HTMLElement>(null);
  const savedFocusRef = useRef<HTMLElement | null>(null);

  function closeSidebar() {
    changeSidebar(null);
  }

  useEffect(() => {
    const focusableElements =
      asideRef.current?.querySelectorAll<HTMLElement>(
        'textarea, a[href], button, input, select, [tabindex]:not([tabindex="-1"])'
      ) || [];
    const visibleFocusableElements = Array.from(focusableElements).filter(
      (el) =>
        el.offsetParent !== null &&
        !(el as HTMLButtonElement).disabled &&
        !el.hidden
    );
    const [firstFocusableEl] = visibleFocusableElements.sort(
      ({ tagName: tagName1 }, { tagName: tagName2 }) =>
        Number(tagName2 === 'TEXTAREA') - Number(tagName1 === 'TEXTAREA') ||
        Number(tagName2 === 'INPUT') - Number(tagName1 === 'INPUT') ||
        0
    );

    if (activeSidebar) {
      savedFocusRef.current = document.activeElement as HTMLElement | null;
      firstFocusableEl?.focus({ preventScroll: true });
    } else {
      savedFocusRef.current?.focus();
      savedFocusRef.current = null;
    }
  }, [activeSidebar]);

  return (
    <aside
      ref={asideRef}
      className={clsm([
        'flex',
        'flex-col',
        'items-center',
        'justify-center',
        'py-4',
        'h-full',
        'w-[344px]',
        'max-w-[100vw]',
        'gap-y-4',
        'rounded-xl',
        'overflow-hidden',
        'bg-zinc-200',
        'dark:bg-zinc-800',
        activeSidebar === null && 'hidden'
      ])}
    >
      <header
        className={clsm([
          'flex',
          'justify-between',
          'items-center',
          'w-full',
          'px-4'
        ])}
      >
        <h4>{activeSidebar && getMeetingMessage(activeSidebar)}</h4>
        <Button isIcon variant="transparent" onClick={closeSidebar}>
          <IconClose />
        </Button>
      </header>
      <div
        className={clsm([
          'flex',
          'flex-col',
          'flex-1',
          'items-center',
          'justify-start',
          'w-full',
          'text-sm',
          'font-medium',
          'pl-4',
          'pr-2',
          'scrollbar-stable',
          'overflow-y-auto',
          'overflow-x-hidden'
        ])}
      >
        <PeopleSidebar isVisible={activeSidebar === 'people'} />
        <ChatSidebar isVisible={activeSidebar === 'chat'} />
      </div>
    </aside>
  );
}

export default MeetingRoomSidebars;
