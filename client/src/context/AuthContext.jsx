import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { matchesCampusDomain } from '../utils/authUtils';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [campuses, setCampuses] = useState([]);
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // Fetch campuses on mount
    fetch('/api/campuses')
      .then(res => res.json())
      .then(data => {
        if (data.campuses && Array.isArray(data.campuses)) setCampuses(data.campuses);
        else if (Array.isArray(data)) setCampuses(data);
      })
      .catch(err => console.error('Error fetching campuses:', err));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        handleCampusAuth(session.user);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        handleCampusAuth(session.user);
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setSelectedCampus(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCampusAuth = async (authUser) => {
    const pendingCampusStr = localStorage.getItem('pending_campus');
    if (pendingCampusStr) {
      try {
        const campus = JSON.parse(pendingCampusStr);
        if (matchesCampusDomain(authUser.email, campus.email_domains)) {
          await supabase
            .from('users')
            .update({ campus_id: campus.id })
            .eq('id', authUser.id);
          localStorage.removeItem('pending_campus');
          setSelectedCampus(campus);
        } else {
          const userDomain = authUser.email.split('@')[1] || '';
          setAuthError(`Your email domain (${userDomain}) does not match your selected campus (${campus.name}). Please sign in with your official college email.`);
          await signOut();
          localStorage.removeItem('pending_campus');
        }
      } catch (err) {
        console.error('Error handling campus auth:', err);
        localStorage.removeItem('pending_campus');
      }
    }
  };

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (!error && data) {
        setProfile(data);
        if (data.campus_id) {
          // Find campus from already-loaded campuses list, or fetch it
          const cachedCampus = campuses.find(c => c.id === data.campus_id);
          if (cachedCampus) {
            setSelectedCampus(cachedCampus);
          } else {
            fetch('/api/campuses')
              .then(res => res.json())
              .then(campusData => {
                const list = campusData.campuses || campusData;
                if (Array.isArray(list)) {
                  const found = list.find(c => c.id === data.campus_id);
                  if (found) setSelectedCampus(found);
                }
              })
              .catch(err => console.error('Error fetching campus details:', err));
          }
        }
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (campus) => {
    if (campus) {
      localStorage.setItem('pending_campus', JSON.stringify(campus));
    }
    setAuthError('');
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/sendiyou'
      }
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, campuses, selectedCampus, setSelectedCampus, 
      authError, setAuthError, signInWithGoogle, signOut, setProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
