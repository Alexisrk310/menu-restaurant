/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'cream': '#FDFBF7',
                'pastel-pink': '#FFD1DC',
                'pastel-blue': '#AEC6CF',
                'pastel-green': '#C1E1C1',
                'pastel-yellow': '#FDFD96',
                'pastel-purple': '#B39EB5',
                'pastel-orange': '#FFB347',
                'charcoal': '#36454F',
            },
            fontFamily: {
                'sans': ['Outfit', 'sans-serif'],
                'display': ['Playfair Display', 'serif'],
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
            }
        },
    },
    plugins: [],
}
