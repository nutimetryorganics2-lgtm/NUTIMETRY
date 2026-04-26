import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { orderService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, Truck, CheckCircle, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

const TrackOrder = () => {
  const { t } = useTranslation();
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Assuming normalized orderService has a tracking method
      const res = await orderService.getOrders(); // Placeholder logic if specific track endpoint isn't in api.js
      // In a real scenario, we'd call a specific track endpoint. 
      // For now, let's simulate or use the available service.
      const order = res.data.find(o => o.order_id === orderId && o.phone === phone);
      
      if (order) {
        setOrderData(order);
      } else {
        setError('No order found matching these credentials.');
        setOrderData(null);
      }
    } catch (err) {
      setError('System synchronization error. Please try again.');
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: 'Pending', icon: <Clock size={20} /> },
    { label: 'Processing', icon: <Package size={20} /> },
    { label: 'Dispatched', icon: <Truck size={20} /> },
    { label: 'Delivered', icon: <CheckCircle size={20} /> }
  ];

  const currentStep = steps.findIndex(s => s.label === orderData?.status) ?? -1;

  return (
    <div className="min-h-screen pt-40 pb-20 px-4 bg-[#FCFBF7]">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-12 md:p-20 rounded-[4rem] shadow-2xl border-none relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-12 opacity-5"><Search size={140} className="text-primary" /></div>
          
          <div className="relative z-10 mb-16">
            <h2 className="text-primary mb-4">{t('Track Order')}</h2>
            <p className="text-xl text-slate-500 font-bold">Monitor your broiler nutrition shipment in real-time.</p>
          </div>

          <form onSubmit={handleTrack} className="space-y-10 relative z-10">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">Order ID</label>
                <input 
                  type="text" 
                  value={orderId} 
                  onChange={e => setOrderId(e.target.value)} 
                  required 
                  placeholder="NMO-XXXXXX"
                  className="premium-input-luxury py-6 text-xl font-bold text-primary"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">{t('Phone')}</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  required 
                  placeholder="91XXXXXXXX"
                  className="premium-input-luxury py-6 text-xl font-bold text-primary"
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-luxury w-full py-8 text-2xl shadow-2xl uppercase tracking-widest flex items-center justify-center gap-6"
            >
              {loading ? (
                <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>{t('Track Movement')} <ArrowRight size={32} /></>
              )}
            </button>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-10 p-8 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 font-bold text-center text-lg"
              >
                {error}
              </motion.div>
            )}

            {orderData && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-20 space-y-16 relative z-10"
              >
                <div className="flex justify-between items-end border-b border-slate-100 pb-10">
                  <div>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-4">Current Status</span>
                    <h3 className="text-5xl font-black text-primary">{orderData.status}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-4">Estimated Arrival</span>
                    <p className="text-2xl font-black text-accent">Within 48 Hours</p>
                  </div>
                </div>

                <div className="relative pt-16 pb-6">
                  <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-100 -translate-y-1/2 rounded-full" />
                  <div 
                    className="absolute top-1/2 left-0 h-2 bg-primary -translate-y-1/2 rounded-full transition-all duration-1000" 
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                  />
                  
                  <div className="flex justify-between relative">
                    {steps.map((step, idx) => (
                      <div key={step.label} className="flex flex-col items-center">
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-700 border-4 ${idx <= currentStep ? 'bg-primary text-white border-white shadow-2xl scale-110' : 'bg-white text-slate-200 border-slate-50 shadow-md'}`}>
                          {React.cloneElement(step.icon, { size: 28 })}
                        </div>
                        <span className={`mt-6 text-[11px] font-black uppercase tracking-widest ${idx <= currentStep ? 'text-primary' : 'text-slate-300'}`}>
                          {t(step.label)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 flex items-center gap-8">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-primary shadow-xl border border-slate-100">
                    <ShieldCheck size={40} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-primary mb-1">Nutimetry Secure Logistics</h4>
                    <p className="text-slate-500 font-bold text-lg">Your batch is monitored by our regional quality control team.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default TrackOrder;
