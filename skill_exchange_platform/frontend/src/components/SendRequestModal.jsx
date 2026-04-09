import React, { useState } from 'react';

export default function SendRequestModal({ skill, onClose, onSubmit }) {
  const [offerSkill, setOfferSkill] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[MODAL] Send clicked, offerSkill =', offerSkill);

    if (!offerSkill.trim()) {
      setError('Please enter a skill you will offer.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await onSubmit(offerSkill.trim());
      console.log('[MODAL] onSubmit resolved successfully');
      setSuccess('Request sent!');
      // auto-close after a short delay so the user sees the success
      setTimeout(() => onClose(), 800);
    } catch (err) {
      console.error('[MODAL] onSubmit error:', err);
      const msg = err?.response?.data?.detail || err?.message || 'Failed to send request.';
      setError(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Request "{skill.name}"
        </h3>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg mb-3 text-sm font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Skill you will offer in exchange
            </label>
            <input
              type="text"
              value={offerSkill}
              onChange={(e) => setOfferSkill(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="e.g. JavaScript, Design, …"
              disabled={loading || !!success}
            />
          </div>
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!success}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Sending…' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
