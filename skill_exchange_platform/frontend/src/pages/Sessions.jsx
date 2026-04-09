import React, { useEffect, useState } from 'react';
import axios from '../api';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { formatReputation } from '../utils/formatReputation';
import PageContainer from '../components/ui/PageContainer';

export default function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [peerProfiles, setPeerProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) fetchSessions();
    else setLoading(false);
  }, [user]);

  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('[SESSIONS] Fetching sessions...');
      const res = await axios.get('/sessions/me');
      console.log('[SESSIONS] Fetched:', res.data.length, 'sessions');
      setSessions(res.data);

      const peerIds = [
        ...new Set(
          res.data
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
      console.error('[SESSIONS] Fetch error:', {
        status: err.response?.status,
        message: err.response?.data?.detail || err.message
      });
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (sessionId) => {
    try {
      console.log('[SESSIONS] Completing session:', sessionId);
      await axios.post(`/sessions/${sessionId}/complete`);
      console.log('[SESSIONS] Session completed');
      await fetchSessions();
    } catch (err) {
      console.error('[SESSIONS] Complete error:', {
        status: err.response?.status,
        message: err.response?.data?.detail || err.message
      });
      const msg = err.response?.data?.detail || 'Failed to complete session';
      setError(msg);
      alert(msg);
    }
  };

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sessions</h1>
        <p className="text-gray-500 mt-1 text-sm">Track active and completed skill exchanges</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      {!user && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm">
          Please <Link to="/login" className="underline font-medium">log in</Link> to view your sessions.
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading sessions...</p>
        </div>
      ) : user ? (
        sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map(s => {
              const peerId = s.user_a_id === user?.uid ? s.user_b_id : s.user_a_id;
              const peerProfile = peerProfiles[peerId];
              const isActive = s.status === 'active';

              return (
                <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow duration-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isActive ? 'Active' : 'Completed'}
                        </span>
                      </div>

                      <p className="text-base font-semibold text-gray-900 mb-1.5">
                        <span className="text-indigo-600">{s.skill_a}</span>
                        <span className="text-gray-400 mx-1.5">↔</span>
                        <span className="text-emerald-600">{s.skill_b}</span>
                      </p>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Partner:</span>
                        <span className="text-sm font-medium text-gray-800">{peerProfile?.name || 'Loading...'}</span>
                        {peerProfile && (
                          <span className="text-xs text-gray-400">
                            {formatReputation(peerProfile.reputation, peerProfile.total_ratings)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Link to={`/chat/${s.id}`}>
                        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors duration-200">
                          Open Chat
                        </button>
                      </Link>
                      {isActive && (
                        <button
                          onClick={() => handleComplete(s.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg font-medium transition-colors duration-200"
                        >
                          Mark Complete
                        </button>
                      )}
                      {!isActive && (
                        <Link to={`/rating/${s.id}`}>
                          <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg font-medium transition-colors duration-200">
                            Rate Partner
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-gray-600 font-medium text-sm">No sessions yet</p>
            <p className="text-gray-400 text-xs mt-1 mb-4">Start by sending skill exchange requests</p>
            <Link to="/">
              <button className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors duration-200">
                Browse Skills
              </button>
            </Link>
          </div>
        )
      ) : null}
    </PageContainer>
  );
}
