import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
    return (
        <div className="min-h-screen bg-cream text-charcoal font-sans selection:bg-pastel-pink selection:text-charcoal transition-colors duration-300">
            <main className="container mx-auto px-4 py-8 max-w-5xl">
                <Outlet />
            </main>

            <footer className="py-8 text-center text-slate-400 text-sm">
                <p>&copy; {new Date().getFullYear()} Resto Menu. All rights reserved.</p>
            </footer>
        </div>
    );
}
