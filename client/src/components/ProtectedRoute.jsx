import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isUniversityEmail } from '../utils/authUtils';
import CampusLoginModal from './CampusLoginModal';

export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex justify-center items-center">
        <div className="text-violet-primary font-bold">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-32 px-4 flex justify-center">
        <CampusLoginModal isOpen={true} onClose={() => navigate('/')} />
      </div>
    );
  }

  if (!isUniversityEmail(user.email)) {
    return (
      <div className="min-h-screen pt-32 px-4 flex justify-center">
        <div className="w-full max-w-md glass-card p-8 shadow-xl border border-red-busy/50 text-center">
          <div className="w-16 h-16 rounded-full bg-red-busy/10 flex items-center justify-center mb-4 mx-auto">
            <span className="text-red-busy text-2xl font-bold">!</span>
          </div>
          <h2 className="text-xl font-bold font-heading text-text-primary mb-2">Access Denied</h2>
          <p className="text-sm text-text-muted mb-6">
            The email <b>{user.email}</b> is not a verified university email. To access SendiYou, please sign out and log back in with an email ending in .ac.in or .edu.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-3 mb-3 rounded-full bg-slate-border hover:bg-slate-border/80 text-white font-medium transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  if (profile?.is_suspended) {
    return (
      <div className="min-h-screen pt-32 px-4 flex justify-center">
        <div className="w-full max-w-md glass-card p-8 shadow-xl border border-red-busy/50 text-center">
          <div className="w-16 h-16 rounded-full bg-red-busy/10 flex items-center justify-center mb-4 mx-auto">
            <span className="text-red-busy text-2xl font-bold">🛑</span>
          </div>
          <h2 className="text-xl font-bold font-heading text-text-primary mb-2">Account Suspended</h2>
          <p className="text-sm text-text-muted mb-6">
            Your SendiYou account has been suspended by the administrator for violating community guidelines. You can no longer access the SendiYou platform.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-3 rounded-full bg-slate-border hover:bg-slate-border/80 text-white font-medium transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return children;
}
