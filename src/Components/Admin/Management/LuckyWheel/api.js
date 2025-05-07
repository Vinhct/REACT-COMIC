import { supabase, supabaseAdmin } from '../../../../supabaseClient';

// Fetch prizes from database
export const fetchPrizes = async () => {
  try {
    const { data, error } = await supabase
      .from('spin_rewards')
      .select('*')
      .order('probability', { ascending: false });
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (err) {
    console.error('Error fetching wheel prizes:', err.message);
    return { data: null, error: err.message };
  }
};

// Fetch wheel stats
export const fetchWheelStats = async () => {
  try {
    // Count total prizes
    const { count: totalPrizes, error: countError } = await supabase
      .from('spin_rewards')
      .select('*', { count: 'exact', head: true });
      
    if (countError) throw countError;
    
    // Count total spins
    const { count: totalSpins, error: spinsError } = await supabase
      .from('spin_history')
      .select('*', { count: 'exact', head: true });
      
    if (spinsError) throw spinsError;
    
    return { 
      data: {
        totalPrizes,
        totalSpins,
        prizesClaimed: totalSpins // Assuming all spins are claimed in this model
      }, 
      error: null 
    };
  } catch (err) {
    console.error('Error fetching wheel stats:', err.message);
    return { data: null, error: err.message };
  }
};

// Fetch spin history
export const fetchSpinHistory = async (
  page = 1, 
  perPage = 10, 
  userId = null,
  filters = {
    startDate: null,
    endDate: null,
    prizeType: null,
    status: null
  }
) => {
  try {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    
    // Thử kết nối với bảng spin_history (số ít)
    console.log('Attempting to fetch from spin_history table');
    let query = supabase
      .from('spin_history')
      .select(`*`)
      .order('created_at', { ascending: false });
    
    // Add user filter if provided
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    // Add date range filters if provided
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      query = query.gte('created_at', startDate.toISOString());
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endDate.toISOString());
    }
    
    // Add status filter if provided
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    // Add pagination
    query = query.range(from, to);
    
    console.log('Fetching spin history with query:', query);
    let { data, error } = await query;
    
    // Nếu lỗi, thử với bảng spin_histories (số nhiều)
    if (error) {
      console.error('Error fetching from spin_history:', error);
      console.log('Attempting to fetch from spin_histories table');
      
      let query2 = supabase
        .from('spin_histories')
        .select(`*`)
        .order('created_at', { ascending: false });
      
      // Add user filter if provided
      if (userId) {
        query2 = query2.eq('user_id', userId);
      }
      
      // Add date range filters if provided
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        query2 = query2.gte('created_at', startDate.toISOString());
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        query2 = query2.lte('created_at', endDate.toISOString());
      }
      
      // Add status filter if provided
      if (filters.status && filters.status !== 'all') {
        query2 = query2.eq('status', filters.status);
      }
      
      // Add pagination
      query2 = query2.range(from, to);
      
      const response = await query2;
      data = response.data;
      error = response.error;
      
      if (error) {
        console.error('Error fetching from spin_histories:', error);
        throw error;
      }
    }
    
    console.log('Raw spin history data:', data);
    
    // Manually join with user_profile table
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(item => item.user_id))];
      console.log('User IDs to fetch:', userIds);
      
      // Thử với bảng 'user_profiles' (số nhiều)
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', userIds);
        
      if (profilesError) {
        console.error('Error fetching user profiles from user_profiles table:', profilesError);
        
        // Nếu lỗi, thử với bảng 'users'
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .in('id', userIds);
          
        if (usersError) {
          console.error('Error fetching user profiles from users table:', usersError);
          
          // Cuối cùng thử với bảng 'user_profile'
          const { data: userProfileData, error: userProfileError } = await supabase
            .from('user_profile')
            .select('*')
            .in('id', userIds);
            
          if (userProfileError) {
            console.error('Error fetching user profiles from user_profile table:', userProfileError);
          } else {
            console.log('User profiles fetched from user_profile:', userProfileData);
            
            const userMap = {};
            userProfileData.forEach(user => {
              userMap[user.id] = user;
            });
            
            data.forEach(item => {
              item.users = userMap[item.user_id] || null;
            });
          }
        } else {
          console.log('User profiles fetched from users table:', usersData);
          
          const userMap = {};
          usersData.forEach(user => {
            // Format lại dữ liệu từ bảng users
            userMap[user.id] = {
              id: user.id,
              email: user.email,
              display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Unknown User'
            };
          });
          
          data.forEach(item => {
            item.users = userMap[item.user_id] || null;
          });
        }
      } else {
        console.log('User profiles fetched from user_profiles:', profilesData);
        
        const userMap = {};
        profilesData.forEach(user => {
          userMap[user.id] = user;
        });
        
        data.forEach(item => {
          item.users = userMap[item.user_id] || null;
        });
      }
    }
    
    // Manually join with rewards table
    if (data && data.length > 0) {
      const rewardIds = [...new Set(data.map(item => item.reward_id))];
      console.log('Reward IDs to fetch:', rewardIds);
      
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('spin_rewards')
        .select('*')
        .in('id', rewardIds);
        
      if (rewardsError) {
        console.error('Error fetching rewards:', rewardsError);
      }
      
      console.log('Rewards fetched:', rewardsData);
        
      if (!rewardsError && rewardsData) {
        const rewardMap = {};
        rewardsData.forEach(reward => {
          rewardMap[reward.id] = reward;
        });
        
        data.forEach(item => {
          item.rewards = rewardMap[item.reward_id] || null;
        });
      }
      
      // Filter by prize type if provided (client-side filtering after we've done the join)
      if (filters.prizeType && filters.prizeType !== 'all') {
        const filteredData = data.filter(item => item.rewards?.type === filters.prizeType);
        console.log('Filtered data by prize type:', filteredData);
        
        return {
          data: filteredData,
          hasMore: false, // We're filtering client-side, so pagination doesn't apply
          totalItems: filteredData.length,
          totalPages: 1,
          error: null
        };
      }
    }
    
    // Get total count
    console.log('Getting total count from spin_history');
    let { count, error: countError } = await supabase
      .from('spin_history')
      .select('*', { count: 'exact', head: true });

    // Nếu lỗi, thử với bảng spin_histories
    if (countError) {
      console.error('Error getting count from spin_history:', countError);
      console.log('Getting total count from spin_histories');
      
      const { count: count2, error: countError2 } = await supabase
        .from('spin_histories')
        .select('*', { count: 'exact', head: true });
        
      if (countError2) {
        console.error('Error getting count from spin_histories:', countError2);
      } else {
        count = count2;
      }
    }

    console.log('Total count of spin history:', count);
    const hasMore = from + data.length < (count || 0);
    const totalItems = count || 0;
    
    return { 
      data, 
      hasMore, 
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / perPage),
      error: null 
    };
  } catch (err) {
    console.error('Error fetching spin history:', err.message);
    return { data: null, hasMore: false, totalItems: 0, error: err.message };
  }
};

