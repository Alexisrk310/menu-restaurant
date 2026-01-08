import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { Clock, Tag } from 'lucide-react';
import { formatCurrency } from '../lib/format';

export default function PublicMenu() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeCategory, setActiveCategory] = useState('all');
    const [categories, setCategories] = useState<any[]>([]);
    const [dishes, setDishes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Config State
    const [isRestaurantOpen, setIsRestaurantOpen] = useState(true);
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [catsData, dishesData, settingsData] = await Promise.all([
                api.categories.list(),
                api.dishes.list(),
                api.settings.getAll()
            ]);

            // Handle Settings
            if (settingsData) {
                const isOpen = settingsData.find((s: any) => s.key === 'restaurant_open')?.value ?? true;
                const ann = settingsData.find((s: any) => s.key === 'global_announcement')?.value ?? '';
                setIsRestaurantOpen(isOpen);
                setAnnouncement(ann);
            }

            setCategories([{ id: 'all', name: 'Todos' }, ...catsData]);
            setDishes(dishesData);

            // Set active category from URL if present
            const catParam = searchParams.get('category');
            if (catParam) {
                setActiveCategory(catParam);
            }
        } catch (error) {
            console.error('Error loading menu:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateCategory = (id: string) => {
        setActiveCategory(id);
        if (id === 'all') {
            searchParams.delete('category');
        } else {
            searchParams.set('category', id);
        }
        setSearchParams(searchParams);
    }

    const filteredDishes = activeCategory === 'all'
        ? dishes
        : dishes.filter(d => d.category_id === activeCategory);

    const getCategoryName = (catId: string) => {
        const cat = categories.find(c => c.id === catId);
        return cat ? cat.name : 'Sin categoría';
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    if (loading) return (
        <div className="flex justify-center items-center py-32 h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-charcoal"></div>
        </div>
    );

    // Closed State
    if (!isRestaurantOpen) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-100"
                >
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                        <Clock size={40} />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-charcoal mb-2">Restaurante Cerrado</h1>
                    <p className="text-slate-500 mb-6">
                        En este momento no estamos tomando pedidos. Por favor, vuelve más tarde o revisa nuestro horario de atención.
                    </p>
                    {announcement && (
                        <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm font-medium border border-amber-100">
                            📢 {announcement}
                        </div>
                    )}
                </motion.div>
                <div className="text-slate-400 text-sm">
                    Admin: <a href="/admin" className="underline hover:text-slate-600">Iniciar Sesión</a>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 min-h-screen pb-20 relative">
            {/* Announcement Banner */}
            {/* Announcement Banner - Minimalist */}
            <AnimatePresence>
                {announcement && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 left-0 right-0 z-50 flex justify-center pointer-events-none"
                    >
                        <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm px-4 py-2 rounded-full flex items-center gap-2 text-sm text-charcoal max-w-sm pointer-events-auto">
                            <span className="w-2 h-2 rounded-full bg-pastel-orange animate-pulse"></span>
                            <span className="font-medium">{announcement}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="text-center space-y-4 pt-8 md:pt-12 px-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-pastel-orange/10 text-pastel-orange font-bold text-sm tracking-wide mb-4">
                        DELICIOSO & FRESCO
                    </span>
                    <h1 className="text-4xl md:text-6xl font-display font-black text-charcoal mb-4 tracking-tight">
                        Nuestro Menú
                    </h1>
                    <p className="text-slate-500 max-w-xl mx-auto text-lg leading-relaxed">
                        Explora una selección curada de platos preparados al momento con ingredientes de primera calidad.
                    </p>
                </motion.div>
            </header>

            {/* Category Filter */}
            <div className="sticky top-0 z-40 bg-cream/95 backdrop-blur-sm py-4 -mx-4 px-4 md:mx-0 md:px-0 transition-all">
                <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide justify-start md:justify-center">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => updateCategory(cat.id)}
                            className={`
                                relative px-6 py-2.5 rounded-full whitespace-nowrap transition-all duration-300 font-bold text-sm tracking-wide
                                ${activeCategory === cat.id
                                    ? 'bg-charcoal text-white shadow-xl shadow-charcoal/20 transform scale-105'
                                    : 'bg-white text-slate-500 hover:bg-pastel-pink/20 hover:text-charcoal hover:scale-105 border border-slate-100'}
                            `}
                        >
                            {cat.name}
                            {activeCategory === cat.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 rounded-full border-2 border-charcoal"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Grid */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-0"
                variants={container}
                initial="hidden"
                animate="show"
                key={activeCategory} // Reset animations on category change
            >
                <AnimatePresence mode="popLayout">
                    {filteredDishes.map(dish => (
                        <motion.div
                            key={dish.id}
                            variants={item}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileHover={{ y: -8, transition: { duration: 0.3 } }}
                            className="bg-white rounded-[2rem] overflow-hidden shadow-soft hover:shadow-2xl transition-shadow duration-300 group flex flex-col h-full border border-slate-100/50"
                        >
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src={dish.image_url}
                                    alt={dish.name}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

                                <div className="absolute top-4 left-4">
                                    <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-charcoal text-xs font-bold shadow-sm">
                                        <Tag size={12} className="text-pastel-blue" />
                                        {getCategoryName(dish.category_id)}
                                    </span>
                                </div>


                                <div className="absolute bottom-4 left-4 right-4 flex justify-end items-end">
                                    <span className="bg-white text-charcoal font-black px-4 py-2 rounded-2xl shadow-lg text-lg">
                                        {formatCurrency(dish.price)}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-display text-xl font-bold text-charcoal leading-tight group-hover:text-pastel-orange transition-colors">
                                        {dish.name}
                                    </h3>
                                </div>

                                <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
                                    {dish.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredDishes.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="col-span-full text-center py-20"
                    >
                        <div className="bg-white inline-block p-8 rounded-full shadow-sm mb-4">
                            <Clock size={48} className="text-slate-300" />
                        </div>
                        <p className="text-slate-400 text-lg">No hay platos disponibles en esta categoría.</p>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}

