import { getLandingMessage } from '@Content';
import { clsm } from '@Utils';

function LandingTitle() {
  return (
    <div className={clsm(['flex', 'flex-col', 'gap-y-5'])}>
      <h1>{getLandingMessage('title')}</h1>
      <h3 className="dark:text-gray-400">{getLandingMessage('description')}</h3>
    </div>
  );
}

export default LandingTitle;
