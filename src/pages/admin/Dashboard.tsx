import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { UserPlus, QrCode, Tag, Clock, Megaphone, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { QRCodeSVG } from 'qrcode.react';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [stats, setStats] = useState({
        dishesCount: 0,
        categoriesCount: 0
    });
    const [latestDishes, setLatestDishes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // const { role } = useAuth(); // Check role

    // Redirect Waiters (Handled by ProtectedRoute)
    // useEffect(() => {
    //     if (role === 'waiter') {
    //         navigate('/admin/dishes'); 
    //     }
    // }, [role, navigate]);

    // Settings State
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [config, setConfig] = useState({
        isOpen: true,
        announcement: ''
    });

    // QR State
    const [isQRExpanded, setIsQRExpanded] = useState(false);



    const loadDashboardData = async () => {
        try {
            const [dishes, categories, settingsData] = await Promise.all([
                api.dishes.list(true), // Include archived for stats
                api.categories.list(true),
                api.settings.getAll()
            ]);

            setStats({
                dishesCount: dishes?.length || 0,
                categoriesCount: categories?.length || 0
            });

            // Get last 5 dishes
            setLatestDishes(dishes?.slice(0, 5) || []);

            // Parse settings
            if (settingsData) {
                const isOpen = settingsData.find((s: any) => s.key === 'restaurant_open')?.value ?? true;
                const announcement = settingsData.find((s: any) => s.key === 'global_announcement')?.value ?? '';
                setConfig({ isOpen, announcement });
            }

        } catch (error) {
            console.error("Error loading stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    useRefreshOnFocus(loadDashboardData);

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await Promise.all([
                api.settings.set('restaurant_open', config.isOpen),
                api.settings.set('global_announcement', config.announcement)
            ]);
            addToast('Configuración guardada', 'success');
            setIsConfigModalOpen(false);
        } catch (error) {
            addToast('Error al guardar configuración', 'error');
        }
    };

    const downloadQR = () => {
        const svg = document.getElementById("qr-code-download");
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = "menu-qr.png";
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-display font-bold text-charcoal">Panel Principal</h2>
                    <p className="text-slate-500">Resumen y Accesos Rápidos</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {config.isOpen ? 'ABIERTO' : 'CERRADO'}
                    </span>
                    <Button onClick={() => setIsConfigModalOpen(true)} variant="secondary" className="flex items-center gap-2 text-sm">
                        <Clock size={16} /> Configurar Horario
                    </Button>
                </div>
            </div>

            {/* Config & status */}
            {config.announcement && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                    <Megaphone className="text-amber-500 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-bold text-amber-800 text-sm">Anuncio Activo</h4>
                        <p className="text-amber-700 text-sm">{config.announcement}</p>
                    </div>
                </div>
            )}

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

            {/* Quick Actions */}
            <div>
                <h3 className="text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
                    <Tag size={20} className="text-pastel-blue" />
                    Gestión Rápida
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button onClick={() => navigate('/admin/dishes', { state: { create: true } })} className="p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md hover:border-pastel-blue/50 transition-all flex flex-col items-center gap-2 text-center group">
                        <div className="w-10 h-10 bg-pastel-blue/20 text-pastel-blue rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Utensils size={20} />
                        </div>
                        <span className="font-bold text-charcoal text-sm">Nuevo Plato</span>
                    </button>

                    <button onClick={() => navigate('/admin/categories', { state: { create: true } })} className="p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md hover:border-pastel-pink/50 transition-all flex flex-col items-center gap-2 text-center group">
                        <div className="w-10 h-10 bg-pastel-pink/20 text-pastel-pink rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Tag size={20} />
                        </div>
                        <span className="font-bold text-charcoal text-sm">Nueva Categoría</span>
                    </button>

                    <button onClick={() => navigate('/admin/users', { state: { create: true } })} className="p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md hover:border-pastel-purple/50 transition-all flex flex-col items-center gap-2 text-center group">
                        <div className="w-10 h-10 bg-pastel-purple/20 text-pastel-purple rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <UserPlus size={20} />
                        </div>
                        <span className="font-bold text-charcoal text-sm">Nuevo Usuario</span>
                    </button>

                    <button onClick={() => setIsQRExpanded(true)} className="p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md hover:border-charcoal/20 transition-all flex flex-col items-center gap-2 text-center group">
                        <div className="w-10 h-10 bg-charcoal/10 text-charcoal rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <QrCode size={20} />
                        </div>
                        <span className="font-bold text-charcoal text-sm">Ver/Imprimir QR</span>
                    </button>
                </div>
            </div>

            {/* Latest Dishes */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-lg text-charcoal">Últimos Platos Agregados</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {latestDishes.map(dish => (
                        <div key={dish.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                                <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-charcoal text-sm truncate">{dish.name}</h4>
                                <p className="text-xs text-slate-500 truncate">{dish.description}</p>
                            </div>
                            <button onClick={() => navigate('/admin/dishes', { state: { editDish: dish } })} className="text-xs font-bold text-pastel-blue hover:underline">
                                Editar
                            </button>
                        </div>
                    ))}
                    {latestDishes.length === 0 && (
                        <div className="p-8 text-center text-slate-400">No hay platos recientes</div>
                    )}
                </div>
            </div>

            {/* Config Modal */}
            <Modal
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                title="Configuración del Restaurante"
            >
                <form onSubmit={handleSaveConfig} className="space-y-6">
                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                            <div>
                                <span className="block font-bold text-charcoal">Estado del Restaurante</span>
                                <span className="text-sm text-slate-500">
                                    {config.isOpen ? 'Actualmente recibiendo clientes' : 'Cerrado temporalmente'}
                                </span>
                            </div>
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${config.isOpen ? 'bg-green-500' : 'bg-slate-300'}`} onClick={() => setConfig({ ...config, isOpen: !config.isOpen })}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${config.isOpen ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </label>

                        <Input
                            label="Anuncio Global (Opcional)"
                            placeholder="Ej: ¡Hoy 2x1 en Margaritas!"
                            value={config.announcement}
                            onChange={(e: any) => setConfig({ ...config, announcement: e.target.value })}
                        />
                        <p className="text-xs text-slate-400">Este mensaje aparecerá en la parte superior del menú público.</p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button variant="primary" type="submit">Guardar Configuración</Button>
                    </div>
                </form>
            </Modal>

            {/* QR Modal */}
            <Modal
                isOpen={isQRExpanded}
                onClose={() => setIsQRExpanded(false)}
                title="Código QR del Menú"
            >
                <div className="flex flex-col items-center space-y-6 py-4">
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100">
                        <QRCodeSVG
                            id="qr-code-download"
                            value={`${window.location.origin}/`}
                            size={256}
                            level={"H"}
                            includeMargin={true}
                        />
                    </div>
                    <p className="text-center text-slate-500 text-sm max-w-xs">
                        Escanea este código para acceder al menú público directamente.
                    </p>
                    <Button onClick={downloadQR} className="w-full">
                        Descargar PNG
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
