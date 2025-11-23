import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollManager = () => {
  const location = useLocation();

  useEffect(() => {
    // Không scroll tự động, giữ nguyên vị trí hiện tại
    // Nếu muốn scroll mượt, có thể bỏ comment dòng dưới
    // window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return null;
};
