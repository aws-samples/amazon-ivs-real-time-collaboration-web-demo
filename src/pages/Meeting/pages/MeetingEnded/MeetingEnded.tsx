import { Button } from '@Components';
import { getMeetingEndedMessage } from '@Content';
import { clsm } from '@Utils';
import { useNavigate } from 'react-router-dom';

import RedirectCountdown from './RedirectCountdown';

function MeetingEnded() {
  const navigate = useNavigate();

  function rejoin() {
    navigate(0);
  }

  function returnToHomeScreen() {
    navigate('/');
  }

  return (
    <section className={clsm(['flex', 'flex-col', 'items-center', 'gap-y-11'])}>
      <h2>{getMeetingEndedMessage('youLeftTheStage')}</h2>
      <div className={clsm(['flex', 'gap-3', 'sm:flex-col'])}>
        <Button variant="secondary" onClick={rejoin}>
          {getMeetingEndedMessage('rejoin')}
        </Button>
        <Button variant="primary" onClick={returnToHomeScreen}>
          {getMeetingEndedMessage('returnToHomeScreen')}
        </Button>
        <RedirectCountdown />
      </div>
    </section>
  );
}

export default MeetingEnded;
