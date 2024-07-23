import { IconArrowForward, IconKeyboard } from '@Assets/icons';
import { Button, Input } from '@Components';
import { getErrorMessage, getLandingMessage } from '@Content';
import { clsm } from '@Utils';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';

function LandingActions() {
  const [stageCode, setStageCode] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const errorReason = location.state?.errorReason;

  function createMeeting() {
    navigate('/-?new_stage=true', { state: { meetingPage: 'room' } });
  }

  function joinMeeting(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    navigate(`/${stageCode}`, { state: { meetingPage: 'preview' } });
  }

  useEffect(() => {
    if (errorReason) {
      navigate(location.pathname, { replace: true, state: null }); // clear location state
      toast.error(getErrorMessage(errorReason));
    }
  }, [errorReason, location.pathname, navigate]);

  return (
    <div
      className={clsm([
        'flex',
        'gap-3',
        'lg:flex-col',
        'md:flex-row',
        'sm:flex-col'
      ])}
    >
      <Button
        name="createNewStage"
        onClick={createMeeting}
        className={clsm(['flex-initial', 'basis-0', 'w-full'])}
      >
        {getLandingMessage('createNewStageBtnLabel')}
      </Button>
      <form
        onSubmit={joinMeeting}
        className={clsm(['flex', 'gap-3', 'grow', 'w-full'])}
      >
        <Input
          required
          name="stageCode"
          value={stageCode}
          Icon={IconKeyboard}
          onChange={setStageCode}
          placeholder={getLandingMessage('customStageCodePlaceholder')}
        />
        <Button
          isIcon
          type="submit"
          variant="secondary"
          name="joinByStageCode"
          aria-label={getLandingMessage('customStageCodeSubmitBtnAriaLabel')}
        >
          <IconArrowForward />
        </Button>
      </form>
    </div>
  );
}

export default LandingActions;
