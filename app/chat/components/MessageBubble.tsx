interface MessageBubbleProps {
  message: string;
  isOwn: boolean;
  timestamp: string;
  author?: string;
}

export default function MessageBubble({ message, isOwn, timestamp, author }: MessageBubbleProps) {
  return (
    <div className={`chat ${isOwn ? 'chat-end' : 'chat-start'}`}>
      {author && <div className="chat-header">{author}</div>}
      <div className="chat-bubble">{message}</div>
      <div className="chat-footer opacity-50">
        <time className="text-xs">{timestamp}</time>
      </div>
    </div>
  );
}