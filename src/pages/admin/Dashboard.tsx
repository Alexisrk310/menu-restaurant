import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        dishesCount: 0,
        categoriesCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [dishes, categories] = await Promise.all([
                    api.dishes.list(),
                    api.categories.list()
                ]);
                setStats({
                    dishesCount: dishes?.length || 0,
                    categoriesCount: categories?.length || 0
                });
            } catch (error) {
                console.error("Error loading stats", error);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-display font-bold text-charcoal">Panel Principal</h2>
                <div className="text-sm text-slate-500">
                    Resumen del día
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-pastel-blue/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
                    <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider relative z-10">Total Platos</h3>
                    <p className="text-4xl font-display font-bold text-charcoal mt-2 relative z-10">
                        {loading ? '-' : stats.dishesCount}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-pastel-pink/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
                    <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider relative z-10">Categorías</h3>
                    <p className="text-4xl font-display font-bold text-charcoal mt-2 relative z-10">
                        {loading ? '-' : stats.categoriesCount}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-pastel-orange/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
                    <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider relative z-10">Estado del Sistema</h3>
                    <div className="mt-3 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-charcoal font-medium">Operativo</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-charcoal mb-4">Acciones Rápidas</h3>
                <div className="flex flex-wrap gap-4">
                    <Button onClick={() => navigate('/admin/dishes')} variant="secondary" className="flex items-center gap-2">
                        <Plus size={18} /> Nuevo Plato
                    </Button>
                    <Button onClick={() => navigate('/admin/categories')} variant="secondary" className="flex items-center gap-2">
                        <Plus size={18} /> Nueva Categoría
                    </Button>
                </div>
            </div>
        </div>
    );
}
