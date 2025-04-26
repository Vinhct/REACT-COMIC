import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';

// Hook quản lý trạng thái xác thực
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Lấy thông tin phiên hiện tại
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (session) {
          const { data: userProfile } = await supabase.auth.getUser();
          setUser(userProfile.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Lỗi khi lấy phiên:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Thiết lập listener cho thay đổi xác thực
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          const { data: userProfile } = await supabase.auth.getUser();
          setUser(userProfile.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Cleanup subscription khi component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Hàm đăng nhập bằng email
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (err) {
      console.error('Lỗi khi đăng nhập:', err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Hàm đăng ký bằng email
  const signUp = async (email, password, displayName) => {
    try {
      setLoading(true);
      
      // Đăng ký người dùng mới với tùy chọn bổ sung
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            display_name: displayName
          },
          emailRedirectTo: window.location.origin // Thêm redirect URL
        }
      });
      
      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (err) {
      console.error('Lỗi khi đăng ký:', err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Hàm đăng xuất
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (err) {
      console.error('Lỗi khi đăng xuất:', err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut
  };
}; 