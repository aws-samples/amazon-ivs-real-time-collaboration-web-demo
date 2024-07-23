import { useContextHook, useLocalStorage } from '@Hooks';
import { JoinResponse, ParticipantGroup } from '@Shared/types';
import { createContext, useMemo } from 'react';
import { useAsyncValue } from 'react-router-dom';

import {
  StageManagerContext,
  StageManagerProviderProps,
  StageOptions
} from './types';
import useStage from './useStage';

const Context = createContext<StageManagerContext | null>(null);
Context.displayName = 'StageManager';

function useStageManager() {
  return useContextHook(Context);
}

function StageManagerProvider({ children }: StageManagerProviderProps) {
  const { stageConfigs } = useAsyncValue() as JoinResponse;
  const [audioOnly] = useLocalStorage('audioOnly');
  const [simulcast] = useLocalStorage('simulcast');
  const userOptions: StageOptions = { audioOnly, simulcast };

  const userStage = useStage(stageConfigs[ParticipantGroup.USER], userOptions);
  const displayStage = useStage(stageConfigs[ParticipantGroup.DISPLAY]);

  const value = useMemo<StageManagerContext>(
    () => ({
      [ParticipantGroup.USER]: userStage,
      [ParticipantGroup.DISPLAY]: displayStage
    }),
    [displayStage, userStage]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export { StageManagerProvider, useStageManager };
