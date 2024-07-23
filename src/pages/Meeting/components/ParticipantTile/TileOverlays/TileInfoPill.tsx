import { Avatar } from '@Components';
import { clsm } from '@Utils';

interface TileInfoPillProps {
  content?: string;
  avatar?: [src: string, name: string] | JSX.Element;
  isVisible?: boolean;
  autoHideAvatar?: boolean;
}

function TileInfoPill({
  avatar,
  content,
  isVisible = true,
  autoHideAvatar = true
}: TileInfoPillProps) {
  if (!isVisible || (!content && !avatar)) {
    return <span />;
  }

  const avatarClassName = clsm([
    'shrink-0',
    { 'hidden @xs:inline-flex': autoHideAvatar }
  ]);

  function renderAvatar() {
    if (!avatar) {
      return null;
    }

    if (Array.isArray(avatar)) {
      const [src, name] = avatar;

      return <Avatar src={src} name={name} className={avatarClassName} />;
    }

    return (
      <span
        className={clsm([
          avatarClassName,
          'rounded-full',
          'overflow-hidden',
          '[&_svg]:bg-zinc-50/40',
          '[&_svg]:dark:bg-zinc-600/40',
          '[&_svg]:@xs:bg-zinc-50',
          '[&_svg]:@xs:dark:bg-zinc-600',
          '[&_svg]:fill-black',
          '[&_svg]:dark:fill-white'
        ])}
      >
        {avatar /* JSX.Element */}
      </span>
    );
  }

  return (
    <div
      className={clsm([
        'flex',
        'items-center',
        'p-1',
        'h-8',
        'max-w-fit',
        'font-medium',
        'rounded-full',
        'overflow-hidden',
        'backdrop-blur-none',
        'bg-transparent',
        'text-white',
        '@xs:backdrop-blur',
        '@xs:text-current',
        '@xs:bg-zinc-50/40',
        '@xs:dark:bg-zinc-700/40'
      ])}
    >
      {renderAvatar()}
      {content && (
        <span
          className={clsm([
            'truncate',
            'px-2',
            'text-shadow',
            '@xs:text-shadow-none'
          ])}
        >
          {content}
        </span>
      )}
    </div>
  );
}

export default TileInfoPill;
