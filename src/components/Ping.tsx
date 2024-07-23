import { clsm } from '@Utils';

interface PingProps {
  infinite?: boolean;
  position?: 'top-left' | 'top-right';
}

function Ping({ infinite = false, position = 'top-right' }: PingProps) {
  return (
    <span
      className={clsm([
        'absolute',
        'right-0',
        'top-0',
        'flex',
        'h-3',
        'w-3',
        {
          'left-0': position === 'top-left',
          'right-0': position === 'top-right'
        }
      ])}
    >
      <span
        className={clsm([
          'absolute',
          'inline-flex',
          'h-full',
          'w-full',
          'rounded-full',
          'opacity-75',
          'bg-red-400',
          infinite
            ? 'animate-ping'
            : 'animate-[ping_1s_cubic-bezier(0,0,0.2,1)]'
        ])}
      />
      <span
        className={clsm([
          'relative',
          'inline-flex',
          'h-3',
          'w-3',
          'rounded-full',
          'bg-red-500'
        ])}
      />
    </span>
  );
}

export default Ping;
