import { Spinner } from '@Components';
import { getMeetingEndedMessage } from '@Content';
import { clsm } from '@Utils';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const COUNTDOWN_DURATION = 60;

function RedirectCountdown() {
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const navigate = useNavigate();

  useEffect(() => {
    function countdown(time: number) {
      if (time <= 0) {
        return navigate('/');
      }

      setTimeRemaining(time);
      timeoutRef.current = setTimeout(countdown, 1000, time - 1);
    }

    countdown(COUNTDOWN_DURATION);

    return () => clearTimeout(timeoutRef.current);
  }, [navigate]);

  return (
    <div className={clsm(['absolute', 'top-4', 'right-4', '[&>*]:h-12'])}>
      <span
        className={clsm([
          'absolute',
          'w-12',
          'flex',
          'items-center',
          'justify-center'
        ])}
      >
        {timeRemaining}
      </span>
      <Spinner
        duration={COUNTDOWN_DURATION}
        className={clsm(['absolute', 'w-12', 'h-12', '[&_circle]:stroke-1'])}
      />
      <span className={clsm(['flex', 'items-center', 'ml-14'])}>
        {getMeetingEndedMessage('returningToHomeScreen')}
      </span>
    </div>
  );
}

export default RedirectCountdown;
