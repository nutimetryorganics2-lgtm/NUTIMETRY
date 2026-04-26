import React from 'react';
import { motion } from 'framer-motion';

const SkeletonCard = () => {
  return (
    <div className="premium-card p-8 space-y-6 relative">
      <div className="space-y-6">
        <div className="aspect-[16/10] bg-slate-50 rounded-xl animate-pulse" />
        <div className="space-y-3">
          <div className="w-2/3 h-8 bg-slate-100 rounded-lg animate-pulse" />
          <div className="w-1/3 h-6 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="w-full h-4 bg-slate-50 rounded-lg animate-pulse" />
          <div className="w-5/6 h-4 bg-slate-50 rounded-lg animate-pulse" />
        </div>
        <div className="pt-4">
          <div className="w-full h-12 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonSection = ({ count = 3 }) => {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export default SkeletonCard;
