import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    children: ReactNode;
}

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function Button({ className, variant = 'primary', size = 'md', children, ...props }: ButtonProps) {
    const variants = {
        primary: 'bg-charcoal text-white hover:bg-slate-700 shadow-lg shadow-charcoal/20',
        secondary: 'bg-pastel-pink text-charcoal hover:bg-pastel-pink/80',
        danger: 'bg-red-500 text-white hover:bg-red-600',
        ghost: 'bg-transparent text-slate-500 hover:text-charcoal hover:bg-slate-100',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-6 py-2.5 text-base',
        lg: 'px-8 py-3 text-lg',
    };

    return (
        <button
            className={cn(
                'rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
