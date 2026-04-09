import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteTransition({ children }) {
  const location = useLocation();

  // Scroll to top smoothly when route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="animate-page-enter">
      {children}
    </div>
  );
}