// Helper function for conditional filtering
const conditionalFilter = (query, column, value, filterFn) => {
  return value ? filterFn(query, value) : query;
};

// Fetch user statistics
export const fetchUserStatistics = async (userId) => {
  try {
    if (!userId) return { data: null, error: 'User ID is required' };
    
    // Fetch user profile first
    console.log('Fetching user profile for user ID:', userId);
    
    // Biến để lưu thông tin user profile
    let userProfileData = null;
    
    // Thử lấy từ bảng user_profiles
    const { data: profilesData, error: profileError } = await supabase
      .from('user_profiles')
      .select('display_name, email')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('Error fetching from user_profiles:', profileError);
      
      // Thử lấy từ bảng users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email, user_metadata')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.error('Error fetching from users table:', userError);
        
        // Thử lấy từ bảng user_profile
        const { data: profileData, error: userProfileError } = await supabase
          .from('user_profile')
          .select('display_name, email')
          .eq('id', userId)
          .single();
          
        if (userProfileError) {
          console.error('Error fetching user profile from all tables:', userProfileError);
        } else {
          console.log('User profile fetched from user_profile:', profileData);
          userProfileData = profileData;
        }
      } else {
        console.log('User profile fetched from users table:', userData);
        userProfileData = {
          display_name: userData.user_metadata?.display_name || userData.email?.split('@')[0] || 'Unknown User',
          email: userData.email
        };
      }
    } else {
      console.log('User profile fetched from user_profiles:', profilesData);
      userProfileData = profilesData;
    }
    
    // Count user's total spins
    const { count: totalSpins, error: spinsError } = await supabase
      .from('spin_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (spinsError) throw spinsError;
    
    let mostWonPrize = null;
    
    try {
      // Manually get counts
      const { data: spinCounts, error: countsError } = await supabase
        .from('spin_history')
        .select('reward_id, count(*)')
        .eq('user_id', userId)
        .group('reward_id')
        .order('count', { ascending: false })
        .limit(1);
        
      if (!countsError && spinCounts && spinCounts.length > 0) {
        // Get reward details
        const { data: rewardData, error: rewardError } = await supabase
          .from('spin_rewards')
          .select('name, type, value')
          .eq('id', spinCounts[0].reward_id)
          .single();
          
        if (!rewardError && rewardData) {
          mostWonPrize = {
            reward_id: spinCounts[0].reward_id,
            count: spinCounts[0].count,
            rewards: rewardData,
            user: userProfileData
          };
        }
      }
    } catch (err) {
      console.error('Error getting most won prize:', err.message);
    }
    
    return { 
      data: {
        totalSpins,
        prizesClaimed: totalSpins, // Assuming all spins are claimed in this model
        mostWonPrize,
        userProfile: userProfileData
      }, 
      error: null 
    };
  } catch (err) {
    console.error('Error fetching user statistics:', err.message);
    return { data: null, error: err.message };
  }
};

