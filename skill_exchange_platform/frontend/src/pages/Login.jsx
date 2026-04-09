import React from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/ui/PageContainer';

export default function Login() {
  const { loginWithGoogle, loginDev, loading, user } = useAuth();
  const [error, setError] = React.useState('');

  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGoogle = async () => {
    setError('');
    try {
      await loginWithGoogle();
      // signInWithRedirect will navigate away; on return the auth listener
      // and getRedirectResult will update state and navigate via the effect
    } catch (err) {
      console.error(err);
      setError('Google sign-in failed.');
    }
  };

  const handleDev = () => {
    loginDev();
    navigate('/');
  };

  return (
    <PageContainer>
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 mt-1 text-sm">Sign in to continue your skill exchange</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2.5">
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in with Google'}
              </button>
              <button
                onClick={handleDev}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? '...' : 'Dev Login (testing)'}
              </button>
            </div>

            <p className="mt-4 text-[11px] text-gray-400 text-center leading-relaxed">
              Use your Google account to authenticate. The dev button sets a test token for local development.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
