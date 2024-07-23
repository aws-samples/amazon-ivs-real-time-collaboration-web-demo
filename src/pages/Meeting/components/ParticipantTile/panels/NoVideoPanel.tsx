import { Avatar } from '@Components';
import { clsm } from '@Utils';

interface NoVideoPanelProps {
  name: string;
  picture: string;
}

function NoVideoPanel({ name, picture }: NoVideoPanelProps) {
  return (
    <div
      className={clsm([
        'absolute',
        'inset-0',
        'rounded-xl',
        'bg-zinc-200',
        'dark:bg-zinc-800'
      ])}
    >
      <div
        className={clsm([
          'relative',
          'flex',
          'flex-col',
          'items-center',
          'justify-center',
          'gap-y-3',
          'font-semibold',
          'w-full',
          'h-full',
          'p-4'
        ])}
      >
        <Avatar
          name={name}
          src={picture}
          className={clsm([
            'h-1/2',
            'max-h-20',
            'min-h-0',
            'hidden',
            '@[11rem]:block'
          ])}
        />
        {name && (
          <span
            className={clsm([
              'truncate',
              'leading-4',
              'w-full',
              'max-w-sm',
              'text-center'
            ])}
          >
            {name}
          </span>
        )}
      </div>
    </div>
  );
}

export default NoVideoPanel;
