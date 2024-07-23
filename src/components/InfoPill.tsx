import { clsm } from '@Utils';

interface InfoPillProps {
  text?: string;
  className?: string;
  Icon?: React.ElementType;
}

function InfoPill({ text, className, Icon }: InfoPillProps) {
  return (
    <pre
      className={clsm([
        'flex',
        'items-center',
        'justify-center',
        'gap-x-2',
        'py-1',
        'px-4',
        'h-7',
        'text-sm',
        'rounded-full',
        'cursor-default',
        'bg-gray-200',
        'dark:bg-zinc-800',
        className
      ])}
    >
      {Icon && <Icon className={clsm(['fill-current', 'w-4'])} />}
      {text}
    </pre>
  );
}

export default InfoPill;
