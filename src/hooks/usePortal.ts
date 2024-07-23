import { exhaustiveSwitchGuard, noop } from '@Utils';
import { useEffect, useLayoutEffect, useMemo, useReducer } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  className?: string;
}

type PortalAction =
  | { type: 'CREATE'; id: string; prepend?: boolean; parentEl?: HTMLElement }
  | { type: 'REMOVE' };

function create({
  id,
  prepend = false,
  parentEl
}: {
  id: string;
  prepend?: boolean;
  parentEl?: HTMLElement;
}) {
  if (!parentEl) {
    return { render: () => null, remove: noop };
  }

  let container = document.getElementById(id);
  const containerParentEl = container?.parentElement;

  if (container && containerParentEl !== parentEl) {
    container.remove();
    container = null;
  }

  if (!container) {
    container = document.createElement('div') as HTMLDivElement;
    container.setAttribute('id', id);

    if (prepend) {
      parentEl.prepend(container);
    } else {
      parentEl.appendChild(container);
    }
  }

  function Portal({ children, className }: PortalProps) {
    if (container && className) {
      container.className = className;
    }

    return createPortal(children, container as HTMLDivElement);
  }

  function remove() {
    (container as HTMLDivElement).remove();
  }

  return { render: Portal, remove, container };
}

function reducer(portal: ReturnType<typeof create>, action: PortalAction) {
  portal?.remove();

  switch (action.type) {
    case 'CREATE': {
      const { id, prepend, parentEl } = action;

      return create({ id, prepend, parentEl });
    }

    case 'REMOVE': {
      return { render: () => null, remove: noop };
    }

    default: {
      return exhaustiveSwitchGuard(action);
    }
  }
}

function usePortal({
  id,
  isOpen,
  prepend = false,
  parentEl = document.body
}: {
  id: string;
  isOpen: boolean;
  prepend?: boolean;
  parentEl?: HTMLElement;
}) {
  const createOptions = useMemo(
    () => ({ id, prepend, parentEl }),
    [id, parentEl, prepend]
  );

  const [portal, dispatch] = useReducer(
    reducer,
    isOpen ? createOptions : { id },
    create
  );
  const isRendered = parentEl.contains(portal.container || null);

  useLayoutEffect(() => {
    if (isOpen) {
      dispatch({ type: 'CREATE', ...createOptions });
    } else {
      dispatch({ type: 'REMOVE' });
    }
  }, [isOpen, createOptions]);

  useEffect(() => portal.remove, [portal.remove]);

  return [portal.render, isRendered] as const;
}

export default usePortal;