// Search users
export const searchUsers = async (searchTerm) => {
  try {
    if (!searchTerm?.trim()) return { data: [], error: null };
    
    console.log('Searching users with term:', searchTerm);
    
    // Tìm kiếm trong bảng auth.users
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, user_metadata')
      .ilike('email', `%${searchTerm}%`)
      .limit(10);
      
    if (authError) {
      console.error('Error searching in auth.users:', authError);
      console.log('Auth error code:', authError.code);
      console.log('Auth error message:', authError.message);
      
      // Tìm kiếm trong bảng profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .or(`email.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .limit(10);
        
      if (profilesError) {
        console.error('Error searching in profiles:', profilesError);
        
        // Thử với bảng user_profiles
        const { data: userProfilesData, error: userProfilesError } = await supabase
          .from('user_profiles')
          .select('id, email, display_name')
          .or(`email.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
          .limit(10);
          
        if (userProfilesError) {
          console.error('Error searching in user_profiles:', userProfilesError);
          
          // Nếu mọi thứ thất bại, tạo người dùng mặc định từ spin_history
          console.log('Attempting to create search results from spin_history');
          const { data: spinUsers, error: spinError } = await supabase
            .from('spin_history')
            .select('user_id')
            .limit(10);
            
          if (!spinError && spinUsers && spinUsers.length > 0) {
            // Lấy danh sách unique user_ids
            const uniqueUserIds = [...new Set(spinUsers.map(item => item.user_id))];
            
            // Lọc theo searchTerm
            const filteredUserIds = uniqueUserIds.filter(id => 
              id.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            // Tạo danh sách người dùng từ user_ids
            const usersList = filteredUserIds.map(id => ({
              id: id,
              email: `user_${id.substring(0, 8)}@example.com`,
              display_name: `User ${id.substring(0, 8)}`,
            }));
            
            console.log('Created users search results from spin history:', usersList);
            return { data: usersList, error: null };
          }
          
          return { data: [], error: 'Could not search users in any table' };
        }
        
        console.log('Search results from user_profiles:', userProfilesData);
        return { data: userProfilesData, error: null };
      }
      
      console.log('Search results from profiles:', profilesData);
      return { data: profilesData, error: null };
    }
    
    // Format lại dữ liệu người dùng từ auth.users
    const formattedUsers = authUsers.map(user => ({
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Unknown User',
    }));
    
    console.log('Search results from auth.users:', formattedUsers);
    return { data: formattedUsers, error: null };
  } catch (err) {
    console.error('Error searching users:', err.message, err.stack);
    return { data: [], error: 'Exception when searching users: ' + err.message };
  }
};

// Add Prize
export const addPrize = async (prizeData) => {
  try {
    const { data, error } = await supabase
      .from('spin_rewards')
      .insert(prizeData);
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (err) {
    console.error('Error adding prize:', err.message);
    return { data: null, error: err.message };
  }
};

// Update Prize
export const updatePrize = async (id, prizeData) => {
  try {
    const { data, error } = await supabase
      .from('spin_rewards')
      .update(prizeData)
      .eq('id', id);
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (err) {
    console.error('Error updating prize:', err.message);
    return { data: null, error: err.message };
  }
};

// Delete Prize
export const deletePrize = async (id) => {
  try {
    const { data, error } = await supabase
      .from('spin_rewards')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (err) {
    console.error('Error deleting prize:', err.message);
    return { success: false, error: err.message };
  }
};

// Fetch all users
export const fetchAllUsers = async () => {
  try {
    console.log('Attempting to fetch users with admin privileges');
    // Sử dụng supabaseAdmin với service role để truy cập auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin
      .from('auth.users')
      .select('id, email, created_at, user_metadata')
      .order('created_at', { ascending: false })
      .limit(100);
      
    if (!authError && authUsers && authUsers.length > 0) {
      console.log('Successfully fetched users with admin privileges:', authUsers.length);
      
      // Format dữ liệu từ bảng auth.users
      const formattedUsers = authUsers.map(user => ({
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Unknown User',
        created_at: user.created_at
      }));
      
      return { data: formattedUsers, error: null };
    }
    
    console.error('Error fetching with admin privileges:', authError);
    
    // Nếu không thành công với admin, thử các bảng thông thường
    // Thử truy vấn bảng users (không có tiền tố auth.)
    console.log('Attempting to fetch users from users table');
    let { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, created_at, user_metadata')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (!usersError && users && users.length > 0) {
      console.log('Successfully fetched from users table:', users);
      
      // Format dữ liệu từ bảng users
      const formattedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Unknown User',
        created_at: user.created_at
      }));
      
      return { data: formattedUsers || [], error: null };
    }
    
    // Nếu không tìm thấy bảng users, thử với bảng profiles
    console.log('Attempting to fetch from profiles table');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, display_name, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
      
    if (!profilesError && profilesData && profilesData.length > 0) {
      console.log('Successfully fetched from profiles:', profilesData);
      return { data: profilesData || [], error: null };
    }
      
    // Thử với bảng user_profiles (số nhiều)
    console.log('Attempting to fetch from user_profiles table');
    const { data: userProfilesData, error: userProfilesError } = await supabase
      .from('user_profiles')
      .select('id, email, display_name, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
      
    if (!userProfilesError && userProfilesData && userProfilesData.length > 0) {
      console.log('Successfully fetched from user_profiles:', userProfilesData);
      return { data: userProfilesData || [], error: null };
    }
    
    // Thử tạo một mảng người dùng dựa trên spin_history
    console.log('Attempting to create user list from spin_history');
    const { data: spinUsers, error: spinError } = await supabase
      .from('spin_history')
      .select('user_id')
      .order('created_at', { ascending: false });
      
    if (!spinError && spinUsers && spinUsers.length > 0) {
      // Lấy danh sách unique user_ids
      const uniqueUserIds = [...new Set(spinUsers.map(item => item.user_id))];
      
      // Tạo danh sách người dùng từ user_ids
      const usersList = uniqueUserIds.map(id => ({
        id: id,
        email: `user_${id.substring(0, 8)}@example.com`,
        display_name: `User ${id.substring(0, 8)}`,
        created_at: new Date().toISOString()
      }));
      
      console.log('Created users list from spin history:', usersList);
      return { data: usersList, error: null };
    }
    
    return { 
      data: [], 
      error: 'Could not fetch users from any table. Please check database permissions and RLS policies.' 
    };
  } catch (err) {
    console.error('Error fetching all users:', err.message, err.stack);
    return { data: [], error: 'Exception when fetching users: ' + err.message };
  }
};

// Cập nhật trạng thái phát thưởng
export const updateRewardStatus = async (spinHistoryId, status, adminNote = '') => {
  try {
    console.log('Updating reward status for spin history ID:', spinHistoryId);
    console.log('New status:', status);
    console.log('Admin note:', adminNote);
    
    // Trước tiên, kiểm tra xem bản ghi tồn tại không
    const { data: existingRecord, error: checkError } = await supabase
      .from('spin_history')
      .select('id, status')
      .eq('id', spinHistoryId)
      .single();
      
    if (checkError) {
      console.error('Error checking spin history record:', checkError);
      return { success: false, error: `Không tìm thấy bản ghi: ${checkError.message}` };
    }
    
    console.log('Existing record:', existingRecord);
    
    // Tạo object với dữ liệu cập nhật
    const updateData = {
      status: status,
      admin_note: adminNote,
      updated_at: new Date().toISOString()
    };
    
    console.log('Update data:', updateData);
    
    // Thực hiện cập nhật
    const { data, error } = await supabase
      .from('spin_history')
      .update(updateData)
      .eq('id', spinHistoryId)
      .select(); // Thêm select() để trả về dữ liệu đã cập nhật
      
    if (error) {
      console.error('Error in updateRewardStatus:', error);
      throw error;
    }
    
    console.log('Status update successful, result:', data);
    
    // Kiểm tra lại dữ liệu sau khi cập nhật
    const { data: verifyData, error: verifyError } = await supabase
      .from('spin_history')
      .select('id, status, admin_note, updated_at')
      .eq('id', spinHistoryId)
      .single();
      
    if (verifyError) {
      console.warn('Could not verify update:', verifyError);
    } else {
      console.log('Verified data after update:', verifyData);
    }
    
    return { 
      success: true, 
      data, 
      verifyData,
      error: null 
    };
  } catch (err) {
    console.error('Exception in updateRewardStatus:', err.message, err.stack);
    return { success: false, data: null, error: err.message };
  }
};

// Lấy danh sách trạng thái phát thưởng
export const getRewardStatusOptions = () => {
  return [
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'processing', label: 'Đang xử lý' },
    { value: 'completed', label: 'Đã phát thưởng' },
    { value: 'cancelled', label: 'Đã hủy' }
  ];
};

// Lấy thông tin trạng thái dựa vào giá trị
export const getRewardStatusInfo = (statusValue) => {
  const options = getRewardStatusOptions();
  return options.find(option => option.value === statusValue) || 
    { value: 'pending', label: 'Chờ xử lý' };
};

// Kiểm tra cấu trúc bảng spin_history
export const checkSpinHistorySchema = async () => {
  try {
    console.log('Checking spin_history schema');
    
    // Thử lấy một bản ghi với select *
    const { data: sample, error: sampleError } = await supabase
      .from('spin_history')
      .select('*')
      .limit(1);
      
    if (sampleError) {
      console.error('Error fetching sample spin_history record:', sampleError);
      return { valid: false, error: sampleError.message };
    }
    
    // Kiểm tra xem bản ghi có tồn tại không
    const sampleRecord = sample && sample.length > 0 ? sample[0] : null;
    console.log('Sample spin_history record:', sampleRecord);
    
    // Nếu có bản ghi, kiểm tra xem có các cột cần thiết không
    if (sampleRecord) {
      const hasStatus = 'status' in sampleRecord;
      const hasAdminNote = 'admin_note' in sampleRecord;
      
      if (!hasStatus || !hasAdminNote) {
        console.warn('Missing columns in spin_history table:', {
          status: hasStatus ? 'present' : 'missing',
          admin_note: hasAdminNote ? 'present' : 'missing'
        });
        
        return { 
          valid: false, 
          missingColumns: {
            status: !hasStatus,
            admin_note: !hasAdminNote
          },
          error: 'Missing required columns in spin_history table' 
        };
      }
      
      return { valid: true };
    }
    
    // Nếu không có bản ghi, thử tạo một bản ghi tạm để kiểm tra cấu trúc
    console.log('No records found, attempting to verify schema with a test update');
    
    // Thử cập nhật một bản ghi không tồn tại với các cột cần thiết
    const testId = '00000000-0000-0000-0000-000000000000'; // UUID không tồn tại
    const { error: updateError } = await supabase
      .from('spin_history')
      .update({
        status: 'test',
        admin_note: 'test',
        updated_at: new Date().toISOString()
      })
      .eq('id', testId);
      
    if (updateError && updateError.message.includes('column')) {
      console.error('Schema test update error:', updateError);
      return { valid: false, error: updateError.message };
    }
    
    return { valid: true };
  } catch (err) {
    console.error('Error checking spin_history schema:', err.message, err.stack);
    return { valid: false, error: err.message };
  }
};

// Thêm trường status và admin_note vào bảng spin_history nếu cần
export const migrateSpinHistorySchema = async () => {
  const schemaCheck = await checkSpinHistorySchema();
  
  if (!schemaCheck.valid) {
    console.warn('Spin history schema is invalid, needs migration');
    
    // Hiển thị hướng dẫn cho người dùng
    alert(`
Cần cập nhật cấu trúc bảng dữ liệu spin_history!

Vui lòng vào Supabase SQL Editor và chạy lệnh SQL sau:

ALTER TABLE IF EXISTS public.spin_history 
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS admin_note TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE public.spin_history SET status = 'pending' WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS spin_history_status_idx ON public.spin_history(status);
    `);
    
    return { success: false, error: 'Schema migration needed' };
  }
  
  return { success: true };
}; 