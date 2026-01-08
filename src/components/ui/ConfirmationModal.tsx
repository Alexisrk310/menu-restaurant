import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger'
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
                >
                    <div className="p-6 text-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-charcoal mb-2">{title}</h3>
                        <p className="text-slate-500 mb-6 font-medium leading-relaxed">{message}</p>

                        <div className="flex gap-3 justify-center">
                            <Button variant="secondary" onClick={onClose} className="w-full">
                                {cancelText}
                            </Button>
                            <button
                                onClick={() => { onConfirm(); onClose(); }}
                                className={`w-full px-6 py-2.5 rounded-xl font-bold text-white transition-all transform active:scale-95 ${variant === 'danger'
                                        ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200'
                                        : 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-200'
                                    }`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
