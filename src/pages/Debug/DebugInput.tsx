import { CopyButton, Input } from '@Components';
import { clsm } from '@Utils';

interface DebugInputProps {
  name: string;
  label: string;
  value: string;
  dir?: 'auto' | 'ltr' | 'rtl';
}

function DebugInput({ name, value, label, dir }: DebugInputProps) {
  return (
    <div className={clsm(['flex', 'items-end', 'gap-2'])}>
      <Input
        readOnly
        disabled={!value}
        name={name}
        label={label}
        value={value}
        dir={dir}
      />
      <CopyButton disabled={!value} text={value} description={label} />
    </div>
  );
}

export default DebugInput;
