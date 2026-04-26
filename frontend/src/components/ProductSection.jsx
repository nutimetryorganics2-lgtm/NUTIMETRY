import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShoppingCart, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '../store/useStore';
import { productService } from '../services/api';

const SkeletonSection = ({ count }) => (
  <div className="grid md:grid-cols-2 gap-12">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="bg-slate-50 rounded-[24px] h-[320px] animate-pulse" />
    ))}
  </div>
);

const ProductSection = ({ onAddToCart }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productService.getProducts();
        // Standardized response from api.js returns res.data as the products array
        if (Array.isArray(res.data)) {
          setProducts(res.data);
        } else {
          console.error("Products response is not an array", res);
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <section id="products" className="section-spacing bg-[#f8fafc]">
      <div className="container-max">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="max-w-2xl">
            <h2 className="mb-6">
              {t('Premium Catalog')}
            </h2>
            <p className="text-xl text-slate-500 font-medium">
              {t('Nutritional Intelligence')}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-white rounded-full border border-slate-100 shadow-sm text-xs font-bold text-slate-400 uppercase tracking-widest">
            <CheckCircle2 size={16} className="text-accent" /> {t('Production Certified')}
          </div>
        </div>

        {loading ? (
          <SkeletonSection count={2} />
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-medium border-2 border-dashed border-slate-100 rounded-[4rem] bg-white">
             {t('No Products Available')}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-12">
            {products.map((product, idx) => (
              <motion.div 
                key={product._id || product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: idx * 0.2 }}
                className="premium-luxury-card group flex flex-col lg:flex-row gap-10"
              >
                <div className="w-full lg:w-48 h-48 lg:h-auto shrink-0 overflow-hidden rounded-[20px] bg-slate-50 relative">
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover luxury-image-muted group-hover:scale-110 group-hover:opacity-100 transition-all duration-1000 animate-float"
                    onError={(e) => { e.target.src = '/spirulina_macro.png'; }}
                  />
                </div>
                
                <div className="flex flex-col flex-1 justify-between py-2">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-bold text-primary group-hover:text-accent transition-colors duration-500">{t(product.name)}</h3>
                      <div className="flex flex-col items-end">
                         <span className="text-2xl font-bold text-primary">₹{product.price?.toLocaleString()}</span>
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t('Incl. Taxes')}</span>
                      </div>
                    </div>
                    
                    <div className="mb-6 flex items-center gap-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${product.stock > 0 ? 'bg-accent/10 text-accent' : 'bg-slate-100 text-slate-400'}`}>
                        {product.stock > 0 ? t('In Stock') : t('Out of Stock')}
                      </span>
                      <span className="w-1 h-1 bg-slate-200 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('Biotech Grade')}</span>
                    </div>

                    <p className="text-[15px] leading-relaxed text-slate-500 mb-10 line-clamp-3 font-medium">
                      {t(product.description)}
                    </p>
                  </div>
 
                  <button 
                    onClick={() => onAddToCart(product)}
                    disabled={product.stock <= 0}
                    className="btn-luxury w-full lg:w-auto group/btn"
                  >
                    <ShoppingCart size={18} className="group-hover/btn:rotate-12 transition-transform" />
                    {t('Add to Bundle')}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductSection;
