import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FileText, ArrowUpRight, GraduationCap } from 'lucide-react';

const ResearchCards = () => {
  const { t } = useTranslation();

  const researchData = [
    { id: 'icar', institution: 'ICAR', result: 'ICARRes', link: 'ICARLink' },
    { id: 'tanuvas', institution: 'TANUVAS', result: 'TANUVASRes', link: 'TANUVASLink' },
    { id: 'gadvasu', institution: 'GADVASU', result: 'GADVASURes', link: 'GADVASULink' },
    { id: 'kvasu', institution: 'KVASU', result: 'KVASURes', link: 'KVASULink' },
  ];

  return (
    <section id="research" className="section-spacing bg-[#f8fafc]">
      <div className="container-max">
        <div className="flex flex-col items-center text-center mb-24">
          <h2 className="mb-8">{t('Scientific Validation')}</h2>
          <p className="text-[1.25rem] text-slate-500 font-medium max-w-3xl">
            {t('ResearchSubtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {researchData.map((study, idx) => (
            <motion.div
              key={study.id}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: idx * 0.15 }}
              className="premium-luxury-card group flex flex-col gap-10 cursor-pointer"
              onClick={() => window.open(t(study.link), '_blank')}
            >
              <div className="flex justify-between items-start">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-700">
                  <GraduationCap size={32} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                   Certified Study
                </span>
              </div>
              
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-primary mb-6">
                  {t(study.institution)}
                </h3>
                <div className="p-8 bg-slate-50/50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-accent/20 transition-all duration-700">
                   <p className="text-[17px] leading-relaxed text-slate-600 font-medium mb-0 italic">
                      "{t(study.result)}"
                   </p>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-400">
                  <FileText size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest">{t('Research · India')}</span>
                </div>
                <button 
                  className="text-accent text-[12px] font-black uppercase tracking-widest hover:translate-x-2 transition-transform duration-500 flex items-center gap-2"
                >
                  {t('View Source')} <ArrowUpRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResearchCards;
