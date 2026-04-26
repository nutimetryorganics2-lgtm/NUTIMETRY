import React from 'react';
import logoImg from '../assets/logo.png';

const BrandLogo = ({ size = "md", className = "" }) => {
  const sizes = {
    sm: "h-8",
    md: "h-12 md:h-14", // Optimized for better Navbar fit
    lg: "h-20 md:h-24",
    xl: "h-32 md:h-40",
    full: "w-full"
  };

  return (
    <div className={`${sizes[size]} flex items-center justify-start transition-all duration-700 ${className}`}>
      <img 
        src={logoImg} 
        alt="Nutimetry Organics" 
        className="h-full w-auto object-contain pointer-events-none"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }}
      />
    </div>
  );
};

export default BrandLogo;
