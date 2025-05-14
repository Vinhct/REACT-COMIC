import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import AdBanner from './AdBanner';

// Hiển thị tất cả banner quảng cáo active, phân theo vị trí
const ActiveAdBanners = ({ position = 'top', style = {} }) => {
  const [adOrders, setAdOrders] = useState([]);
  const [systemBanners, setSystemBanners] = useState([]);

  useEffect(() => {
    const fetchActiveAds = async () => {
      const now = new Date().toISOString();
      // Lấy banner quảng cáo user
      const { data: adData } = await supabase
        .from('ad_orders')
        .select('*, ad_packages(*)')
        .eq('status', 'active')
        .lte('start_time', now)
        .gte('end_time', now);
      setAdOrders(adData || []);
      // Lấy banner hệ thống
      const { data: sysData } = await supabase
        .from('system_banners')
        .select('*')
        .eq('active', true)
        .eq('position', position);
      setSystemBanners(sysData || []);
    };
    fetchActiveAds();
  }, [position]);

  // Ưu tiên banner hệ thống
  if (systemBanners.length > 0) {
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
  if (filtered.length === 0) {
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