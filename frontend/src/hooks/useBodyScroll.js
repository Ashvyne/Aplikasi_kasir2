import { useLayoutEffect } from 'react';

const preventDefault = (e) => {
  e.preventDefault();
};

export const useBodyScroll = (scroll = false) => {
  useLayoutEffect(() => {
    if (!scroll) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('wheel', preventDefault, { passive: false });
      document.addEventListener('touchmove', preventDefault, { passive: false });
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('wheel', preventDefault);
      document.removeEventListener('touchmove', preventDefault);
    };
  }, [scroll]);
};
