import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import AdBanner from './AdBanner';

// Hiển thị tất cả banner quảng cáo active, phân theo vị trí
const ActiveAdBanners = ({ position = 'top', style = {} }) => {
  const [adOrders, setAdOrders] = useState([]);
  const [systemBanners, setSystemBanners] = useState([]);

  // Function để cập nhật status của các đơn hàng đã hết hạn
  const updateExpiredOrders = async () => {
    const now = new Date().toISOString();
    
    try {
      const { data: expiredOrders, error } = await supabase
        .from('ad_orders')
        .update({ status: 'expired' })
        .eq('status', 'active')
        .lt('end_time', now)
        .select();
        
      if (error) {
        console.error('Error updating expired orders:', error);
      } else if (expiredOrders && expiredOrders.length > 0) {
        console.log('Updated expired orders:', expiredOrders);
      }
    } catch (err) {
      console.error('Error in updateExpiredOrders:', err);
    }
  };

  useEffect(() => {
    const fetchActiveAds = async () => {
      const now = new Date();
      const nowISO = now.toISOString();
      console.log('🔍 Checking ads at time:', nowISO);
      
      // Trước tiên, cập nhật status của các đơn hàng đã hết hạn
      await updateExpiredOrders();
      
      // Lấy TẤT CẢ đơn hàng active để debug
      const { data: allActiveOrders, error } = await supabase
        .from('ad_orders')
        .select('*, ad_packages(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching ad orders:', error);
        return;
      }
      
      console.log('📦 All active orders from DB:', allActiveOrders);
      
      // Kiểm tra từng đơn hàng một cách chi tiết
      const validAds = [];
      const invalidAds = [];
      
      allActiveOrders?.forEach(order => {
        const startTime = order.start_time ? new Date(order.start_time) : null;
        const endTime = order.end_time ? new Date(order.end_time) : null;
        
        console.log(`\n🔍 Checking order ${order.id}:`);
        console.log('  - Package:', order.ad_packages?.name);
        console.log('  - Position:', order.ad_packages?.position);
        console.log('  - Start time:', startTime ? startTime.toISOString() : 'NULL');
        console.log('  - End time:', endTime ? endTime.toISOString() : 'NULL');
        console.log('  - Current time:', nowISO);
        
        // Kiểm tra thời gian
        let isTimeValid = true;
        let timeReason = '';
        
        if (!startTime || !endTime) {
          isTimeValid = false;
          timeReason = 'Missing start_time or end_time';
        } else if (now < startTime) {
          isTimeValid = false;
          timeReason = 'Not started yet';
        } else if (now > endTime) {
          isTimeValid = false;
          timeReason = 'Already expired';
        } else {
          timeReason = 'Time is valid';
        }
        
        console.log(`  - Time check: ${isTimeValid ? '✅' : '❌'} (${timeReason})`);
        
        if (isTimeValid) {
          validAds.push(order);
          console.log('  - ✅ Added to valid ads');
        } else {
          invalidAds.push({ ...order, reason: timeReason });
          console.log('  - ❌ Rejected:', timeReason);
        }
      });
      
      console.log('\n📊 Summary:');
      console.log('  - Total active orders:', allActiveOrders?.length || 0);
      console.log('  - Valid ads:', validAds.length);
      console.log('  - Invalid ads:', invalidAds.length);
      
      if (invalidAds.length > 0) {
        console.log('\n❌ Invalid ads details:');
        invalidAds.forEach(ad => {
          console.log(`  - ${ad.id}: ${ad.reason}`);
        });
      }
      
      setAdOrders(validAds);
      
      // Lấy banner hệ thống
      const { data: sysData } = await supabase
        .from('system_banners')
        .select('*')
        .eq('active', true)
        .eq('position', position);
      setSystemBanners(sysData || []);
    };
    
    fetchActiveAds();
    
    // Refresh mỗi 30 giây thay vì 1 phút để test nhanh hơn
    const interval = setInterval(fetchActiveAds, 30000);
    return () => clearInterval(interval);
  }, [position]);

  // Ưu tiên banner hệ thống
  if (systemBanners.length > 0) {
    console.log(`🎯 Showing ${systemBanners.length} system banners for position: ${position}`);
    return (
      <div style={style}>
        {systemBanners.map(banner => (
          <AdBanner
            key={banner.id}
            image={banner.image_url}
            link={banner.link}
            alt={banner.alt || 'Banner hệ thống'}
            style={{ marginBottom: 16 }}
          />
        ))}
      </div>
    );
  }

  // Sau đó đến banner quảng cáo user
  const filtered = adOrders.filter(order => order.ad_packages?.position === position);
  
  console.log(`🎯 Filtered ads for position "${position}":`, filtered.length);
  console.log('📋 Filtered ads details:', filtered.map(ad => ({
    id: ad.id,
    package: ad.ad_packages?.name,
    position: ad.ad_packages?.position,
    banner_url: ad.banner_url
  })));
  
  if (filtered.length === 0) {
    console.log(`📺 Showing default banner for position: ${position}`);
    // Hiển thị banner mặc định nếu không có quảng cáo active
    return (
      <AdBanner
        image="/images/ad1.jpg"
        link="https://example.com"
        alt="Quảng cáo mặc định"
        style={{ marginBottom: 16, ...style }}
      />
    );
  }

  console.log(`🎉 Showing ${filtered.length} user ads for position: ${position}`);
  return (
    <div style={style}>
      {filtered.map(order => (
        <AdBanner
          key={order.id}
          image={order.banner_url}
          link={order.link}
          alt={order.ad_packages?.name}
          style={{ marginBottom: 16 }}
        />
      ))}
    </div>
  );
};

export default ActiveAdBanners; 