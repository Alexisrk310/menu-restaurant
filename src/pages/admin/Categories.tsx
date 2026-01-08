
import { useState, useEffect } from 'react';
import { Plus, Trash2, List, Search, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

export default function Categories() {
    const [categories, setCategories] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const { addToast } = useToast();

    // Confirmation Modal State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        const data = await api.categories.list();
        setCategories(data);
    };

    const confirmDelete = async (id: string) => {
        setCategoryToDelete(id);
        setConfirmOpen(true);
    };

    const handleExecuteDelete = async () => {
        if (!categoryToDelete) return;

        try {
            // Integrity Check: Load dishes to see if any belong to this category
            // Ideally backend handles this, but we do it frontend for now as requested
            const dishes = await api.dishes.list();
            const hasDishes = dishes.some((d: any) => d.category_id === categoryToDelete);

            if (hasDishes) {
                addToast('No puedes eliminar una categoría que tiene platos asociados.', 'error');
                return;
            }

            await api.categories.delete(categoryToDelete);
            addToast('Categoría eliminada correctamente.', 'success');
            loadCategories();
        } catch (error) {
            console.error(error);
            addToast('Hubo un error al eliminar la categoría.', 'error');
        }
    };

    const handleOpenModal = (category: any = null) => {
        if (category) {
            setEditingCategory(category);
            setNewCatName(category.name);
        } else {
            setEditingCategory(null);
            setNewCatName('');
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await api.categories.update(editingCategory.id, {
                    name: newCatName,
                    slug: newCatName.toLowerCase().replace(/ /g, '-')
                });
                addToast('Categoría actualizada correctamente.', 'success');
            } else {
                await api.categories.create({
                    name: newCatName,
                    slug: newCatName.toLowerCase().replace(/ /g, '-')
                });
                addToast('Categoría creada correctamente.', 'success');
            }
            setNewCatName('');
            setEditingCategory(null);
            setIsModalOpen(false);
            loadCategories();
        } catch (error) {
            console.error(error);
            addToast('Error al guardar la categoría.', 'error');
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-display font-bold text-charcoal">Categorías</h2>
                    <p className="text-slate-500">Organiza las secciones del menú</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                    <Plus size={20} />
                    Nueva Categoría
                </Button>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar categoría..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pastel-blue/50 text-slate-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {filteredCategories.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                        <List size={48} className="mb-2 opacity-20" />
                        <p>No se encontraron categorías.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        <AnimatePresence>
                            {filteredCategories.map((cat, index) => (
                                <motion.div
                                    key={cat.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-pastel-blue/20 flex items-center justify-center text-slate-600 font-bold">
                                            {cat.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-slate-700">{cat.name}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenModal(cat)}
                                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => confirmDelete(cat.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCategory ? "Editar Categoría" : "Nueva Categoría"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nombre"
                        value={newCatName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCatName(e.target.value)}
                        required
                        placeholder="Ej. Postres"
                    />
                    <div className="pt-4 flex justify-end gap-3">
                        <Button variant="primary" type="submit">
                            {editingCategory ? "Guardar Cambios" : "Crear"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleExecuteDelete}
                title="Eliminar Categoría"
                message="¿Estás seguro de que deseas eliminar esta categoría? Si tiene platos asociados, no se podrá eliminar."
                confirmText="Sí, Eliminar"
            />
        </div>
    );
}
