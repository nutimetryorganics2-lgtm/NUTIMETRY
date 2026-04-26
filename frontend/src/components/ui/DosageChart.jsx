import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Calendar, Gauge, Info } from 'lucide-react';

const DosageChart = () => {
  const { t } = useTranslation();
  
  const data = [
    { age: "0-14 Days", dosage: "3g", phase: "Starter", notes: "Supports immunity" },
    { age: "15-28 Days", dosage: "5g", phase: "Grower", notes: "Optimizes FCR" },
    { age: "29-42 Days", dosage: "7g", phase: "Finisher", notes: "Enhances weight" }
  ];

  return (
    <div className="mt-12">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-3xl border border-gray-100 bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-primary text-white">
              <th className="px-8 py-5 font-bold uppercase tracking-wider text-sm">{t('Age (Days)')}</th>
              <th className="px-8 py-5 font-bold uppercase tracking-wider text-sm">{t('Phase')}</th>
              <th className="px-8 py-5 font-bold uppercase tracking-wider text-sm">{t('Dosage / kg feed')}</th>
              <th className="px-8 py-5 font-bold uppercase tracking-wider text-sm">{t('Objective')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-6 font-semibold text-gray-700">{t(row.age)}</td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold uppercase">
                    {t(row.phase)}
                  </span>
                </td>
                <td className="px-8 py-6 font-bold text-primary">{row.dosage}</td>
                <td className="px-8 py-6 text-gray-500 italic">{t(row.notes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Swipeable Cards */}
      <div className="md:hidden flex gap-4 overflow-x-auto pb-8 snap-x no-scrollbar">
        {data.map((row, i) => (
          <motion.div 
            key={i}
            className="min-w-[280px] snap-center p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm"
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-primary/5 text-primary rounded-2xl">
                <Calendar size={20} />
              </div>
              <span className="px-4 py-1 bg-accent text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
                {t(row.phase)}
              </span>
            </div>
            
            <div className="mb-6">
              <span className="block text-gray-400 text-xs uppercase tracking-widest mb-1">{t('Age Group')}</span>
              <span className="text-2xl font-bold text-primary">{t(row.age)}</span>
            </div>

            <div className="p-6 bg-background rounded-2xl mb-6">
              <span className="block text-gray-400 text-xs uppercase tracking-widest mb-2">{t('Recommended Dosage')}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">{row.dosage}</span>
                <span className="text-gray-400 text-sm">/ kg {t('feed')}</span>
              </div>
            </div>

            <div className="flex gap-3 text-gray-500 text-sm">
              <Info size={16} className="shrink-0 text-accent" />
              <p className="italic">{t(row.notes)}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DosageChart;
