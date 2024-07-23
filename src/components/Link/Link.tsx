import { clsm } from '@Utils';
import {
  Link as ReactRouterLink,
  LinkProps as ReactRouterLinkProps
} from 'react-router-dom';

import * as theme from './theme';

interface LinkProps extends ReactRouterLinkProps {
  openInNewTab?: boolean;
  variant?: `${theme.LinkVariant}`;
  darkVariant?: `${theme.LinkVariant}`;
  lightVariant?: `${theme.LinkVariant}`;
}

function Link({
  children,
  className,
  darkVariant,
  lightVariant,
  variant = theme.LinkVariant.PRIMARY,
  openInNewTab = false,
  ...restProps
}: LinkProps) {
  return (
    <ReactRouterLink
      className={clsm(
        theme.BASE_CLASSES,
        theme.DARK_VARIANT_CLASSES[darkVariant || variant],
        theme.LIGHT_VARIANT_CLASSES[lightVariant || variant],
        className
      )}
      {...(openInNewTab && { target: '_blank' })}
      {...restProps}
    >
      {children}
    </ReactRouterLink>
  );
}

export default Link;
