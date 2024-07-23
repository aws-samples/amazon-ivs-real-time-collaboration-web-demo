import { CopyButton } from '@Components';
import { clsm } from '@Utils';
import Balancer from 'react-wrap-balancer';

interface InfoCardProps {
  title: string;
  message: string;
  copy?: string;
}

function InfoCard({ title, message, copy }: InfoCardProps) {
  return message ? (
    <div
      className={clsm([
        'flex',
        'flex-col',
        'p-4',
        'pr-[60px]',
        'gap-y-2',
        'relative',
        'rounded-xl',
        'bg-gray-100',
        'dark:bg-zinc-700/50'
      ])}
    >
      {title}
      <Balancer
        ratio={0.75}
        className={clsm([
          'font-mono',
          'break-words',
          'whitespace-break-spaces',
          'w-full',
          '!line-clamp-2',
          'text-gray-500',
          'dark:text-gray-400'
        ])}
      >
        {message}
      </Balancer>
      {copy && (
        <CopyButton
          text={copy}
          description={title}
          className={clsm([
            'absolute',
            'right-4',
            'top-1/2',
            '-translate-y-1/2'
          ])}
        />
      )}
    </div>
  ) : null;
}

export default InfoCard;
