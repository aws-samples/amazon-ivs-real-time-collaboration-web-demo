import { Toast } from '@Components';
import { clsm } from '@Utils';

import LandingActions from './LandingActions';
import LandingCover from './LandingCover';
import LandingTitle from './LandingTitle';
import UserMenu from './UserMenu';

function Landing() {
  return (
    <main
      className={clsm([
        'h-dvh',
        'w-full',
        'grid',
        'grid-cols-2',
        'md:grid-cols-1',
        'overflow-auto'
      ])}
    >
      <Toast />
      <section
        className={clsm([
          'relative',
          'flex',
          'items-center',
          'm-4',
          'py-24',
          'max-w-[651px]',
          'md:max-w-full'
        ])}
      >
        <div
          className={clsm([
            'flex',
            'flex-col',
            'gap-y-[60px]',
            'mx-16',
            'xl:mx-10',
            'lg:mx-6',
            'md:mx-2'
          ])}
        >
          <LandingTitle />
          <LandingActions />
        </div>
        <UserMenu />
      </section>
      <section
        className={clsm([
          'my-4',
          'mr-4',
          'rounded-3xl',
          'overflow-hidden',
          'md:hidden'
        ])}
      >
        <LandingCover />
      </section>
    </main>
  );
}

export default Landing;
