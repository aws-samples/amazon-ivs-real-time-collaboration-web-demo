import { clsm } from '@Utils';

interface SpinnerProps {
  duration?: number;
  className?: string;
}

function Spinner({ duration = 0, className }: SpinnerProps) {
  const isCountdown = duration > 0;

  return (
    <span
      id="spinner"
      role="progressbar"
      className={clsm([
        'inline-flex',
        'items-center',
        'justify-center',
        'w-6',
        'h-6',
        'shrink-0',
        className
      ])}
    >
      <span
        className={clsm(['w-full', 'h-full', !isCountdown && 'animate-spin'])}
      >
        <svg
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          className={clsm(['-rotate-90', 'scale-y-[-1]'])}
        >
          <circle
            r={10}
            cy={12}
            cx={12}
            strokeWidth={4}
            stroke="currentColor"
            className="opacity-25"
          />
          <circle
            r={10}
            cx={12}
            cy={12}
            strokeWidth={4}
            stroke="currentColor"
            strokeLinecap="round"
            strokeDasharray={2 * 3.14 * 10}
            style={
              isCountdown
                ? { animation: `countdown ${duration}s linear forwards` }
                : { strokeDashoffset: 'calc(1.5 * 3.14 * 10px)' }
            }
            className={clsm(isCountdown && 'animate-countdown')} // `animate-countdown` required for the `animation` style prop to take effect
          />
        </svg>
      </span>
    </span>
  );
}

export default Spinner;
