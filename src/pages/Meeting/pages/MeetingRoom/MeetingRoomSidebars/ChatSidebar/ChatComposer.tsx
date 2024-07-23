import { IconRefresh, IconSend } from '@Assets/icons';
import { Button, Spinner } from '@Components';
import { getMeetingMessage } from '@Content';
import { useChat } from '@Contexts/Chat';
import { clsm } from '@Utils';
import { useRef, useState } from 'react';
import Textarea, { TextareaHeightChangeMeta } from 'react-textarea-autosize';
import { MAX_CHAT_MESSAGE_LENGTH } from 'src/constants';

const MAX_ROWS = 4;

function ChatComposer() {
  const { sendMessage, connectionState, connect } = useChat();
  const [message, setMessage] = useState('');
  const [rows, setRows] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';
  const isDisconnected = connectionState === 'disconnected';

  let placeholder = getMeetingMessage('chatSaySomething');
  if (isConnecting) {
    placeholder = getMeetingMessage('chatConnecting');
  } else if (isDisconnected) {
    placeholder = getMeetingMessage('chatDisconnected');
  }

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (message) {
      const response = await sendMessage(message);

      if (response) {
        setMessage('');
        textareaRef.current?.focus();
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const { key, shiftKey, repeat, target } = e;
    const { form } = target as HTMLTextAreaElement;

    if (key === 'Enter' && !shiftKey && !repeat) {
      e.preventDefault();
      form?.requestSubmit();
    }
  }

  function handleValueChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setMessage(e.target.value);

    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }

  function handleHeightChange(
    height: number,
    { rowHeight }: TextareaHeightChangeMeta
  ) {
    textareaRef.current?.addEventListener(
      'transitionend',
      () => setRows(Math.ceil(height / rowHeight)),
      { once: true }
    );
  }

  return (
    <form
      onSubmit={handleSend}
      className={clsm([
        'flex',
        'items-center',
        'justify-center',
        'w-full',
        'pl-4',
        'pt-4',
        'border-t-2',
        'border-gray-300',
        'dark:border-zinc-700',
        'bg-transparent'
      ])}
    >
      <Textarea
        ref={textareaRef}
        maxRows={MAX_ROWS}
        maxLength={MAX_CHAT_MESSAGE_LENGTH}
        onHeightChange={handleHeightChange}
        onChange={handleValueChange}
        onKeyDown={handleKeyDown}
        value={isConnected ? message : ''}
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={!isConnected}
        wrap="hard"
        className={clsm([
          'resize-none',
          'pr-1',
          'mr-1',
          'my-2',
          'w-full',
          'text-sm',
          'text-left',
          'leading-6',
          'font-normal',
          'appearance-none',
          'bg-transparent',
          'border-none',
          'outline-none',
          'break-words',
          'transition-all',
          'whitespace-pre-wrap',
          'placeholder:overflow-hidden',
          'placeholder:overflow-ellipsis',
          'placeholder:whitespace-nowrap',
          'placeholder:text-zinc-600',
          'dark:placeholder:text-zinc-400',
          'text-gray-900',
          'dark:text-white',
          rows >= MAX_ROWS ? 'overflow-auto' : 'overflow-hidden',
          isConnecting && ['cursor-wait', 'animate-pulse'],
          isDisconnected && 'cursor-not-allowed'
        ])}
      />
      {isConnected && (
        <Button
          isIcon
          type="submit"
          disabled={!isConnected || !message}
          variant="transparent"
          className={clsm([
            'group',
            '!ring-0',
            'disabled:cursor-auto',
            'enabled:hover:bg-gray-300/50',
            'enabled:dark:hover:bg-zinc-900/50'
          ])}
        >
          <IconSend
            className={clsm([
              'transition-all',
              'group-enabled:group-active:scale-90',
              'group-enabled:group-hover:fill-orange-400',
              'group-enabled:group-active:fill-orange-500',
              'group-enabled:group-focus-visible:fill-orange-400'
            ])}
          />
        </Button>
      )}
      {isConnecting && <Spinner />}
      {isDisconnected && (
        <Button isIcon variant="transparent" onClick={connect}>
          <IconRefresh />
        </Button>
      )}
    </form>
  );
}

export default ChatComposer;
