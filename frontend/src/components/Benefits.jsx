import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  TrendingUp, ShieldCheck, Heart, Zap, Sparkles, Scale
} from 'lucide-react';

const Benefits = () => {
  const { t } = useTranslation();

  const benefits = [
    { icon: <TrendingUp size={32} />, title: 'Benefit1Title', desc: 'Benefit1Desc', accent: 'text-accent' },
    { icon: <ShieldCheck size={32} />, title: 'Benefit2Title', desc: 'Benefit2Desc', accent: 'text-blue-500' },
    { icon: <Zap size={32} />, title: 'Benefit3Title', desc: 'Benefit3Desc', accent: 'text-yellow-500' },
    { icon: <Heart size={32} />, title: 'Benefit4Title', desc: 'Benefit4Desc', accent: 'text-rose-500' },
    { icon: <Scale size={32} />, title: 'Benefit5Title', desc: 'Benefit5Desc', accent: 'text-emerald-500' },
    { icon: <Sparkles size={32} />, title: 'Benefit6Title', desc: 'Benefit6Desc', accent: 'text-purple-500' },
  ];

  return (
    <section id="benefits" className="section-spacing bg-white">
      <div className="container-max">
        <div className="max-w-3xl mb-24">
          <h2 className="mb-8">
            {t('Why broiler farmers switch')}
          </h2>
          <p className="text-[1.25rem] text-slate-500 font-medium">
            {t('BenefitSubtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="group p-10 rounded-[32px] bg-[#f8fafc] border border-slate-100 hover:bg-white hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:-translate-y-2 transition-all duration-700"
            >
              <div className={`w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-700 ${benefit.accent}`}>
                {benefit.icon}
              </div>
              <h3 className="text-2xl font-bold text-primary mb-6 group-hover:text-accent transition-colors duration-500">
                {t(benefit.title)}
              </h3>
              <p className="text-[16px] leading-relaxed text-slate-500 font-medium m-0">
                {t(benefit.desc)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
