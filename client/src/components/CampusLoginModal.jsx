import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import cosenLogo from '../assets/cosen_brand_logo2.svg';

export default function CampusLoginModal({ isOpen, onClose }) {
  const { campuses, signInWithGoogle, authError, setAuthError } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampus, setSelectedCampus] = useState(null);

  const filteredCampuses = useMemo(() => {
    if (!campuses) return [];
    if (!searchQuery.trim()) return campuses;
    const query = searchQuery.toLowerCase();
    return campuses.filter(
      (campus) =>
        campus.name.toLowerCase().includes(query) ||
        campus.short_name.toLowerCase().includes(query)
    );
  }, [campuses, searchQuery]);

  if (!isOpen) return null;

  const handleLogin = () => {
    if (!selectedCampus) return;
    if (setAuthError) setAuthError(null);
    signInWithGoogle(selectedCampus);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
         onClick={onClose}>
      <div 
        className="w-full max-w-md glass-card p-6 shadow-xl border border-violet-primary/30 flex flex-col max-h-[90vh] relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-text-muted hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>
        <div className="text-center mb-6 mt-2">
          <div className="w-24 h-24 flex items-center justify-center mb-4 mx-auto">
            <img src={cosenLogo} alt="Cosen Logo" className="w-full h-full object-contain drop-shadow-lg" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-text-primary mb-2">
            University Login
          </h2>
          <p className="text-sm text-text-muted">
            Select your university and sign in with your college Google account
          </p>
        </div>

        {authError && (
          <div className="mb-4 p-3 rounded-lg bg-red-busy/10 border border-red-busy/30 text-red-busy text-sm">
            {authError}
          </div>
        )}

        <div className="relative mb-4 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-text-muted" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-3 bg-slate-deeper border border-slate-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-violet-primary transition-colors"
            placeholder="Search university..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-[200px] mb-4 space-y-2 pr-2 custom-scrollbar">
          {filteredCampuses?.length > 0 ? (
            filteredCampuses.map((campus) => (
              <button
                key={campus.id}
                onClick={() => setSelectedCampus(campus)}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  selectedCampus?.id === campus.id
                    ? 'border-violet-primary bg-violet-primary/10'
                    : 'border-slate-border bg-slate-card hover:border-violet-primary/50'
                }`}
              >
                <div className="font-bold text-text-primary">
                  {campus.short_name}
                </div>
                <div className="text-sm text-text-muted truncate">
                  {campus.name}
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-text-muted">
              No universities found
            </div>
          )}
        </div>

        <div className="mt-auto shrink-0 space-y-3">
          <button
            onClick={handleLogin}
            disabled={!selectedCampus}
            className={`w-full py-3 rounded-full font-bold transition-all flex items-center justify-center gap-2 ${
              selectedCampus
                ? 'bg-white text-slate-darker hover:bg-gray-200'
                : 'bg-white/50 text-slate-darker/50 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
