import { IconCopy } from '@Assets/icons';
import { getMeetingMessage } from '@Content';
import { clsm, copy } from '@Utils';

import Button from './Button';

interface CopyButtonProps {
  text: string;
  description: string;
  name?: string;
  className?: string;
  disabled?: boolean;
}

function CopyButton({
  text,
  description,
  name,
  className,
  disabled
}: CopyButtonProps) {
  return (
    <Button
      isIcon
      name={name}
      type="button"
      variant="transparent"
      disabled={disabled}
      onClick={() => copy(text)}
      className={clsm(['group', className])}
      aria-label={getMeetingMessage('copy', { value: description })}
    >
      <IconCopy
        className={clsm([
          'transition-all',
          'group-enabled:group-active:scale-90'
        ])}
      />
    </Button>
  );
}

export default CopyButton;
