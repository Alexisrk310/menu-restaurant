import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Download } from 'lucide-react';

export default function QrCodeGenerator() {
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        const data = await api.categories.list();
        setCategories(data);
    };

    const baseUrl = window.location.origin;

    const downloadQR = (id: string, name: string) => {
        const svg = document.getElementById(id);
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
            downloadLink.download = `QR-${name}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-display font-bold text-charcoal">Códigos QR</h2>
                <p className="text-slate-500">Genera y descarga códigos QR para tu menú digital.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Main Menu QR */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-4">
                    <h3 className="font-bold text-charcoal">Menú Completo</h3>
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                        <QRCode
                            id="qr-main"
                            value={baseUrl}
                            size={150}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                        />
                    </div>
                    <p className="text-xs text-slate-400 break-all">{baseUrl}</p>
                    <Button size="sm" variant="secondary" onClick={() => downloadQR('qr-main', 'Menu-General')}>
                        <Download size={16} className="mr-2 inline" /> Descargar
                    </Button>
                </div>

                {/* Category QRs */}
                {categories.map(cat => (
                    <div key={cat.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-4">
                        <h3 className="font-bold text-charcoal">Categoría: {cat.name}</h3>
                        <div className="bg-white p-2 rounded-xl border border-slate-100">
                            <QRCode
                                id={`qr-${cat.id}`}
                                value={`${baseUrl}/?category=${cat.id}`}
                                size={150}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                viewBox={`0 0 256 256`}
                            />
                        </div>
                        <p className="text-xs text-slate-400 break-all">{baseUrl}/?category={cat.id}</p>
                        <Button size="sm" variant="secondary" onClick={() => downloadQR(`qr-${cat.id}`, `Cat-${cat.name}`)}>
                            <Download size={16} className="mr-2 inline" /> Descargar
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
