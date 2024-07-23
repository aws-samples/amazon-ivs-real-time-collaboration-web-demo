import { clsm } from '@Utils';
import { forwardRef } from 'react';

import Spinner from '../Spinner';
import * as theme from './theme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isIcon?: boolean;
  isLoading?: boolean;
  variant?: `${theme.ButtonVariant}`;
  darkVariant?: `${theme.ButtonVariant}`;
  lightVariant?: `${theme.ButtonVariant}`;
}

function Button(
  {
    children,
    className,
    darkVariant,
    lightVariant,
    variant = theme.ButtonVariant.PRIMARY,
    isLoading = false,
    isIcon = false,
    type = 'button',
    ...restProps
  }: ButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  return (
    <button
      ref={ref}
      type={type} // eslint-disable-line react/button-has-type
      className={clsm(
        theme.BASE_CLASSES,
        theme.DARK_VARIANT_CLASSES[darkVariant || variant],
        theme.LIGHT_VARIANT_CLASSES[lightVariant || variant],
        isIcon && theme.ICON_CLASSES,
        className
      )}
      {...restProps}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
}

export type { ButtonProps };

export default forwardRef(Button);
