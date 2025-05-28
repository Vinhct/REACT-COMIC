import { useState, useEffect, useCallback } from 'react';

// VietQR.io configuration
const VIETQR_CONFIG = {
  bankId: 'mbbank', // Thay đổi theo ngân hàng của bạn
  accountNo: '0560139533009', // Thay bằng số tài khoản thật
  accountName: 'Ha%20Dinh%20Vinh', // Tên tài khoản (URL encoded)
  template: 'compact2' // compact, compact2, qr_only, print
};

/**
 * Hook để tạo và quản lý VietQR codes
 */
const useVietQR = () => {
  const [banks, setBanks] = useState([
    { id: 'vietinbank', name: 'VietinBank' },
    { id: 'vietcombank', name: 'Vietcombank' },
    { id: 'techcombank', name: 'Techcombank' },
    { id: 'bidv', name: 'BIDV' },
    { id: 'agribank', name: 'Agribank' },
    { id: 'mbbank', name: 'MB Bank' },
    { id: 'acb', name: 'ACB' },
    { id: 'vpbank', name: 'VPBank' },
    { id: 'sacombank', name: 'Sacombank' },
    { id: 'eximbank', name: 'Eximbank' }
  ]);

  // Tạo VietQR URL với error handling - sử dụng useCallback
  const generateVietQRUrl = useCallback((amount, description, bankId = VIETQR_CONFIG.bankId, template = VIETQR_CONFIG.template) => {
    try {
      if (!amount || !description) {
        console.warn('VietQR: Missing amount or description');
        return '';
      }
      
      // Validate amount
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        console.warn('VietQR: Invalid amount:', amount);
        return '';
      }
      
      // Clean and encode description
      const cleanDescription = description.trim().substring(0, 25); // VietQR limit
      const encodedDescription = encodeURIComponent(cleanDescription);
      
      // Build URL with all required parameters
      const baseUrl = `https://img.vietqr.io/image/${bankId}-${VIETQR_CONFIG.accountNo}-${template}.jpg`;
      const params = new URLSearchParams({
        amount: numAmount.toString(),
        addInfo: cleanDescription,
        accountName: VIETQR_CONFIG.accountName.replace(/%20/g, ' ')
      });
      
      const finalUrl = `${baseUrl}?${params.toString()}`;
      console.log('Generated VietQR URL:', finalUrl);
      
      return finalUrl;
    } catch (error) {
      console.error('Error generating VietQR URL:', error);
      return '';
    }
  }, []);

  // Tạo deeplink với error handling - sử dụng useCallback
  const generateDeeplink = useCallback((amount, description, bankId = VIETQR_CONFIG.bankId) => {
    try {
      if (!amount || !description) return '#';
      
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) return '#';
      
      const cleanDescription = description.trim().substring(0, 25);
      const encodedDescription = encodeURIComponent(cleanDescription);
      
      return `https://api.vietqr.io/deeplink/${bankId}/${VIETQR_CONFIG.accountNo}/${numAmount}/${encodedDescription}`;
    } catch (error) {
      console.error('Error generating deeplink:', error);
      return '#';
    }
  }, []);

  // Tạo quicklink với error handling - sử dụng useCallback
  const generateQuicklink = useCallback((amount, description, bankId = VIETQR_CONFIG.bankId) => {
    try {
      if (!amount || !description) return '#';
      
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) return '#';
      
      const cleanDescription = description.trim().substring(0, 25);
      const encodedDescription = encodeURIComponent(cleanDescription);
      
      return `https://vietqr.io/quicklink/?bank=${bankId}&acc=${VIETQR_CONFIG.accountNo}&amount=${numAmount}&memo=${encodedDescription}`;
    } catch (error) {
      console.error('Error generating quicklink:', error);
      return '#';
    }
  }, []);

  // Lấy danh sách ngân hàng từ VietQR.io API (optional) - sử dụng useCallback
  const fetchBanks = useCallback(async () => {
    try {
      const response = await fetch('https://api.vietqr.io/v2/banks');
      const data = await response.json();
      
      if (data.code === '00' && data.data) {
        const formattedBanks = data.data.map(bank => ({
          id: bank.bin,
          name: bank.name,
          shortName: bank.shortName,
          logo: bank.logo
        }));
        setBanks(formattedBanks);
      }
    } catch (error) {
      console.warn('Không thể lấy danh sách ngân hàng từ VietQR.io API:', error);
      // Sử dụng danh sách mặc định
    }
  }, []);

  // Validate account number (optional) - sử dụng useCallback
  const validateAccount = useCallback(async (bankId, accountNo) => {
    try {
      const response = await fetch(`https://api.vietqr.io/v2/lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bin: bankId,
          accountNumber: accountNo
        })
      });
      
      const data = await response.json();
      return data.code === '00' ? data.data : null;
    } catch (error) {
      console.warn('Không thể validate tài khoản:', error);
      return null;
    }
  }, []);

  // Tạo order ID ngắn gọn - sử dụng useCallback
  const generateOrderId = useCallback((prefix = 'AD', userId = '') => {
    const userPart = userId.slice(0, 6) || 'USER';
    const timePart = Date.now().toString().slice(-6);
    return `${prefix}${userPart}${timePart}`;
  }, []);

  return {
    banks,
    config: VIETQR_CONFIG,
    generateVietQRUrl,
    generateDeeplink,
    generateQuicklink,
    generateOrderId,
    fetchBanks,
    validateAccount
  };
};

export default useVietQR; 