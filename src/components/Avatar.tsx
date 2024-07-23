import { clsm } from '@Utils';
import BoringAvatar from 'boring-avatars';
import { useState } from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  className?: string;
  style?: React.CSSProperties;
}

function Avatar({ src = '', name, style, className }: AvatarProps) {
  const [isLoading, setIsLoading] = useState(true);

  return src || !name ? (
    <img
      id={name}
      src={src}
      style={style}
      className={clsm([
        'relative',
        'rounded-full',
        'object-cover',
        'shrink-0',
        'h-full',
        'max-h-full',
        'max-w-full',
        'select-none',
        'aspect-square',
        'bg-zinc-400',
        'dark:bg-zinc-800',
        'before:absolute',
        'before:top-0',
        'before:left-0',
        'before:w-full',
        'before:h-full',
        'before:scale-125',
        'before:bg-alt-avtr',
        'before:bg-cover',
        'before:bg-no-repeat',
        isLoading && 'animate-pulse',
        className
      ])}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      draggable={false}
      onLoad={() => setIsLoading(false)}
      onError={() => setIsLoading(false)}
      alt="" // Decorative images must have an empty string alt value: https://html.spec.whatwg.org/multipage/images.html#a-purely-decorative-image-that-doesn't-add-any-information
    />
  ) : (
    <div
      style={style}
      className={clsm([
        'relative',
        'rounded-full',
        'shrink-0',
        'h-full',
        'max-h-full',
        'aspect-square',
        className
      ])}
    >
      <BoringAvatar name={name} size="100%" variant="beam" />
    </div>
  );
}

export default Avatar;
