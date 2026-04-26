import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Plus, Minus } from 'lucide-react';

const FAQItem = ({ question, answer, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      className="border-b border-gray-100"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="text-lg md:text-xl font-semibold text-gray-800 group-hover:text-primary transition-colors pr-8">
          {t(question)}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={`p-2 rounded-full transition-colors ${isOpen ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'}`}
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-8 text-gray-600 leading-relaxed max-w-3xl">
              {t(answer)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQAccordion = ({ items = [] }) => {
  const { t } = useTranslation();
  
  // Default items if none provided
  const defaultItems = [
    {
      question: "Is NutimetryOrganics Spirulina organic?",
      answer: "Yes, our spirulina is grown using organic principles in controlled environments in India, ensuring zero heavy metal contamination and maximum purity for poultry consumption."
    },
    {
      question: "How does it improve FCR?",
      answer: "The high protein content (65%+) and essential amino acids in spirulina improve nutrient absorption and gut health, leading to better weight gain with less feed."
    },
    {
      question: "Can I use it for layer birds too?",
      answer: "While this specific dosage is optimized for broilers, spirulina is excellent for layers as it significantly improves yolk color and shell strength. Contact us for layer-specific dosage."
    },
    {
      question: "Does it change the taste of meat?",
      answer: "It actually enhances the quality. Farmers report 'sweeter' and firmer meat with a healthier appearance, much closer to traditional range-grown poultry."
    }
  ];

  const faqData = items.length > 0 ? items : defaultItems;

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-accent font-semibold tracking-widest uppercase text-sm">{t('Common Questions')}</span>
            <h2 className="text-4xl md:text-5xl mt-4 mb-6">{t('Straight answers from the field')}</h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="space-y-2"
          >
            {faqData.map((item, index) => (
              <FAQItem 
                key={index} 
                question={item.question} 
                answer={item.answer} 
                index={index} 
              />
            ))}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 p-8 bg-background rounded-3xl text-center"
          >
            <p className="text-gray-600 mb-6">{t('FAQIntro')}</p>
            <a 
              href="https://wa.me/919121337792" 
              className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:shadow-lg transition-all"
            >
              {t('Get in touch')}
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FAQAccordion;
