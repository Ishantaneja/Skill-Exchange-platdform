import React, { useEffect, useState } from 'react';
import axios from '../api';
import { useAuth } from '../AuthContext';
import { formatReputation } from '../utils/formatReputation';
import PageContainer from '../components/ui/PageContainer';

export default function Requests() {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('incoming');
  const [userProfiles, setUserProfiles] = useState({});

  useEffect(() => {
    if (user) fetchRequests();
    else setLoading(false);
  }, [user]);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('[REQUESTS] Fetching requests...');
      const [inRes, outRes] = await Promise.all([
        axios.get('/requests/incoming'),
        axios.get('/requests/outgoing'),
      ]);
      console.log('[REQUESTS] Fetched:', inRes.data.length, 'incoming,', outRes.data.length, 'outgoing');
      setIncoming(inRes.data);
      setOutgoing(outRes.data);
      
      // Fetch user profiles for all involved users
      const allUserIds = new Set();
      inRes.data.forEach(req => allUserIds.add(req.from_user_id));
      outRes.data.forEach(req => allUserIds.add(req.to_user_id));
      
      const profiles = {};
      await Promise.all(
        Array.from(allUserIds).map(async (uid) => {
          try {
            const res = await axios.get(`/profiles/${uid}`);
            profiles[uid] = res.data;
          } catch (err) {
            console.error(`[REQUESTS] Failed to fetch profile for ${uid}`);
          }
        })
      );
      setUserProfiles(profiles);
    } catch (err) {
      console.error('[REQUESTS] Fetch error:', {
        status: err.response?.status,
        message: err.response?.data?.detail || err.message
      });
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      console.log('[REQUESTS] Accepting request:', requestId);
      const res = await axios.post(`/requests/${requestId}/accept`);
      console.log('[REQUESTS] Request accepted');
      // after acceptance a session is created server-side; redirect to sessions
      window.location.href = '/sessions';
      // fetchRequests();
    } catch (err) {
      console.error('[REQUESTS] Accept error:', {
        status: err.response?.status,
        message: err.response?.data?.detail || err.message
      });
      const msg = err.response?.data?.detail || 'Failed to accept request';
      setError(msg);
      alert(msg);
    }
  };

  const handleReject = async (requestId) => {
    try {
      console.log('[REQUESTS] Rejecting request:', requestId);
      await axios.post(`/requests/${requestId}/reject`);
      console.log('[REQUESTS] Request rejected');
      await fetchRequests();
    } catch (err) {
      console.error('[REQUESTS] Reject error:', {
        status: err.response?.status,
        message: err.response?.data?.detail || err.message
      });
      const msg = err.response?.data?.detail || 'Failed to reject request';
      setError(msg);
      alert(msg);
    }
  };

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Requests</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage incoming and outgoing skill exchange requests</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      {!user ? (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-6 py-5 rounded-xl text-center">
          <p className="mb-3 text-sm">View and manage your skill exchange requests</p>
          <a
            href="/login"
            className="inline-block px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors duration-200"
          >
            Log In to Continue
          </a>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="border-b border-gray-100">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('incoming')}
                  className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors duration-200 ${
                    activeTab === 'incoming'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Incoming ({incoming.length})
                </button>
                <button
                  onClick={() => setActiveTab('outgoing')}
                  className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors duration-200 ${
                    activeTab === 'outgoing'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Outgoing ({outgoing.length})
                </button>
              </nav>
            </div>

            <div className="p-5">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading requests...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'incoming' && (
                    <>
                      {incoming.length > 0 ? (
                        <div className="space-y-3">
                          {incoming.map(req => {
                            const fromProfile = userProfiles[req.from_user_id];
                            return (
                              <div
                                key={req.id}
                                className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-indigo-200 transition-colors duration-200"
                              >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-xs font-medium text-gray-400">From:</span>
                                      <span className="text-sm font-semibold text-gray-900">
                                        {fromProfile ? fromProfile.name : 'Loading...'}
                                      </span>
                                      {fromProfile && (
                                        <span className="text-xs text-gray-500">
                                          {formatReputation(fromProfile.reputation, fromProfile.total_ratings)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                      <div>
                                        <span className="text-gray-500">Offers:</span>
                                        <span className="ml-1.5 font-medium text-emerald-700">{req.skill_offered}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Wants:</span>
                                        <span className="ml-1.5 font-medium text-indigo-700">{req.skill_requested}</span>
                                      </div>
                                    </div>
                                    <div className="mt-2">
                                      <span
                                        className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${
                                          req.status === 'pending'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : req.status === 'accepted'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}
                                      >
                                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                      </span>
                                    </div>
                                  </div>
                                  {req.status === 'pending' && (
                                    <div className="flex gap-2 shrink-0">
                                      <button
                                        onClick={() => handleAccept(req.id)}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg font-medium transition-colors duration-200"
                                      >
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => handleReject(req.id)}
                                        className="px-4 py-2 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 text-sm rounded-lg font-medium transition-colors duration-200"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-300 rounded-xl p-10 text-center">
                          <div className="text-3xl mb-2">📥</div>
                          <p className="text-gray-600 font-medium text-sm">No incoming requests</p>
                          <p className="text-gray-400 text-xs mt-1">
                            When others request your skills, they will appear here
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'outgoing' && (
                    <>
                      {outgoing.length > 0 ? (
                        <div className="space-y-3">
                          {outgoing.map(req => {
                            const toProfile = userProfiles[req.to_user_id];
                            return (
                              <div
                                key={req.id}
                                className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-medium text-gray-400">To:</span>
                                  <span className="text-sm font-semibold text-gray-900">
                                    {toProfile ? toProfile.name : 'Loading...'}
                                  </span>
                                  {toProfile && (
                                    <span className="text-xs text-gray-500">
                                      {formatReputation(toProfile.reputation, toProfile.total_ratings)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-2">
                                  <div>
                                    <span className="text-gray-500">You offered:</span>
                                    <span className="ml-1.5 font-medium text-emerald-700">{req.skill_offered}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">You requested:</span>
                                    <span className="ml-1.5 font-medium text-indigo-700">{req.skill_requested}</span>
                                  </div>
                                </div>
                                <div>
                                  <span
                                    className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${
                                      req.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : req.status === 'accepted'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-300 rounded-xl p-10 text-center">
                          <div className="text-3xl mb-2">📤</div>
                          <p className="text-gray-600 font-medium text-sm">No outgoing requests</p>
                          <p className="text-gray-400 text-xs mt-1">
                            Browse skills and request exchanges to get started
                          </p>
                          <a
                            href="/"
                            className="inline-block mt-3 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors duration-200"
                          >
                            Browse Skills
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
}
