import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useSupabaseAuth } from '../Components/Include/Authentication/SupabaseAuthContext';

// Generate unique session ID
const generateSessionId = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2);
  return `${timestamp}_${random}`;
};

// Get or create session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('user_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('user_session_id', sessionId);
  }
  return sessionId;
};

// Detect if user is on mobile
const isMobileDevice = () => {
  const ua = navigator.userAgent;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || window.innerWidth < 768;
};

// Get user's IP address (approximation using timezone/language)
const getUserInfo = () => {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenRes: `${window.screen.width}x${window.screen.height}`,
    isMobile: isMobileDevice()
  };
};

export const useOnlineTracker = () => {
  const { user } = useSupabaseAuth();
  const intervalRef = useRef(null);
  const sessionId = getSessionId();

  // Update user online status
  const updateOnlineStatus = async () => {
    try {
      const userInfo = getUserInfo();
      const currentUrl = window.location.pathname + window.location.search;
      
      await supabase.rpc('update_user_online', {
        p_user_id: user?.id || null,
        p_session_id: sessionId,
        p_ip_address: null, // We can't get real IP from client-side
        p_user_agent: userInfo.userAgent,
        p_page_url: currentUrl,
        p_is_mobile: userInfo.isMobile
      });
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };

  // Remove user from online list
  const setOffline = async () => {
    try {
      await supabase
        .from('online_users')
        .delete()
        .eq('session_id', sessionId);
    } catch (error) {
      console.error('Error setting offline:', error);
    }
  };

  useEffect(() => {
    // Update online status immediately
    updateOnlineStatus();

    // Set up interval to update every 2 minutes
    intervalRef.current = setInterval(updateOnlineStatus, 2 * 60 * 1000);

    // Handle page visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateOnlineStatus();
      }
    };

    // Handle beforeunload event
    const handleBeforeUnload = () => {
      // Use sendBeacon for more reliable offline tracking
      if (navigator.sendBeacon) {
        const data = new FormData();
        data.append('session_id', sessionId);
        navigator.sendBeacon('/api/set-offline', data);
      } else {
        setOffline();
      }
    };

    // Handle page focus/blur
    const handleFocus = () => updateOnlineStatus();
    const handleBlur = () => {
      // Optional: set a shorter timeout for blur events
      setTimeout(() => {
        if (document.visibilityState === 'hidden') {
          setOffline();
        }
      }, 1000);
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      
      // Set offline when component unmounts
      setOffline();
    };
  }, [user?.id, sessionId]);

  // Return methods for manual control if needed
  return {
    updateOnlineStatus,
    setOffline,
    sessionId
  };
};

// Hook to get online users count (for admin dashboard)
export const useOnlineUsersCount = () => {
  const { data: onlineStats, error, refetch } = useSupabaseQuery(
    'get_online_users_count',
    () => supabase.rpc('get_online_users_count'),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  return {
    stats: onlineStats?.[0] || {
      total_online: 0,
      authenticated_online: 0,
      guest_online: 0,
      mobile_online: 0,
      desktop_online: 0
    },
    error,
    refetch
  };
};

// Simple query hook
const useSupabaseQuery = (key, queryFn, options = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchData = async () => {
    try {
      setError(null);
      const result = await queryFn();
      if (result.error) throw result.error;
      setData(result.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (options.refetchInterval) {
      intervalRef.current = setInterval(fetchData, options.refetchInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { data, error, loading, refetch: fetchData };
};

export default useOnlineTracker; 