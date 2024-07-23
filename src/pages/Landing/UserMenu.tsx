import { IconLogout } from '@Assets/icons';
import { Avatar, Button } from '@Components';
import { useAuth } from '@Contexts/Auth';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { clsm } from '@Utils';
import { signOut } from 'aws-amplify/auth';

function UserMenu() {
  const authUser = useAuth();

  return (
    <Popover className={clsm(['absolute', 'top-0', 'left-0'])}>
      {({ close, open }) => (
        <>
          <PopoverButton
            as={Button}
            darkVariant={open ? 'tertiary' : 'transparent'}
            lightVariant={open ? 'secondary' : 'transparent'}
            className={clsm(['group', 'p-2', 'pr-4', 'gap-2', 'max-w-48'])}
          >
            <Avatar
              name={authUser.username}
              className={clsm(['transition', 'group-hover:scale-110'])}
            />
            <p className="truncate">{authUser.username}</p>
          </PopoverButton>
          <PopoverPanel
            transition
            className={clsm([
              'absolute',
              'p-1.5',
              'mt-1.5',
              'w-screen',
              'max-w-48',
              'font-medium',
              'space-y-2',
              'rounded-xl',
              'drop-shadow-xl',
              'transition',
              'ease-in-out',
              'duration-200',
              'origin-top-left',
              'data-[closed]:scale-95',
              'data-[closed]:opacity-0',
              'data-[closed]:-translate-y-1',
              'ring-1',
              'ring-inset',
              'ring-zinc-200/50',
              'dark:ring-zinc-700/50',
              'bg-zinc-100',
              'dark:bg-zinc-800'
            ])}
          >
            <Button
              onClick={() => {
                signOut();
                close();
              }}
              variant="transparent"
              className={clsm([
                'w-full',
                'gap-2',
                'px-2.5',
                'rounded-lg',
                'justify-start'
              ])}
            >
              <IconLogout className="shrink-0" /> Logout
            </Button>
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
}

export default UserMenu;
