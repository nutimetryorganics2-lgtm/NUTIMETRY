import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Zap, TrendingUp, Sparkles, Droplets, ShieldCheck
} from 'lucide-react';

const DosageCalculator = () => {
  const { t } = useTranslation();

  const stages = [
    { 
      id: 'starter', 
      title: 'Starter', 
      note: 'StarterNote', 
      icon: <Zap size={24} />, 
      color: 'bg-accent' 
    },
    { 
      id: 'grower', 
      title: 'Grower', 
      note: 'GrowerNote', 
      icon: <TrendingUp size={24} />, 
      color: 'bg-primary' 
    },
    { 
      id: 'finisher', 
      title: 'Finisher', 
      note: 'FinisherNote', 
      icon: <Sparkles size={24} />, 
      color: 'bg-[#1e293b]' 
    },
    { 
      id: 'water', 
      title: 'WaterLine', 
      note: 'WaterNote', 
      icon: <Droplets size={24} />, 
      color: 'bg-blue-500' 
    }
  ];

  return (
    <section id="dosage" className="section-spacing bg-white">
      <div className="container-max">
        <div className="flex flex-col items-center text-center mb-24">
          <h2 className="mb-8">{t('Dosage Intelligence')}</h2>
          <p className="text-[1.25rem] text-slate-500 font-medium max-w-2xl">
            {t('DosageSubtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stages.map((stage, idx) => (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="premium-luxury-card group !p-10 border-b-4 border-b-transparent hover:border-b-accent"
            >
              <div className={`w-14 h-14 rounded-2xl ${stage.color} text-white flex items-center justify-center mb-10 transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 shadow-lg`}>
                {stage.icon}
              </div>
              <h3 className="text-2xl font-bold text-primary mb-6">{t(stage.title)}</h3>
              <p className="text-[15px] leading-relaxed text-slate-500 font-medium m-0">
                {t(stage.note)}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-10">
           <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-accent">
                 <ShieldCheck size={28} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-primary mb-1">Precision Guaranteed</h4>
                <p className="text-sm text-slate-500 font-medium m-0">Our protocols are optimized for Vencobb, Hubbard, and Ross broiler breeds.</p>
              </div>
           </div>
           <button className="btn-luxury-outline whitespace-nowrap">
              Download Full Protocol
           </button>
        </div>
      </div>
    </section>
  );
};

export default DosageCalculator;
