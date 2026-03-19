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
import { format, isToday, isYesterday } from 'date-fns';

function formatMsgTime(date) {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

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
  const prevMessageCount = useRef(0);
  const isInitialLoad = useRef(true);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesAPI.conversations().then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: convData } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => messagesAPI.getConversation(conversationId).then((r) => r.data),
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (convData?.messages) {
      isInitialLoad.current = true;
      prevMessageCount.current = 0;
      setMessages(convData.messages);
    }
  }, [convData]);

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

  useEffect(() => {
    if (isInitialLoad.current) { isInitialLoad.current = false; return; }
    if (messages.length > prevMessageCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCount.current = messages.length;
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
    typingTimeout.current = setTimeout(() => socket?.emit('typing_stop', { conversationId }), 1500);
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, 'message');
      socket?.emit('send_message', { conversationId, fileUrl: url, fileName: file.name, fileType: file.type });
    } catch { /* handled in uploadToCloudinary */ }
    finally { setUploading(false); }
  };

  const conv = convData?.conversation;
  const otherUser = conv ? (conv.buyer?.id === user?.id ? conv.seller : conv.buyer) : null;

  return (
    /* Fills the flex-1 main column; minHeight:0 lets children shrink for overflow-y-auto to work */
    <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
      <div className="flex flex-1 w-full overflow-hidden md:gap-4 md:p-4 md:max-w-6xl md:mx-auto">

        {/* ── Conversation list ── */}
        <aside className={`flex flex-col bg-white overflow-hidden
          md:w-72 md:shrink-0 md:rounded-2xl md:border md:border-gray-100 md:shadow-sm
          ${conversationId ? 'hidden md:flex' : 'flex flex-1'}`}>

          {/* List header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 shrink-0">
            <BackButton />
            <h2 className="font-bold text-gray-900 text-base">{t('chat.messages')}</h2>
          </div>

          {/* List body */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 p-8">
                <span className="text-4xl">💬</span>
                <p className="text-sm text-center">{t('chat.noConversations')}</p>
              </div>
            ) : conversations.map((c) => (
              <Link
                key={c.id}
                to={`/messages/${c.id}`}
                className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 transition-colors
                  ${conversationId === c.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
              >
                <Avatar src={c.other?.avatar} name={c.other?.name || '?'} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{c.other?.name}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{c.lastMessage || t('chat.noMessages')}</p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-semibold">
                    {c.unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </aside>

        {/* ── Message thread ── */}
        <div className={`flex flex-col flex-1 bg-white overflow-hidden
          md:rounded-2xl md:border md:border-gray-100 md:shadow-sm
          ${conversationId ? 'flex' : 'hidden md:flex'}`}>

          {conversationId && conv ? (
            <>
              {/* Thread header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 shrink-0 bg-white">
                <Link to="/messages" className="md:hidden p-1.5 -ml-1 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <Avatar src={otherUser?.avatar} name={otherUser?.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{otherUser?.name}</p>
                  {conv.service && (
                    <p className="text-xs text-gray-400 truncate">{t('chat.re')} {conv.service.title}</p>
                  )}
                </div>
              </div>

              {/* Messages — scrollable */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <Avatar src={msg.sender?.avatar} name={msg.sender?.name} size="sm" />
                      <div className={`flex flex-col gap-1 max-w-[72%] ${isMe ? 'items-end' : 'items-start'}`}>
                        {msg.content && (
                          <div className={`px-4 py-2.5 text-sm leading-relaxed break-words
                            ${isMe
                              ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm'
                              : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm'
                            }`}>
                            {msg.content}
                          </div>
                        )}
                        {msg.fileUrl && (
                          <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl hover:bg-indigo-100 transition-colors">
                            📎 {msg.fileName || t('chat.viewFile')}
                          </a>
                        )}
                        <span className="text-[11px] text-gray-400 px-1">{formatMsgTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
                {typingUser && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 italic">
                    <span className="flex gap-0.5">
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    {typingUser} {t('chat.typing', { name: '' }).trim()}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input bar — pinned at bottom */}
              <div className="px-3 py-3 border-t border-gray-100 flex items-center gap-2 shrink-0 bg-white">
                <label className={`cursor-pointer p-2 rounded-xl transition-colors ${uploading ? 'opacity-40' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <input type="file" className="hidden" onChange={handleFile} disabled={uploading} />
                </label>
                <input
                  value={message}
                  onChange={handleTyping}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={t('chat.inputPlaceholder')}
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                  disabled={uploading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || uploading}
                  className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-indigo-700 transition-colors"
                >
                  <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
              <div className="text-5xl mb-3">💬</div>
              <p className="font-semibold text-gray-600">{t('chat.selectConversation')}</p>
              <p className="text-sm mt-1 text-center">{t('chat.selectHint')}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
