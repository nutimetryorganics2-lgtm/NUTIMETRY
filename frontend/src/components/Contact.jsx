import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Phone, Send, MapPin, 
  ShieldCheck, MessageSquare, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { contactService } from '../services/api';

const Contact = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: ''
  });

  const representatives = [
    { 
      id: 'ap', 
      title: 'AP Rep', 
      name: 'Representative Name AP', 
      phone: '9121337792',
      color: 'bg-accent'
    },
    { 
      id: 'tg', 
      title: 'TG Rep', 
      name: 'Representative Name TG', 
      phone: '9121337791',
      color: 'bg-primary'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await contactService.sendEnquiry({
        name: formData.name,
        phone: formData.phone,
        message: formData.message
      });
      toast.success(t('Enquiry Sent Successfully'));
      setFormData({ name: '', phone: '', message: '' });
    } catch (error) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="section-spacing bg-[#f8fafc]">
      <div className="container-max">
        <div className="grid lg:grid-cols-2 gap-20 items-start">
          
          <div className="space-y-16">
            <div>
              <h2 className="mb-8">{t('Get in touch')}</h2>
              <p className="text-[1.25rem] text-slate-500 font-medium">
                {t('Join the NutimetryOrganics broiler network')}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              {representatives.map((rep) => (
                <div key={rep.id} className="premium-luxury-card group !p-8">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-8 transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 ${rep.color} shadow-lg`}>
                    <User size={24} />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3">
                    {t(rep.title)}
                  </h4>
                  <h3 className="text-xl font-bold text-primary mb-8">{t(rep.name)}</h3>
                  <a 
                    href={`tel:91${rep.phone}`}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-slate-50 hover:bg-primary hover:text-white rounded-full transition-all duration-500 font-bold text-[13px] tracking-wide"
                  >
                    <Phone size={16} /> {t('Call Representative')}
                  </a>
                </div>
              ))}
            </div>

            <div className="premium-luxury-card !p-8 border-l-4 border-l-accent">
               <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{t('Address Header')}</h4>
                    <p className="text-sm font-bold text-primary leading-relaxed m-0">
                      {t('Address Body')}
                    </p>
                  </div>
               </div>
            </div>
          </div>

          <div className="premium-luxury-card !p-12">
            <div className="flex items-center gap-4 mb-12">
               <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white">
                  <MessageSquare size={24} />
               </div>
               <div>
                  <h3 className="mb-1">{t('Send a Message')}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                     <ShieldCheck size={12} className="text-accent" /> Secure Communication
                  </div>
               </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-4">{t('Name')}</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  className="premium-input-luxury"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-4">{t('Phone')}</label>
                <input
                  type="tel"
                  required
                  placeholder="Enter 10-digit number"
                  className="premium-input-luxury"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-4">{t('Notes')}</label>
                <textarea
                  rows="4"
                  placeholder="How can we help your farm?"
                  className="premium-input-luxury resize-none"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-luxury w-full !py-6 text-lg group"
              >
                {loading ? '...' : t('Submit')}
                <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Contact;
