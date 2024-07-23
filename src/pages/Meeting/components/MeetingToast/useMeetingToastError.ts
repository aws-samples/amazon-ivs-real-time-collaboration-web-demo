import { ContentKey, getErrorMessage } from '@Content';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

type ErrorContentKey = ContentKey<typeof getErrorMessage>;

function useMeetingToastError({
  key,
  error,
  duration,
  substitutions
}: {
  key: string;
  error?: string;
  duration?: number;
  substitutions?: Record<string, string>;
}) {
  const substitutionsRef = useRef(substitutions);
  substitutionsRef.current = substitutions;

  useEffect(() => {
    if (!error) {
      return;
    }

    let errorKey = `${key}/${error}` as ErrorContentKey;
    let errorMsg = getErrorMessage(errorKey, substitutionsRef.current);

    if (!errorMsg) {
      errorKey = `${key}/fallback` as ErrorContentKey;
      errorMsg = getErrorMessage(errorKey, substitutionsRef.current);
    }

    if (errorMsg) {
      toast.error(errorMsg, { id: errorKey, duration });

      return () => toast.dismiss(errorKey);
    }
  }, [duration, error, key]);
}

export default useMeetingToastError;
