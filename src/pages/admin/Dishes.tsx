import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { formatCurrency } from '../../lib/format';

export default function Dishes() {
    const [dishes, setDishes] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDish, setEditingDish] = useState<any>(null);
    const { addToast } = useToast();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    // Confirmation State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [dishToDelete, setDishToDelete] = useState<string | null>(null);
    const location = useLocation();

    useEffect(() => {
        loadData();
    }, []);

    // Handle Quick Actions from Dashboard
    useEffect(() => {
        if (location.state) {
            if (location.state.create) {
                handleAddNew();
                // Clear state to avoid reopening on refresh
                window.history.replaceState({}, document.title);
            } else if (location.state.editDish) {
                handleEdit(location.state.editDish);
                window.history.replaceState({}, document.title);
            }
        }
    }, [location]);

    const loadData = async () => {
        const [dishesData, catsData] = await Promise.all([
            api.dishes.list(true), // Load ALL dishes including archived
            api.categories.list(true)
        ]);
        setDishes(dishesData);
        setCategories(catsData);
    };

    const confirmDelete = (id: string) => {
        setDishToDelete(id);
        setConfirmOpen(true);
    };

    const handleExecuteDelete = async () => {
        if (!dishToDelete) return;
        try {
            await api.dishes.delete(dishToDelete);
            addToast('Plato eliminado correctamente.', 'success');
            loadData();
        } catch (error) {
            console.error(error);
            addToast('Error al eliminar el plato.', 'error');
        }
    };

    const handleEdit = (dish: any) => {
        setEditingDish(dish);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingDish(null);
        setIsModalOpen(true);
    };

    const filteredDishes = dishes.filter(dish => {
        const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dish.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory ? dish.category_id === filterCategory : true;
        return matchesSearch && matchesCategory;
    });

    const getCategoryName = (catId: string) => {
        const cat = categories.find(c => c.id === catId);
        return cat ? cat.name : 'Sin categoría';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-display font-bold text-charcoal">Platos</h2>
                    <p className="text-slate-500">Administra el menú de tu restaurante</p>
                </div>
                <Button onClick={handleAddNew} className="flex items-center gap-2">
                    <Plus size={20} />
                    Nuevo Plato
                </Button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center z-10 relative">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar plato..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pastel-blue/50 text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative w-full md:w-64">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <select
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pastel-blue/50 text-slate-700 bg-white appearance-none"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="">Todas las categorías</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredDishes.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-slate-400">
                            <p>No se encontraron platos.</p>
                        </div>
                    ) : (
                        filteredDishes.map((dish, index) => (
                            <motion.div
                                key={dish.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.05 }}
                                className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 group transition-all duration-300 transform hover:-translate-y-1 ${!dish.is_active ? 'opacity-60 grayscale' : ''}`}
                            >
                                <div className="relative h-48 rounded-xl overflow-hidden bg-slate-100">
                                    <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />

                                    <div className="absolute top-2 left-2">
                                        <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-slate-600 shadow-sm border border-white/50">
                                            {getCategoryName(dish.category_id)}
                                        </span>
                                    </div>

                                    {!dish.is_active && (
                                        <div className="absolute inset-0 bg-slate-200/50 backdrop-blur-[2px] flex items-center justify-center">
                                            <span className="bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-bold">ARCIVADO</span>
                                        </div>
                                    )}

                                    {/* Actions - Always visible on mobile, hover on desktop */}
                                    <div className="absolute top-2 right-2 flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(dish)} className="p-2 bg-white/90 rounded-full shadow-sm hover:bg-white text-slate-700 hover:text-pastel-blue transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => confirmDelete(dish.id)} className="p-2 bg-white/90 rounded-full shadow-sm hover:bg-white text-red-500 hover:text-red-600 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-charcoal">{dish.name}</h3>
                                        <span className="font-bold text-pastel-orange">{formatCurrency(dish.price)}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{dish.description}</p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingDish ? 'Editar Plato' : 'Nuevo Plato'}
            >
                <DishForm
                    initialData={editingDish}
                    categories={categories}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        addToast(editingDish ? 'Plato actualizado correctamente' : 'Plato creado correctamente', 'success');
                        loadData();
                    }}
                />
            </Modal>

            <ConfirmationModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleExecuteDelete}
                title="Eliminar Plato"
                message="¿Estás seguro de que deseas eliminar este plato? Esta acción no se puede deshacer."
                confirmText="Eliminar"
            />
        </div>
    );
}

function DishForm({ initialData, categories, onSuccess }: any) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category_id: '',
        image_url: '',
        is_active: true
    });
    const [uploading, setUploading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (initialData) {
            await api.dishes.update(initialData.id, formData);
        } else {
            await api.dishes.create(formData);
        }
        onSuccess();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);
        try {
            const file = e.target.files[0];
            const url = await api.storage.uploadImage(file);
            setFormData({ ...formData, image_url: url });
            addToast('Imagen subida con éxito', 'success');
        } catch (error) {
            console.error("Fallo al subir", error);
            addToast("Error al subir imagen", 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
                <Input
                    label="Nombre del Plato"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ej: Hamburguesa Clásica"
                />

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 block">Descripción</label>
                    <textarea
                        className="w-full rounded-xl border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-blue/50 focus:border-pastel-blue placeholder:text-slate-400 min-h-[100px] resize-none"
                        rows={3}
                        value={formData.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe los ingredientes y detalles del plato..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Precio"
                        type="number"
                        step="50"
                        value={formData.price}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, price: e.target.value })}
                        required
                        placeholder="0"
                    />
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 block">Categoría</label>
                        <div className="relative">
                            <select
                                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-pastel-blue/50 font-sans appearance-none"
                                value={formData.category_id}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, category_id: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar...</option>
                                {categories.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 block">Imagen del Plato</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 transition-colors hover:border-pastel-blue/50 bg-slate-50/50">
                        <div className="flex flex-col items-center justify-center gap-3">
                            {formData.image_url ? (
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-white shadow-sm border border-slate-100 group">
                                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, image_url: '' })}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <div className="w-12 h-12 bg-pastel-blue/10 text-pastel-blue rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Search size={20} className="opacity-50" />
                                        {/* Using Search as generic icon here, ideally Upload but not imported.
                                            Actually, let's use the file input directly. */}
                                    </div>
                                    <p className="text-sm text-slate-500 mb-2">Haz clic o arrastra para subir</p>
                                </div>
                            )}

                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploading}
                                className={formData.image_url ? "hidden" : "w-full"}
                            />
                        </div>
                    </div>
                    {uploading && <p className="text-sm text-pastel-blue text-center animate-pulse font-medium">Subiendo imagen...</p>}
                </div>

                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                        type="checkbox"
                        className="w-5 h-5 mt-0.5 text-pastel-blue rounded focus:ring-pastel-blue border-slate-300"
                        checked={formData.is_active ?? true}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <div>
                        <span className="block font-bold text-charcoal text-sm">Disponible en el menú</span>
                        <span className="text-xs text-slate-500 block mt-0.5">Si se desactiva, el plato se ocultará del menú público pero permanecerá en el sistema.</span>
                    </div>
                </label>
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 bg-white pb-2 sm:pb-0">
                {/* Sticky bottom for mobile if content overflows significantly,
                     though the modal body scroll handles it. 
                     Keeping it simple logic-wise. */}
                <Button variant="primary" type="submit" disabled={uploading} className="w-full sm:w-auto">
                    {initialData ? 'Guardar Cambios' : 'Crear Plato'}
                </Button>
            </div>
        </form>
    );
}
