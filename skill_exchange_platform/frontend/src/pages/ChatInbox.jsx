import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../api';
import { useAuth } from '../AuthContext';
import Chat from './Chat';
import { ChevronLeft } from 'lucide-react';

export default function ChatInbox() {
  const { user } = useAuth();
  const { sessionId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [peerProfiles, setPeerProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);

  // Sync selectedSessionId with URL params
  useEffect(() => {
    if (sessionId) {
      setSelectedSessionId(sessionId);
      setIsMobileListOpen(false); // Hide list on mobile when chat is selected
    }
  }, [sessionId]);

  useEffect(() => {
    if (user) fetchSessions();
    else setLoading(false);
  }, [user]);

  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/sessions/me');
      const uniqueSessions = res.data.filter(
        (session, index, self) =>
          index === self.findIndex((s) => s.id === session.id)
      );
      setSessions(
        uniqueSessions.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      );

      const peerIds = [
        ...new Set(
          uniqueSessions
            .map((session) => (session.user_a_id === user?.uid ? session.user_b_id : session.user_a_id))
            .filter(Boolean)
        ),
      ];

      if (peerIds.length > 0) {
        const profileResults = await Promise.all(
          peerIds.map(async (peerId) => {
            try {
              const profileRes = await axios.get(`/profiles/${peerId}`);
              return [peerId, profileRes.data];
            } catch {
              return [peerId, null];
            }
          })
        );
        setPeerProfiles(Object.fromEntries(profileResults));
      } else {
        setPeerProfiles({});
      }
    } catch (err) {
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex p-8 h-[calc(100vh-65px)] bg-white overflow-hidden">
      {/* Left Panel: Chat List - Hidden on mobile when chat is open */}
      <div
        className={`${
          isMobileListOpen ? 'flex' : 'hidden'
        } md:flex flex-col w-full md:w-80 lg:w-96 bg-white border-r border-gray-200`}
      >
        {/* Sticky Header */}
        <div className="shrink-0 border-b border-gray-200 bg-white p-4 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
        </div>

        {/* Scrollable Chat List */}
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <svg className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-500 font-medium">No conversations yet</p>
              <p className="text-sm text-gray-400 mt-1">Start a new skill exchange to begin chatting</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {sessions.map((session) => {
                const peerId = session.user_a_id === user?.uid ? session.user_b_id : session.user_a_id;
                const peer = peerProfiles[peerId];

                // Skill context: Display skill exchange info
                const skillContext = session.skill_a && session.skill_b
                  ? `${session.skill_a} ↔ ${session.skill_b}`
                  : 'Skill Exchange';

                return (
                  <li
                    key={session.id}
                    className={`transition-all duration-150 cursor-pointer ${
                      selectedSessionId === session.id
                        ? 'bg-indigo-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedSessionId(session.id);
                      setIsMobileListOpen(false); // Hide list on mobile after selection
                    }}
                  >
                    <div className={`px-4 py-3 border-l-4 ${
                      selectedSessionId === session.id
                        ? 'border-indigo-600'
                        : 'border-transparent'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center font-semibold text-white text-sm ${
                          selectedSessionId === session.id
                            ? 'bg-indigo-600'
                            : 'bg-indigo-500'
                        }`}>
                          {peer?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {peer?.name || `User ${peerId}`}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{skillContext}</p>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Right Panel: Chat Window - Full screen on mobile, flexible on desktop */}
      <div
        className={`${
          isMobileListOpen ? 'hidden' : 'flex'
        } md:flex flex-col flex-1 bg-white overflow-hidden`}
      >
        {/* Mobile Back Button + Header */}
        {selectedSessionId && (
          <div className="md:hidden shrink-0 border-b border-gray-200 bg-white p-4 flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedSessionId(null);
                setIsMobileListOpen(true);
              }}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Back to conversations"
            >
              <ChevronLeft size={24} />
            </button>
            <h3 className="font-semibold text-gray-900">Chat</h3>
          </div>
        )}

        {/* Chat Content */}
        {selectedSessionId ? (
          <div className="flex-1 overflow-hidden">
            <Chat sessionId={selectedSessionId} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6">
            <svg className="h-20 w-20 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg font-medium text-gray-500">Select a conversation</p>
            <p className="text-sm text-gray-400 mt-2">Choose a chat from the list to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}