import { Anchor, Avatar } from '@Components';
import { getMeetingMessage } from '@Content';
import { clsm, formatMarkdownLinks } from '@Utils';
import { ChatMessage } from 'amazon-ivs-chat-messaging';
import { forwardRef, useMemo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';

interface MessageProps {
  message: ChatMessage;
}

const markdownComponents: Components = {
  a: ({ children, ...props }: JSX.IntrinsicElements['a']) => (
    <Anchor {...props} target="_blank" className="text-orange-400">
      {children}
    </Anchor>
  ),
  p: ({ children, ...props }: JSX.IntrinsicElements['p']) => (
    <p {...props} className="inline">
      {children}
    </p>
  )
};

function Message(
  { message }: MessageProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {
    content,
    sender: { attributes = {} }
  } = message;
  const { name = getMeetingMessage('unknownChatUser'), picture = '' } =
    attributes;

  const formattedContent = useMemo(
    () => formatMarkdownLinks(content),
    [content]
  );

  return (
    <div
      ref={ref}
      className={clsm([
        'inline-flex',
        'flex-row',
        'pl-3',
        'py-3',
        'max-w-full',
        'rounded-3xl',
        'origin-top-left',
        'transition-all',
        'duration-75',
        'drop-shadow-sm',
        'bg-gray-100',
        'dark:bg-zinc-700/50'
      ])}
    >
      <Avatar src={picture} name={name} className="h-6" />
      <div
        className={clsm([
          'h-full',
          'pl-2',
          'pr-3',
          'text-sm',
          'text-left',
          'leading-6',
          'font-normal',
          'overflow-hidden',
          'whitespace-pre-wrap'
        ])}
      >
        <span className={clsm(['break-normal', 'font-bold', 'select-none'])}>
          {`${name} `}
        </span>
        <ReactMarkdown
          className={clsm(['break-words', 'inline'])}
          components={markdownComponents}
        >
          {formattedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default forwardRef(Message);
