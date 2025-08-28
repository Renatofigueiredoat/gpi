
import React from 'react';

const Logo = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 100 100" 
    className={className} 
    aria-label="Logo do Guia de Prescrição Inteligente"
  >
    <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
      {/* Círculo externo */}
      <circle cx="50" cy="50" r="45" />
      
      {/* Estetoscópio formando um "G" e um coração/cruz */}
      <path d="M75 50a25 25 0 01-50 0" />
      <path d="M25 50V35" />
      <path d="M25 35a10 10 0 1110-10" />
      
      {/* Cruz médica no centro */}
      <path d="M50 42v16" />
      <path d="M42 50h16" />
    </g>
  </svg>
);

export default Logo;
