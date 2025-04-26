import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';

// Create context
const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra người dùng hiện tại có phải là admin không
    const checkAdminStatus = async () => {
      try {
        setLoading(true);
        
        // Lấy session hiện tại
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setAdminUser(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        
        // Kiểm tra trong bảng admin_users
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (adminError && adminError.code !== 'PGRST116') {
          console.error('Lỗi khi kiểm tra quyền admin:', adminError);
        }
        
        if (adminData) {
          setAdminUser({
            ...session.user,
            admin_id: adminData.id,
            admin_role: adminData.role || 'admin',
            display_name: adminData.display_name || session.user.email
          });
          setIsAdmin(true);
        } else {
          setAdminUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái admin:', error);
        setAdminUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
    
    // Thiết lập auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        checkAdminStatus();
      } else if (event === 'SIGNED_OUT') {
        setAdminUser(null);
        setIsAdmin(false);
        navigate('/admin/login');
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);
  
  // Hàm đăng xuất
  const adminSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setAdminUser(null);
      setIsAdmin(false);
      navigate('/admin/login');
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    }
  };
  
  // Context value
  const value = {
    adminUser,
    isAdmin,
    loading,
    adminSignOut
  };
  
  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

// HOC để bảo vệ các route admin
export const withAdminAuth = (Component) => {
  return (props) => {
    const { isAdmin, loading } = useAdmin();
    const navigate = useNavigate();
    
    useEffect(() => {
      if (!loading && !isAdmin) {
        navigate('/admin/login');
      }
    }, [isAdmin, loading, navigate]);
    
    if (loading) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }
    
    return isAdmin ? <Component {...props} /> : null;
  };
}; 