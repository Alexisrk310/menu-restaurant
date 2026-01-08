import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Users as UsersIcon, Shield, Search, Edit2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { Input } from '../../components/ui/Input';

export default function Users() {
    const [users, setUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const location = useLocation();

    // Edit / Create State
    const [editingUser, setEditingUser] = useState<any>(null); // If null, we are creating
    const [selectedRole, setSelectedRole] = useState('user');

    // Create Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: ''
    });

    const { addToast } = useToast();

    useEffect(() => {
        loadUsers();
    }, []);

    // Handle Quick Actions
    useEffect(() => {
        if (location.state && location.state.create) {
            handleAddNew();
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const loadUsers = async () => {
        try {
            const data = await api.users.list();
            setUsers(data);
        } catch (error) {
            console.error(error);
            addToast('Error al cargar usuarios', 'error');
        }
    };

    const handleAddNew = () => {
        setEditingUser(null);
        setFormData({ email: '', password: '', first_name: '', last_name: '' });
        setSelectedRole('user');
        setIsModalOpen(true);
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        setSelectedRole(user.role);
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingUser) {
                // Update Role
                await api.users.updateRole(editingUser.id, selectedRole);
                addToast('Rol actualizado correctamente', 'success');
            } else {
                // Create User
                if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
                    addToast('Por favor completa todos los campos', 'error');
                    return;
                }
                await api.users.createUser({
                    ...formData,
                    role: selectedRole
                });
                addToast('Usuario creado correctamente', 'success');
            }
            setIsModalOpen(false);
            loadUsers();
        } catch (error: any) {
            console.error(error);
            addToast(error.message || 'Error al guardar usuario', 'error');
        }
    };

    const filteredUsers = users.filter((u: any) =>
    (u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.last_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-display font-bold text-charcoal">Usuarios</h2>
                    <p className="text-slate-500">Gestiona los accesos y roles del sistema</p>
                </div>
                <Button onClick={handleAddNew} className="flex items-center gap-2">
                    <Plus size={20} />
                    Nuevo Usuario
                </Button>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar usuario por email o nombre..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pastel-blue/50 text-slate-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium text-sm">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Rol Actual</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <AnimatePresence>
                                {filteredUsers.map((user, index) => (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <UsersIcon size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-charcoal">{user.first_name} {user.last_name}</p>
                                                    <p className="text-sm text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`
                                                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
                                                ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                    user.role === 'waiter' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-600'}
                                            `}>
                                                <Shield size={12} />
                                                {user.role === 'admin' ? 'Administrador' :
                                                    user.role === 'waiter' ? 'Mesero' : 'Usuario'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="p-2 text-slate-400 hover:text-pastel-blue hover:bg-pastel-blue/10 rounded-lg transition-colors inline-block"
                                                title="Editar Rol"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                <AnimatePresence>
                    {filteredUsers.map((user, index) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                        <UsersIcon size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-charcoal">{user.first_name} {user.last_name}</p>
                                        <p className="text-sm text-slate-500 break-all">{user.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleEdit(user)}
                                    className="p-2 text-slate-400 hover:text-pastel-blue hover:bg-pastel-blue/10 rounded-lg transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                                <span className="text-xs font-medium text-slate-400">Rol Actual</span>
                                <span className={`
                                    inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
                                    ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                        user.role === 'waiter' ? 'bg-blue-100 text-blue-700' :
                                            'bg-slate-100 text-slate-600'}
                                `}>
                                    <Shield size={12} />
                                    {user.role === 'admin' ? 'Administrador' :
                                        user.role === 'waiter' ? 'Mesero' : 'Usuario'}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredUsers.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-400">
                    <p>No se encontraron usuarios.</p>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingUser ? "Editar Rol de Usuario" : "Crear Nuevo Usuario"}
            >
                <form onSubmit={handleSave} className="space-y-6">
                    {!editingUser ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Nombre"
                                    value={formData.first_name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, first_name: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Apellido"
                                    value={formData.last_name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, last_name: e.target.value })}
                                    required
                                />
                            </div>
                            <Input
                                type="email"
                                label="Correo Electrónico"
                                value={formData.email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                            <Input
                                type="password"
                                label="Contraseña"
                                value={formData.password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
                                required
                                minLength={6}
                                placeholder="Mínimo 6 caracteres"
                            />
                            <hr className="border-slate-100" />
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 mb-4">
                            Estás editando el rol para <strong className="text-charcoal">{editingUser?.email}</strong>
                        </p>
                    )}

                    <div>
                        <span className="block text-sm font-medium text-slate-700 mb-3">Asignar Rol</span>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-pastel-blue hover:bg-pastel-blue/5 transition-all">
                                <input
                                    type="radio"
                                    name="role"
                                    value="admin"
                                    checked={selectedRole === 'admin'}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="text-pastel-blue focus:ring-pastel-blue"
                                />
                                <div>
                                    <span className="font-bold text-charcoal block">Administrador</span>
                                    <span className="text-xs text-slate-500">Acceso total al sistema y configuraciones</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-pastel-blue hover:bg-pastel-blue/5 transition-all">
                                <input
                                    type="radio"
                                    name="role"
                                    value="waiter"
                                    checked={selectedRole === 'waiter'}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="text-pastel-blue focus:ring-pastel-blue"
                                />
                                <div>
                                    <span className="font-bold text-charcoal block">Mesero</span>
                                    <span className="text-xs text-slate-500">Gestión de pedidos y mesas</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-pastel-blue hover:bg-pastel-blue/5 transition-all">
                                <input
                                    type="radio"
                                    name="role"
                                    value="user"
                                    checked={selectedRole === 'user'}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="text-pastel-blue focus:ring-pastel-blue"
                                />
                                <div>
                                    <span className="font-bold text-charcoal block">Usuario</span>
                                    <span className="text-xs text-slate-500">Sin acceso al panel administrativo</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button variant="primary" type="submit">
                            {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
