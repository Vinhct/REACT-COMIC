-- Migration để tự động cập nhật status của các đơn hàng quảng cáo đã hết hạn

-- Function để cập nhật status expired cho các đơn hàng đã hết hạn
CREATE OR REPLACE FUNCTION update_expired_ad_orders()
RETURNS void AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.ad_orders 
  SET status = 'expired'
  WHERE status = 'active' 
    AND end_time < NOW();
  
  -- Lấy số lượng rows đã được cập nhật
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Log số lượng đơn hàng đã được cập nhật
  RAISE NOTICE 'Updated % expired ad orders', updated_count;
END;
$$ LANGUAGE plpgsql;

-- Tạo extension pg_cron nếu chưa có (cần admin privileges)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule function để chạy mỗi phút
-- SELECT cron.schedule('update-expired-ads', '* * * * *', 'SELECT update_expired_ad_orders();');

-- Tạo trigger để tự động cập nhật khi có query
CREATE OR REPLACE FUNCTION trigger_update_expired_ads()
RETURNS TRIGGER AS $$
BEGIN
  -- Chạy function cập nhật expired orders
  PERFORM update_expired_ad_orders();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger khi có SELECT trên bảng ad_orders
-- CREATE TRIGGER auto_update_expired_ads
--   BEFORE SELECT ON public.ad_orders
--   FOR EACH STATEMENT
--   EXECUTE FUNCTION trigger_update_expired_ads();

-- Cập nhật ngay các đơn hàng đã hết hạn hiện tại
SELECT update_expired_ad_orders();

-- Thêm index để tối ưu hóa query
CREATE INDEX IF NOT EXISTS ad_orders_status_end_time_idx 
ON public.ad_orders(status, end_time) 
WHERE status = 'active';

-- Thêm comment
COMMENT ON FUNCTION update_expired_ad_orders() IS 'Function để tự động cập nhật status của các đơn hàng quảng cáo đã hết hạn'; 