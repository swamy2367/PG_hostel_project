import React, { useEffect, useRef } from 'react';

// Wraps pages with fade-in animation and consistent layout
export default function PageWrapper({ children, className = '', animate = true }) {
  const ref = useRef(null);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      ref={ref}
      className={`page-wrapper ${className}`}
      style={{
        minHeight: 'calc(100vh - var(--header-height))',
        animation: animate ? 'fadeInUp 0.4s cubic-bezier(0, 0, 0.2, 1) both' : 'none',
      }}
    >
      {children}
    </div>
  );
}

// Section wrapper with max-width container
export function Section({ children, className = '', style = {} }) {
  return (
    <section className={`section ${className}`} style={style}>
      <div className="container">
        {children}
      </div>
    </section>
  );
}
