import { createClient } from '@supabase/supabase-js';

// Supabase URL và anon key - cần thay thế bằng thông tin từ dự án Supabase của bạn
// Lấy các giá trị này từ Project Settings > API trong dashboard Supabase
const supabaseUrl = 'https://vhevalzxveezqrfyzqoz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZXZhbHp4dmVlenFyZnl6cW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MTAwMDksImV4cCI6MjA2MTA4NjAwOX0.alc29iZPj8Cek-_gluZ3293F0kxyXK-GgynIZ-mBs00';

// Log supabase configuration to debug
console.log('Initializing Supabase client with URL:', supabaseUrl);

// Khởi tạo client Supabase với cấu hình cơ bản
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage // Đảm bảo sử dụng localStorage cho session
  }
});

// Thiết lập việc theo dõi trạng thái auth
export const setupAuthObserver = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);
    callback(event, session);
  });

  return subscription;
}; 