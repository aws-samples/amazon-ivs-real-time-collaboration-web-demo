import { IconMicOff } from '@Assets/icons';
import { getMeetingMessage } from '@Content';
import { MeetingParticipantAttributes, ParticipantGroup } from '@Shared/types';
import { clsm } from '@Utils';

import { NoVideoPanel } from '../panels';
import TileInfoPill from './TileInfoPill';

interface TileOverlaysProps {
  attributes: MeetingParticipantAttributes;
  audioMuted?: boolean;
  videoHidden?: boolean;
}

function TileOverlays({
  attributes,
  audioMuted = false,
  videoHidden = false
}: TileOverlaysProps) {
  let participantName = attributes.name;
  if (attributes.participantGroup === ParticipantGroup.DISPLAY) {
    participantName = `${attributes.name} (${getMeetingMessage('presentation')})`;
  }

  return (
    <>
      {videoHidden && <NoVideoPanel {...attributes} />}
      <div
        className={clsm([
          'absolute',
          'inset-0',
          '@xs:inset-2',
          'gap-0',
          '@xs:gap-2',
          'transition-all',
          'grid',
          'justify-between',
          'content-between',
          'grid-rows-[auto_auto]',
          'grid-cols-[auto_auto]'
        ])}
      >
        <span />
        <TileInfoPill
          isVisible={audioMuted}
          autoHideAvatar={false}
          avatar={
            <IconMicOff
              className={clsm(['@xs:!bg-transparent', 'p-1', '@xs:!p-px'])}
            />
          }
        />
        <TileInfoPill
          isVisible={!videoHidden}
          content={participantName}
          avatar={[attributes.picture, attributes.name]}
        />
      </div>
    </>
  );
}

export default TileOverlays;
