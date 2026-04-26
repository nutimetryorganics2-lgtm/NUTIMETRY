import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';

const FAQItem = ({ title, content, isOpen, onClick }) => (
  <div className={`premium-luxury-card !p-0 overflow-hidden transition-all duration-700 ${isOpen ? 'ring-2 ring-accent/20' : ''}`}>
    <button 
      onClick={onClick}
      className="w-full p-10 flex items-center justify-between text-left group"
    >
      <h3 className={`text-xl font-bold transition-all duration-500 ${isOpen ? 'text-accent' : 'text-primary'}`}>
        {title}
      </h3>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-700 ${isOpen ? 'bg-accent border-accent text-white rotate-180' : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:bg-white group-hover:border-slate-400 group-hover:text-primary'}`}>
        <ChevronDown size={22} />
      </div>
    </button>
    
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="px-10 pb-10">
            <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100">
               <p className="text-[16px] leading-relaxed text-slate-600 font-medium mb-0">
                  {content}
               </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const FAQ = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    { title: 'Q1Title', content: 'Q1Ans' },
    { title: 'Q2Title', content: 'Q2Ans' },
    { title: 'Q3Title', content: 'Q3Ans' },
    { title: 'Q4Title', content: 'Q4Ans' },
    { title: 'Q5Title', content: 'Q5Ans' },
    { title: 'Q6Title', content: 'Q6Ans' },
  ];

  return (
    <section id="faq" className="section-spacing bg-white">
      <div className="container-max">
        <div className="flex flex-col items-center text-center mb-24">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-accent mb-10">
            <MessageCircleQuestion size={32} />
          </div>
          <h2 className="mb-6">
            {t('FAQHeader')}
          </h2>
          <p className="text-[1.25rem] text-slate-500 font-medium max-w-2xl">
            {t('FAQSubtitle')}
          </p>
        </div>

        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {faqs.map((faq, idx) => (
            <FAQItem 
              key={idx}
              title={t(faq.title)}
              content={t(faq.content)}
              isOpen={openIndex === idx}
              onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
