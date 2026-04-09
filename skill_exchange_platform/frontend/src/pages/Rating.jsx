import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../api';
import { useAuth } from '../AuthContext';
import { formatReputation } from '../utils/formatReputation';
import PageContainer from '../components/ui/PageContainer';

export default function Rating() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState(null);
  const [peerProfile, setPeerProfile] = useState(null);
  const [score, setScore] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!sessionId || !user) return;

    const fetchSessionData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch session details
        const sessionRes = await axios.get(`/sessions/me`);
        const foundSession = sessionRes.data.find(s => s.id === sessionId);
        
        if (!foundSession) {
          setError('Session not found');
          setLoading(false);
          return;
        }

        if (foundSession.status !== 'completed') {
          setError('Session must be completed before rating');
          setLoading(false);
          return;
        }

        setSession(foundSession);

        // Determine peer
        const peerId = foundSession.user_a_id === user.uid 
          ? foundSession.user_b_id 
          : foundSession.user_a_id;

        // Fetch peer profile
        const profileRes = await axios.get(`/profiles/${peerId}`);
        setPeerProfile(profileRes.data);
      } catch (err) {
        console.error('[RATING] Fetch error:', err);
        setError('Failed to load session details');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session || !peerProfile) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('/ratings', {
        session_id: sessionId,
        ratee_id: peerProfile.id,
        score: parseInt(score),
        feedback: feedback.trim() || undefined,
      });

      setSuccess('Rating submitted successfully!');
      
      // Navigate back to sessions after 2 seconds
      setTimeout(() => {
        navigate('/sessions');
      }, 2000);
    } catch (err) {
      console.error('[RATING] Submission error:', err);
      const detail = err.response?.data?.detail;
      if (detail === 'Already rated') {
        setError('You have already rated this session');
        alert('You have already rated this session');
      } else {
        const msg = detail || 'Failed to submit rating';
        setError(msg);
        alert(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!sessionId) {
    return (
      <PageContainer>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl">
          <p>Please select a completed session from the <Link to="/sessions" className="underline font-medium">Sessions</Link> page to rate your partner.</p>
        </div>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading session details...</p>
        </div>
      </PageContainer>
    );
  }

  if (error && !session) {
    return (
      <PageContainer>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
        <Link to="/sessions">
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
            Back to Sessions
          </button>
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Link to="/sessions" className="text-indigo-600 hover:text-indigo-700 text-xs font-medium transition-colors">
          ← Back to Sessions
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Rate Your Partner</h1>
        <p className="text-gray-500 mt-1 text-sm">Share your experience with your skill exchange partner</p>
      </div>

      {session && peerProfile && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Session Details</h2>
          <div className="space-y-1.5">
            <p className="text-sm text-gray-700">
              <span className="text-gray-500">Skills:</span>{' '}
              <span className="font-medium text-indigo-600">{session.skill_a}</span>
              <span className="text-gray-400 mx-1.5">↔</span>
              <span className="font-medium text-emerald-600">{session.skill_b}</span>
            </p>
            <p className="text-sm text-gray-700">
              <span className="text-gray-500">Partner:</span>{' '}
              <span className="font-medium">{peerProfile.name}</span>
            </p>
            <p className="text-xs text-gray-500">
              {formatReputation(peerProfile.reputation, peerProfile.total_ratings)}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {success}
          <p className="text-xs mt-1 text-green-600">Redirecting to sessions...</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating
          </label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setScore(star)}
                className={`text-2xl transition-colors duration-200 ${
                  star <= score ? 'text-amber-400' : 'text-gray-200'
                } hover:text-amber-400`}
              >
                ★
              </button>
            ))}
            <span className="ml-2 text-sm font-medium text-gray-600">{score}/5</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Feedback (Optional)
          </label>
          <textarea
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder:text-gray-400"
            placeholder="Share your experience with this skill exchange..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows="4"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || success}
          className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {submitting ? 'Submitting...' : success ? 'Rating Submitted!' : 'Submit Rating'}
        </button>
      </form>
    </PageContainer>
  );
}
