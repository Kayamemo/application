// ============================================================
// Chat Page — Conversation list + Real-time message thread
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { messagesAPI, uploadToCloudinary } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import Avatar from '../components/ui/Avatar';
import BackButton from '../components/ui/BackButton';
import { format } from 'date-fns';

export default function Chat() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  // Load conversations list
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesAPI.conversations().then((r) => r.data),
    refetchInterval: 30000,
  });

  // Load selected conversation messages
  const { data: convData } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => messagesAPI.getConversation(conversationId).then((r) => r.data),
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (convData?.messages) setMessages(convData.messages);
  }, [convData]);

  // Socket.io events
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit('join_conversation', { conversationId });
    socket.emit('mark_read', { conversationId });

    socket.on('new_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      socket.emit('mark_read', { conversationId });
      queryClient.invalidateQueries(['conversations']);
    });

    socket.on('user_typing', ({ name }) => setTypingUser(name));
    socket.on('user_stopped_typing', () => setTypingUser(null));

    return () => {
      socket.emit('leave_conversation', { conversationId });
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
    };
  }, [socket, conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !socket) return;
    socket.emit('send_message', { conversationId, content: message });
    setMessage('');
    socket.emit('typing_stop', { conversationId });
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket?.emit('typing_start', { conversationId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket?.emit('typing_stop', { conversationId });
    }, 1500);
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, 'message');
      socket?.emit('send_message', {
        conversationId,
        fileUrl: url,
        fileName: file.name,
        fileType: file.type,
      });
    } catch {
      // toast handled in uploadToCloudinary
    } finally {
      setUploading(false);
    }
  };

  const conv = convData?.conversation;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 h-[calc(100vh-5rem)]">
      <div className="flex h-full gap-4">
        {/* Conversation list */}
        <aside className="w-72 flex-shrink-0 card flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center gap-2">
            <BackButton />
            <h2 className="font-bold text-gray-900">{t('chat.messages')}</h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {conversations.length === 0 && (
              <p className="p-4 text-sm text-gray-400">{t('chat.noConversations')}</p>
            )}
            {conversations.map((c) => (
              <Link
                key={c.id}
                to={`/messages/${c.id}`}
                className={`flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${conversationId === c.id ? 'bg-primary-50' : ''}`}
              >
                <Avatar src={c.other?.avatar} name={c.other?.name || '?'} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{c.other?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{c.lastMessage || t('chat.noMessages')}</p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {c.unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </aside>

        {/* Message thread */}
        <div className="flex-1 card flex flex-col overflow-hidden">
          {conversationId && conv ? (
            <>
              {/* Header */}
              <div className="p-3 border-b border-gray-100 flex items-center gap-3">
                <Avatar src={conv.buyer?.id === user?.id ? conv.seller?.avatar : conv.buyer?.avatar}
                        name={conv.buyer?.id === user?.id ? conv.seller?.name : conv.buyer?.name} size="sm" />
                <div>
                  <p className="font-semibold text-sm">
                    {conv.buyer?.id === user?.id ? conv.seller?.name : conv.buyer?.name}
                  </p>
                  {conv.service && <p className="text-xs text-gray-400">{t('chat.re')} {conv.service.title}</p>}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <Avatar src={msg.sender?.avatar} name={msg.sender?.name} size="sm" />
                      <div className={`max-w-sm ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        {msg.content && (
                          <div className={`rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                            {msg.content}
                          </div>
                        )}
                        {msg.fileUrl && (
                          <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer"
                             className="flex items-center gap-1.5 text-xs text-primary-600 bg-primary-50 px-3 py-2 rounded-xl hover:bg-primary-100">
                            📎 {msg.fileName || t('chat.viewFile')}
                          </a>
                        )}
                        <span className="text-xs text-gray-400">
                          {format(new Date(msg.createdAt), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {typingUser && (
                  <div className="text-xs text-gray-400 italic">{t('chat.typing', { name: typingUser })}</div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-100 flex items-center gap-2">
                <label className="cursor-pointer text-gray-400 hover:text-primary-600 p-1">
                  📎
                  <input type="file" className="hidden" onChange={handleFile} disabled={uploading} />
                </label>
                <input
                  value={message}
                  onChange={handleTyping}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={t('chat.inputPlaceholder')}
                  className="input flex-1 rounded-full py-2 text-sm"
                  disabled={uploading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || uploading}
                  className="btn-primary rounded-full p-2 w-9 h-9 flex items-center justify-center disabled:opacity-40"
                >
                  ➤
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <div className="text-5xl mb-3">💬</div>
              <p className="font-medium">{t('chat.selectConversation')}</p>
              <p className="text-sm">{t('chat.selectHint')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
