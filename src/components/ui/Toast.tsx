import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="pointer-events-auto"
                        >
                            <div className={`
                                flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[300px] backdrop-blur-md
                                ${toast.type === 'success' ? 'bg-white/90 border-green-200 text-green-700' : ''}
                                ${toast.type === 'error' ? 'bg-white/90 border-red-200 text-red-700' : ''}
                                ${toast.type === 'info' ? 'bg-white/90 border-blue-200 text-blue-700' : ''}
                            `}>
                                {toast.type === 'success' && <CheckCircle size={20} className="shrink-0" />}
                                {toast.type === 'error' && <AlertCircle size={20} className="shrink-0" />}
                                {toast.type === 'info' && <Info size={20} className="shrink-0" />}
                                <p className="font-medium text-sm flex-1">{toast.message}</p>
                                <button onClick={() => removeToast(toast.id)} className="opacity-50 hover:opacity-100">
                                    <X size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
