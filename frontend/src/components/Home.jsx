import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  TrendingUp, ShieldCheck, Heart, Star, Zap, Shield, Sparkles 
} from 'lucide-react';

import Hero from './Hero';
import Benefits from './Benefits';
import DosageCalculator from './DosageCalculator';
import ProductSection from './ProductSection';
import ResearchCards from './ResearchCards';
import FAQ from './FAQ';
import Contact from './Contact';

const Home = ({ onAddToCart }) => {
  const { t } = useTranslation();

  return (
    <main>
      <section id="home"><Hero /></section>
      <Benefits />
      <section id="dosage"><DosageCalculator /></section>
      <section id="products"><ProductSection onAddToCart={onAddToCart} /></section>
      <section id="research"><ResearchCards /></section>
      <FAQ />
      <section id="contact"><Contact /></section>
    </main>
  );
};

export default Home;
