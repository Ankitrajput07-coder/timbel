import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Edit3, Shield, Mail, Users, FileText, CheckCircle, LogOut, Camera, Loader2, X, Save, Building2 } from 'lucide-react';

const DEFAULT_BANNER = 'https://res.cloudinary.com/dga14nmzn/image/upload/v1784358679/cosen_banner_wwpfb6.png';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, setProfile, selectedCampus } = useAuth();
  
  const [stats, setStats] = useState({ totalPosts: 0, activeChats: 0 });
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [socialInputs, setSocialInputs] = useState({ instagram: '', linkedin: '', github: '' });
  const [savingBio, setSavingBio] = useState(false);
  
  const posterInputRef = React.useRef(null);
  const avatarInputRef = React.useRef(null);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Max 5MB allowed.");
      return;
    }

    const isPoster = type === 'poster';
    if (isPoster) setUploadingPoster(true);
    else setUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${type}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user_uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('user_uploads')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;
      const columnToUpdate = isPoster ? 'poster_url' : 'custom_avatar_url';

      const { error: updateError } = await supabase
        .from('users')
        .update({ [columnToUpdate]: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local profile state
      setProfile(prev => ({ ...prev, [columnToUpdate]: publicUrl }));
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      alert(`Failed to upload ${type}. Ensure the storage_migration.sql was run.`);
    } finally {
      if (isPoster) setUploadingPoster(false);
      else setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchStats();
    // Set default banner if not set
    if (profile && !profile.poster_url) {
      supabase.from('users').update({ poster_url: DEFAULT_BANNER }).eq('id', user.id)
        .then(() => setProfile(prev => ({ ...prev, poster_url: DEFAULT_BANNER })));
    }
  }, [user, navigate]);

  const handleSaveProfile = async () => {
    setSavingBio(true);
    try {
      await supabase.from('users').update({ bio: bioInput.trim(), social_links: socialInputs }).eq('id', user.id);
      setProfile(prev => ({ ...prev, bio: bioInput.trim(), social_links: socialInputs }));
      setShowEditModal(false);
    } catch (e) {
      console.error('Error saving profile:', e);
    } finally {
      setSavingBio(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch total posts created by user
      const { count: postsCount, error: postsError } = await supabase
        .from('sendiyou_posts')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id);
        
      if (postsError) throw postsError;

      // Fetch active chats (accepted requests) where user is a participant
      const { count: chatsCount, error: chatsError } = await supabase
        .from('sendiyou_chats')
        .select('*', { count: 'exact', head: true })
        .contains('participant_ids', [user.id]);
        
      if (chatsError) throw chatsError;

      setStats({
        totalPosts: postsCount || 0,
        activeChats: chatsCount || 0
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] pt-24">
        <div className="w-12 h-12 animate-spin rounded-full border-t-4 border-violet-primary border-r-4 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl relative">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6 text-sm font-medium">
        <ArrowLeft size={18} /> Back
      </button>

      {/* Hidden File Inputs */}
      <input type="file" accept="image/*" hidden ref={posterInputRef} onChange={(e) => handleFileUpload(e, 'poster')} />
      <input type="file" accept="image/*" hidden ref={avatarInputRef} onChange={(e) => handleFileUpload(e, 'avatar')} />

      {/* Main Profile Card */}
      <div className="glass-card rounded-3xl overflow-hidden mb-6" style={{ background: '#0F172A', border: '1px solid rgba(51,65,85,0.4)' }}>
        {/* Cover / Header */}
        <div className="h-40 w-full relative group" style={{ 
          background: `url(${profile.poster_url || DEFAULT_BANNER}) center/cover no-repeat`
        }}>
          {/* Edit Cover Button */}
          <button onClick={() => posterInputRef.current?.click()} disabled={uploadingPoster}
            className="absolute top-4 right-4 bg-slate-deeper/80 backdrop-blur-md p-2 rounded-xl text-text-primary hover:bg-violet-primary/80 transition-colors border border-slate-border/50 flex items-center gap-2">
            {uploadingPoster ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            <span className="text-xs font-bold">{uploadingPoster ? 'Uploading...' : 'Edit Cover'}</span>
          </button>

          <div className="absolute -bottom-12 left-6">
            <div className="w-28 h-28 rounded-full border-4 border-slate-deep overflow-hidden bg-slate-card relative group/avatar cursor-pointer"
                 onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-slate-deep/80 z-20 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-violet-primary" />
                </div>
              )}
              {profile.custom_avatar_url || user.user_metadata?.avatar_url ? (
                <img src={profile.custom_avatar_url || user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-violet-primary"
                  style={{ background: 'rgba(99,91,255,0.1)' }}>
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Avatar overlay on hover */}
              <div className="absolute inset-0 bg-black/50 z-10 hidden group-hover/avatar:flex items-center justify-center text-white transition-all">
                <Camera size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-16 pb-6 px-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{profile.name}</h1>
              <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
                <Mail size={14} /> {user.email}
              </p>
              {selectedCampus && (
                <p className="text-sm text-emerald-free flex items-center gap-1 mt-1">
                  <Building2 size={14} />
                  {selectedCampus.name}
                </p>
              )}
              {/* Bio */}
              {profile.bio ? (
                <p className="text-sm text-text-secondary mt-2 max-w-xs leading-relaxed">{profile.bio}</p>
              ) : (
                <p className="text-sm text-text-muted mt-2 italic opacity-60">No bio yet — add one!</p>
              )}
              {/* Social Links */}
              <div className="flex items-center gap-3 mt-3">
                {profile.social_links?.instagram && (
                  <a href={`https://instagram.com/${profile.social_links.instagram}`} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-violet-primary transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                )}
                {profile.social_links?.linkedin && (
                  <a href={`https://linkedin.com/in/${profile.social_links.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-violet-primary transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                )}
                {profile.social_links?.github && (
                  <a href={`https://github.com/${profile.social_links.github}`} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-violet-primary transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                  </a>
                )}
              </div>
            </div>
            <button onClick={() => { 
                setBioInput(profile.bio || ''); 
                setSocialInputs(profile.social_links || { instagram: '', linkedin: '', github: '' });
                setShowEditModal(true); 
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 border border-slate-border/50 shrink-0">
              <Edit3 size={14} /> Edit Profile
            </button>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-slate-deeper p-4 rounded-2xl border border-slate-border/50">
              <span className="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">Gender</span>
              <span className="text-text-primary font-medium">{profile.gender}</span>
            </div>
            <div className="bg-slate-deeper p-4 rounded-2xl border border-slate-border/50">
              <span className="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">Branch</span>
              <span className="text-text-primary font-medium">{profile.branch}</span>
            </div>
            <div className="bg-slate-deeper p-4 rounded-2xl border border-slate-border/50">
              <span className="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">Enrollment No.</span>
              <span className="text-text-primary font-medium flex items-center gap-2">
                {profile.enrollment_number} <Shield size={14} className="text-emerald-free" />
              </span>
            </div>
            <div className="bg-slate-deeper p-4 rounded-2xl border border-slate-border/50">
              <span className="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">Campus</span>
              <span className="text-text-primary font-medium">{selectedCampus?.short_name || 'Not Set'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <h3 className="text-lg font-bold text-text-primary mb-4 px-2">Your SendiYou Stats</h3>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-5 rounded-2xl border border-slate-border/40 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-violet-primary/10 flex items-center justify-center text-violet-primary mb-3">
            <FileText size={24} />
          </div>
          <h4 className="text-3xl font-extrabold text-text-primary mb-1">
            {loading ? '-' : stats.totalPosts}
          </h4>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Requests</span>
        </div>
        
        <div className="glass-card p-5 rounded-2xl border border-slate-border/40 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-free/10 flex items-center justify-center text-emerald-free mb-3">
            <CheckCircle size={24} />
          </div>
          <h4 className="text-3xl font-extrabold text-text-primary mb-1">
            {loading ? '-' : stats.activeChats}
          </h4>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Accepted Requests</span>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-500/20 rounded-2xl p-4 bg-red-500/5 flex justify-between items-center">
        <div>
          <h4 className="font-bold text-red-400 text-sm">Sign Out</h4>
          <p className="text-xs text-text-muted">Log out of your account on this device.</p>
        </div>
        <button onClick={() => { signOut(); navigate('/'); }}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* ═══ PROFILE EDIT MODAL ═══ */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
          <div className="w-full max-w-md bg-slate-card rounded-2xl shadow-2xl border border-slate-border/50 p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-text-primary">Edit Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="text-xs text-text-muted font-semibold uppercase tracking-wider block mb-2">Bio</label>
              <textarea
                value={bioInput}
                onChange={e => setBioInput(e.target.value.slice(0, 150))}
                placeholder="e.g. CSE student 🎓 | Coffee addict ☕ | Open to study connections"
                rows={3}
                className="w-full bg-slate-deeper border border-slate-border/50 rounded-xl p-3 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-violet-primary transition-colors"
              />
              <p className="text-xs text-text-muted text-right mt-1">{bioInput.length}/150</p>
            </div>
            
            <div className="mb-6 space-y-3">
              <label className="text-xs text-text-muted font-semibold uppercase tracking-wider block mb-1">Social Links</label>
              
              <div className="flex items-center bg-slate-deeper border border-slate-border/50 rounded-xl p-2 focus-within:border-violet-primary transition-colors">
                <span className="text-text-muted text-sm px-2">instagram.com/</span>
                <input 
                  type="text" 
                  value={socialInputs.instagram}
                  onChange={e => setSocialInputs({...socialInputs, instagram: e.target.value})}
                  placeholder="your_username" 
                  className="bg-transparent text-sm text-text-primary placeholder-text-muted outline-none w-full"
                />
              </div>
              
              <div className="flex items-center bg-slate-deeper border border-slate-border/50 rounded-xl p-2 focus-within:border-violet-primary transition-colors">
                <span className="text-text-muted text-sm px-2">linkedin.com/in/</span>
                <input 
                  type="text" 
                  value={socialInputs.linkedin}
                  onChange={e => setSocialInputs({...socialInputs, linkedin: e.target.value})}
                  placeholder="your-profile" 
                  className="bg-transparent text-sm text-text-primary placeholder-text-muted outline-none w-full"
                />
              </div>
              
              <div className="flex items-center bg-slate-deeper border border-slate-border/50 rounded-xl p-2 focus-within:border-violet-primary transition-colors">
                <span className="text-text-muted text-sm px-2">github.com/</span>
                <input 
                  type="text" 
                  value={socialInputs.github}
                  onChange={e => setSocialInputs({...socialInputs, github: e.target.value})}
                  placeholder="your-github" 
                  className="bg-transparent text-sm text-text-primary placeholder-text-muted outline-none w-full"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowEditModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text-muted border border-slate-border/50 hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveProfile} disabled={savingBio}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-primary hover:bg-violet-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {savingBio ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {savingBio ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
