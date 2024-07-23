import { MeetingParticipantInfo, ParticipantGroup } from '@Shared/types';
import { clsm } from '@Utils';
import {
  getBestFitWithOverflow,
  getComputedGridSlotStyle,
  getComputedParticipantGridStyle
} from '@Utils/layout';
import { deepEqual } from 'fast-equals';
import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useResizeDetector } from 'react-resize-detector';

import {
  ParticipantOverflowTile,
  ParticipantVideoPreviewTile,
  ParticipantVideoTile
} from '../../components';

interface ParticipantsGridProps {
  isScreen?: boolean;
  participants: MeetingParticipantInfo[];
}

function ParticipantsGrid({ isScreen, participants }: ParticipantsGridProps) {
  const [bestFit, setBestFit] = useState(getBestFitWithOverflow);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoTilesCount = participants.length - bestFit.overflow;
  const videoParticipants = participants.slice(0, videoTilesCount);
  const overflowParticipants = participants.slice(videoTilesCount);

  const updateBestFit = useCallback(() => {
    setBestFit(
      getBestFitWithOverflow(
        participants.length,
        containerRef.current?.clientWidth,
        containerRef.current?.clientHeight,
        isScreen
      )
    );
  }, [participants.length, isScreen]);

  // Re-compute best-fit calculations on participant count changes
  useLayoutEffect(updateBestFit, [updateBestFit, participants.length]);
  // Re-compute best-fit calculations on container resize events
  useResizeDetector({ targetRef: containerRef, onResize: updateBestFit });

  return participants.length > 0 ? (
    <div
      data-grid
      ref={containerRef}
      className={clsm([
        'peer',
        'flex',
        'items-center',
        'justify-center',
        'w-full',
        'h-full',
        'overflow-hidden',
        'animate-scaleIn',
        'peer-data-[grid]:animate-fadeInUp'
      ])}
    >
      <div
        style={getComputedParticipantGridStyle(bestFit, isScreen)}
        className={clsm(['grid', 'grow', 'place-items-center'])}
      >
        {videoParticipants.map((vp, i) => {
          const ParticipantTile =
            vp.isLocal &&
            vp.attributes.participantGroup === ParticipantGroup.USER
              ? ParticipantVideoPreviewTile
              : ParticipantVideoTile;

          return (
            <ParticipantTile
              {...vp}
              key={vp.id}
              isScreen={isScreen}
              containerStyle={getComputedGridSlotStyle(i, bestFit)}
            />
          );
        })}
        {overflowParticipants.length > 0 && (
          <ParticipantOverflowTile
            participants={overflowParticipants}
            containerStyle={getComputedGridSlotStyle(videoTilesCount, bestFit)}
          />
        )}
      </div>
    </div>
  ) : null;
}

export default memo(ParticipantsGrid, deepEqual);
