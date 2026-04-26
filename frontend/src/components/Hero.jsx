import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section id="home" className="relative min-h-[100vh] flex items-center pt-40 pb-24 overflow-hidden bg-white">
      {/* Immersive Background with Subtle Fade */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="w-full h-full"
        >
          <img 
            src="/modern_farm.png" 
            alt="Premium Poultry Farm" 
            className="w-full h-full object-cover luxury-image-muted"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/40 to-white" />
      </div>

      <div className="container-max relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-slate-50/80 backdrop-blur-md rounded-full border border-slate-100 mb-12 shadow-sm">
               <Sparkles size={16} className="text-accent animate-pulse" />
               <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.25em]">{t('HeroSubtitle')}</span>
            </div>
            
            <h1 className={`mb-10 text-luxury-gradient overflow-visible ${t('HeroTitle').includes('స్పిరులినా') ? 'max-w-5xl mx-auto' : ''}`}>
              {t('HeroTitle')}
            </h1>
            
            <p className="text-[1.35rem] text-slate-500 max-w-3xl mx-auto mb-16 font-medium leading-relaxed">
              {t('HeroDescription')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-luxury w-full sm:w-auto !py-5 !px-12 text-lg group"
              >
                {t('Order Now')}
                <ArrowRight size={22} className="transition-transform duration-500 group-hover:translate-x-2" />
              </button>
              <button 
                onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-luxury-outline w-full sm:w-auto !py-5 !px-12 text-lg"
              >
                {t('Explore Benefits')}
              </button>
            </div>

            <div className="mt-32 pt-20 border-t border-slate-100/80 flex flex-wrap justify-center gap-20">
               <div className="flex flex-col items-center">
                  <span className="text-5xl font-bold text-primary tracking-tighter">+8%</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mt-4">{t('avg. weight gain*')}</span>
               </div>
               <div className="flex flex-col items-center">
                  <span className="text-5xl font-bold text-primary tracking-tighter">-0.11</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mt-4">{t('FCR improvement*')}</span>
               </div>
               <div className="flex flex-col items-center">
                  <span className="text-5xl font-bold text-primary tracking-tighter">100%</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mt-4">{t('Natural Growth')}</span>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Ambient Visual Element */}
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/5 rounded-full blur-[120px] animate-float-slow" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-float-slow" style={{ animationDelay: '-4s' }} />
    </section>
  );
};

export default Hero;
