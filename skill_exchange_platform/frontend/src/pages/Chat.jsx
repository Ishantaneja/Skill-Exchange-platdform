import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../api';
import { useAuth } from '../AuthContext';
import PageContainer from '../components/ui/PageContainer';

export default function Chat({ sessionId: propSessionId }) {
  const { sessionId: urlSessionId } = useParams();
  const sessionId = propSessionId || urlSessionId; // Use prop first, fallback to URL
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [session, setSession] = useState(null);
  const [peerProfile, setPeerProfile] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const fetchedRef = useRef(false);

  // ── load session details and history on mount ──
  useEffect(() => {
    if (!sessionId || !user || !token) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch session details
        const sessionRes = await axios.get(`/sessions/me`);
        const foundSession = sessionRes.data.find(s => s.id === sessionId);
        
        if (foundSession) {
          setSession(foundSession);
          
          // Fetch peer profile
          const peerId = foundSession.user_a_id === user.uid 
            ? foundSession.user_b_id 
            : foundSession.user_a_id;
          
          try {
            const profileRes = await axios.get(`/profiles/${peerId}`);
            setPeerProfile(profileRes.data);
          } catch (err) {
            console.error('[CHAT] Failed to load peer profile:', err);
          }
        }

        // Load messages
        const messagesRes = await axios.get(`/sessions/${sessionId}/messages`);
        setMessages(messagesRes.data);
      } catch (err) {
        console.error('[CHAT] Load error:', err.response?.data || err.message);
        const detail = err.response?.data?.detail;
        const msg = Array.isArray(detail)
          ? detail.map(d => d.msg || JSON.stringify(d)).join('; ')
          : detail || 'Failed to load chat';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    return () => { fetchedRef.current = false; };
  }, [sessionId, user, token]);

  // auto-scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── poll for new messages every 3 seconds ──
  useEffect(() => {
    if (!sessionId || !user || !token) return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/sessions/${sessionId}/messages`);
        setMessages(res.data);
      } catch (err) {
        console.error('[CHAT] Poll error:', err.message);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId, user, token]);

  // ── send message via REST ──
  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const msgText = text.trim();
    setText('');
    setSending(true);
    setError('');

    try {
      const res = await axios.post(`/sessions/${sessionId}/messages`, {
        message_text: msgText,
      });
      setMessages(prev => [...prev, res.data]);
    } catch (err) {
      console.error('[CHAT] Send error:', err.response?.data || err.message);
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map(d => d.msg || JSON.stringify(d)).join('; ')
        : detail || 'Failed to send message';
      setError(msg);
      alert(msg);
      setText(msgText);
    } finally {
      setSending(false);
    }
  };

  const myUid = user?.uid;

  // ── render ──
  if (!sessionId) {
    return (
      <PageContainer>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl">
          Please select a session from the <Link to="/sessions" className="underline font-medium">Sessions</Link> page to start chatting.
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl">
          Please <Link to="/login" className="underline font-medium">log in</Link> to join this chat.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 10rem)' }}>
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-4 shrink-0">
          <Link to="/sessions" className="text-indigo-200 hover:text-white text-xs font-medium transition-colors">
            ← Back to Sessions
          </Link>
          <div className="flex items-center justify-between mt-1.5">
            <div>
              <h1 className="text-lg font-semibold">
                {peerProfile ? `Chat with ${peerProfile.name}` : 'Chat'}
              </h1>
              {session && (
                <p className="text-xs text-indigo-200 mt-0.5">
                  {session.skill_a} ↔ {session.skill_b}
                </p>
              )}
            </div>
            {session && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                session.status === 'active' 
                  ? 'bg-emerald-500/20 text-emerald-100' 
                  : 'bg-white/20 text-white'
              }`}>
                {session.status === 'active' ? 'Active' : 'Completed'}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-b border-red-200 text-red-700 px-5 py-2 text-sm shrink-0">
            {error}
          </div>
        )}

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-sm text-gray-500">Loading messages...</p>
              </div>
            </div>
          ) : messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((m, idx) => {
                const isOwn = m.sender_uid === myUid;
                return (
                  <div
                    key={m.id || idx}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] lg:max-w-md px-4 py-2.5 rounded-2xl ${
                        isOwn
                          ? 'bg-indigo-600 text-white rounded-br-md'
                          : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                      }`}
                    >
                      <div className={`text-[10px] mb-0.5 ${isOwn ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {isOwn ? 'You' : peerProfile?.name || 'Partner'}
                        {m.timestamp && (
                          <span className="ml-1.5">
                            {new Date(m.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        )}
                      </div>
                      <div className="text-sm leading-relaxed">{m.message_text}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">💬</div>
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs mt-0.5">Start the conversation!</p>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-3 bg-white shrink-0">
          <div className="flex gap-2">
            <input
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder:text-gray-400"
              placeholder="Type your message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
