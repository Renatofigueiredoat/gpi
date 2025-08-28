
import React from 'react';

const PillIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.37,6.88A6.25,6.25,0,0,0,6.88,12.37l6.5,6.5a6.25,6.25,0,0,0,5.49-9.58Z" />
    <path fillRule="evenodd" d="M12.37,6.88a6.25,6.25,0,0,1,5.49,9.58l-6.5-6.5a6.22,6.22,0,0,0-5.49-1,6.25,6.25,0,0,0,6.5,6.5Z" clipRule="evenodd" />
  </svg>
);

export default PillIcon;
