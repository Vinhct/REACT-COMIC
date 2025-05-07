import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook để quản lý nhiệm vụ và vòng quay may mắn
 */
const useMissionSystem = () => {
  const [missions, setMissions] = useState([]);
  const [userMissions, setUserMissions] = useState([]);
  const [spinTickets, setSpinTickets] = useState(0);
  const [spinRewards, setSpinRewards] = useState([]);
  const [spinHistory, setSpinHistory] = useState([]);
  const [timeUntilReset, setTimeUntilReset] = useState(null);
  const [loading, setLoading] = useState({
    missions: false,
    userMissions: false,
    spinTickets: false,
    spinRewards: false,
    spinHistory: false
  });
  const [error, setError] = useState(null);

  // Tính toán thời gian còn lại đến 12h đêm
  const calculateTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    // Tính thời gian còn lại tính bằng mili giây
    const timeLeft = tomorrow - now;
    
    // Chuyển đổi sang giờ, phút, giây
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    return {
      hours,
      minutes,
      seconds,
      total: timeLeft
    };
  };

  // Cập nhật thời gian đếm ngược mỗi giây
  useEffect(() => {
    const updateResetTimer = () => {
      setTimeUntilReset(calculateTimeUntilReset());
    };
    
    // Cập nhật lần đầu
    updateResetTimer();
    
    // Cập nhật mỗi giây
    const intervalId = setInterval(updateResetTimer, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Lấy danh sách nhiệm vụ từ server
  const fetchMissions = async () => {
    try {
      setLoading(prev => ({ ...prev, missions: true }));
      
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .order('target_value', { ascending: true });
      
      if (error) throw error;
      
      setMissions(data || []);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách nhiệm vụ:', err.message);
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, missions: false }));
    }
  };

  // Lấy tiến độ nhiệm vụ của người dùng hiện tại
  const fetchUserMissions = async () => {
    try {
      setLoading(prev => ({ ...prev, userMissions: true }));
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from('user_missions')
        .select(`
          *,
          mission:missions(*)
        `)
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      setUserMissions(data || []);
    } catch (err) {
      console.error('Lỗi khi lấy tiến độ nhiệm vụ:', err.message);
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, userMissions: false }));
    }
  };

  // Lấy số lượt quay hiện có của người dùng
  const fetchSpinTickets = async () => {
    try {
      setLoading(prev => ({ ...prev, spinTickets: true }));
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from('spin_tickets')
        .select('amount')
        .eq('user_id', session.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 là lỗi "không tìm thấy"
      
      setSpinTickets(data?.amount || 0);
    } catch (err) {
      console.error('Lỗi khi lấy số lượt quay:', err.message);
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, spinTickets: false }));
    }
  };

  // Lấy danh sách phần thưởng có thể nhận được
  const fetchSpinRewards = async () => {
    try {
      setLoading(prev => ({ ...prev, spinRewards: true }));
      
      const { data, error } = await supabase
        .from('spin_rewards')
        .select('*')
        .eq('is_active', true)
        .order('probability', { ascending: false });
      
      if (error) throw error;
      
      setSpinRewards(data || []);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách phần thưởng:', err.message);
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, spinRewards: false }));
    }
  };

  // Lấy lịch sử quay thưởng của người dùng
  const fetchSpinHistory = async () => {
    try {
      setLoading(prev => ({ ...prev, spinHistory: true }));
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from('spin_history')
        .select(`
          *,
          reward:spin_rewards(*)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setSpinHistory(data || []);
    } catch (err) {
      console.error('Lỗi khi lấy lịch sử quay thưởng:', err.message);
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, spinHistory: false }));
    }
  };

  // Cập nhật tiến độ nhiệm vụ đọc truyện theo thời gian
  const updateReadTimeProgress = async (timeInMinutes) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { success: false, error: 'Chưa đăng nhập' };
      
      // Lấy nhiệm vụ đọc theo thời gian
      const { data: timeMission, error: missionError } = await supabase
        .from('missions')
        .select('*')
        .eq('type', 'read_time')
        .eq('is_repeatable', true)
        .single();
      
      if (missionError) throw missionError;
      
      // Kiểm tra và cập nhật tiến độ
      const { data: userMission, error: userMissionError } = await supabase
        .from('user_missions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('mission_id', timeMission.id)
        .single();
      
      // Nếu chưa có bản ghi tiến độ, tạo mới
      if (userMissionError && userMissionError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('user_missions')
          .insert({
            user_id: session.user.id,
            mission_id: timeMission.id,
            progress: timeInMinutes,
            completed: timeInMinutes >= timeMission.target_value,
            completed_at: timeInMinutes >= timeMission.target_value ? new Date().toISOString() : null
          });
        
        if (insertError) throw insertError;
      } else {
        // Nếu đã có bản ghi, cập nhật tiến độ
        // Kiểm tra nếu đã nhận thưởng thì không cập nhật tiến độ nữa
        if (userMission.rewarded) {
          return { success: true, message: 'Nhiệm vụ đã hoàn thành và nhận thưởng hôm nay' };
        }
        
        const { error: updateError } = await supabase
          .from('user_missions')
          .update({
            progress: Math.max(userMission.progress, timeInMinutes),
            completed: timeInMinutes >= timeMission.target_value,
            completed_at: timeInMinutes >= timeMission.target_value && !userMission.completed 
              ? new Date().toISOString() 
              : userMission.completed_at
          })
          .eq('id', userMission.id);
        
        if (updateError) throw updateError;
      }
      
      // Cập nhật lại dữ liệu
      await fetchUserMissions();
      
      return { success: true };
    } catch (err) {
      console.error('Lỗi khi cập nhật tiến độ đọc truyện:', err.message);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Nhận thưởng cho nhiệm vụ đã hoàn thành
  const claimMissionReward = async (missionId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { success: false, error: 'Chưa đăng nhập' };
      
      // Lấy thông tin nhiệm vụ
      const { data: userMission, error: missionError } = await supabase
        .from('user_missions')
        .select(`
          *,
          mission:missions(*)
        `)
        .eq('user_id', session.user.id)
        .eq('mission_id', missionId)
        .single();
      
      if (missionError) throw missionError;
      
      // Kiểm tra nhiệm vụ đã hoàn thành chưa
      if (!userMission.completed) {
        return { success: false, error: 'Nhiệm vụ chưa hoàn thành' };
      }
      
      // Kiểm tra đã nhận thưởng chưa
      if (userMission.rewarded) {
        return { success: false, error: 'Đã nhận thưởng trước đó' };
      }
      
      // Bắt đầu transaction để cập nhật đồng thời
      const { error: updateError } = await supabase.rpc('claim_mission_reward', {
        p_user_id: session.user.id,
        p_mission_id: missionId
      });
      
      if (updateError) throw updateError;
      
      // Cập nhật lại dữ liệu
      await Promise.all([
        fetchUserMissions(),
        fetchSpinTickets()
      ]);
      
      return { 
        success: true, 
        message: `Đã nhận ${userMission.mission.reward_amount} lượt quay!`
      };
    } catch (err) {
      console.error('Lỗi khi nhận thưởng nhiệm vụ:', err.message);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Thực hiện quay thưởng
  const spinWheel = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { success: false, error: 'Chưa đăng nhập' };
      
      // Kiểm tra số lượt quay
      if (spinTickets <= 0) {
        return { success: false, error: 'Không đủ lượt quay' };
      }
      
      // Gọi hàm xử lý quay thưởng trên server
      const { data, error } = await supabase.rpc('spin_wheel', {
        p_user_id: session.user.id
      });
      
      if (error) throw error;
      
      // Cập nhật lại dữ liệu
      await Promise.all([
        fetchSpinTickets(),
        fetchSpinHistory()
      ]);
      
      return { success: true, reward: data };
    } catch (err) {
      console.error('Lỗi khi quay thưởng:', err.message);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Cập nhật toàn bộ dữ liệu
  const refreshAll = async () => {
    setError(null);
    
    // Kiểm tra và reset nhiệm vụ hàng ngày nếu cần
    try {
      await supabase.rpc('check_and_reset_missions');
    } catch (err) {
      console.error('Lỗi khi kiểm tra reset nhiệm vụ:', err.message);
    }
    
    await Promise.all([
      fetchMissions(),
      fetchUserMissions(),
      fetchSpinTickets(),
      fetchSpinRewards(),
      fetchSpinHistory()
    ]);
  };

  // Định dạng thời gian đếm ngược (00:00:00)
  const formatTimeUntilReset = () => {
    if (!timeUntilReset) return '--:--:--';
    
    const { hours, minutes, seconds } = timeUntilReset;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Tự động cập nhật dữ liệu khi component mount
  useEffect(() => {
    refreshAll();
    
    // Thiết lập hàm lắng nghe các thay đổi từ database (realtime)
    const userMissionsSubscription = supabase
      .channel('user_missions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_missions'
      }, () => {
        fetchUserMissions();
      })
      .subscribe();
      
    const spinTicketsSubscription = supabase
      .channel('spin_tickets_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'spin_tickets'
      }, () => {
        fetchSpinTickets();
      })
      .subscribe();
      
    const spinHistorySubscription = supabase
      .channel('spin_history_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'spin_history'
      }, () => {
        fetchSpinHistory();
      })
      .subscribe();
    
    // Cleanup khi component unmount
    return () => {
      userMissionsSubscription.unsubscribe();
      spinTicketsSubscription.unsubscribe();
      spinHistorySubscription.unsubscribe();
    };
  }, []);

  return {
    // State
    missions,
    userMissions,
    spinTickets,
    spinRewards,
    spinHistory,
    timeUntilReset,
    loading,
    error,
    
    // Methods
    fetchMissions,
    fetchUserMissions,
    fetchSpinTickets,
    fetchSpinRewards,
    fetchSpinHistory,
    updateReadTimeProgress,
    claimMissionReward,
    spinWheel,
    refreshAll,
    formatTimeUntilReset
  };
};

export default useMissionSystem; 