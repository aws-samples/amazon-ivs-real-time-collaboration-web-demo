import { clsm } from '@Utils';

function Anchor({
  children,
  className,
  target = '_blank', // Default: open the linked document in a new window or tab
  ...restProps
}: JSX.IntrinsicElements['a']) {
  return (
    <a
      {...restProps}
      target={target}
      className={clsm([
        'group',
        'inline',
        'outline-none',
        'font-semibold',
        'break-words',
        'overflow-hidden',
        'whitespace-pre-wrap',
        className
      ])}
    >
      <span
        className={clsm([
          'rounded-sm',
          'group-hover:underline',
          'group-focus-visible:outline',
          'group-focus-visible:outline-2',
          'group-focus-visible:outline-offset-2'
        ])}
      >
        {children}
      </span>
    </a>
  );
}

export default Anchor;
