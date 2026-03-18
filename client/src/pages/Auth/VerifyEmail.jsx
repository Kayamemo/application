import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card p-10 text-center max-w-md w-full">
        {status === 'loading' && <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto" />}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-xl font-black text-gray-900">Email verified!</h1>
            <p className="text-sm text-gray-500 mt-1">Your account is now active.</p>
            <Link to="/login" className="btn-primary mt-5 inline-block">Log in</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-xl font-black text-gray-900">Invalid link</h1>
            <p className="text-sm text-gray-500 mt-1">This link is invalid or has expired.</p>
            <Link to="/register" className="btn-primary mt-5 inline-block">Register again</Link>
          </>
        )}
      </div>
    </div>
  );
}
