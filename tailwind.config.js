/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stationery: {
          surface: '#FAFAF8',
          subtle: '#F4F4F0',
          border: '#E8E8E0',
          card: '#FFFFFF',
        },
        indigo: {
          primary: '#1E3A5F',
          dark: '#142740',
          light: '#2D5688',
          wash: '#EFF4FB',
        },
        vermilion: {
          DEFAULT: '#C84B31',
          dark: '#A63822',
          light: '#DE644B',
          wash: '#FDF2F0',
        },
        jade: {
          DEFAULT: '#1F7A5A',
          dark: '#165740',
          light: '#2CA077',
          wash: '#EDF8F4',
        },
        ink: {
          DEFAULT: '#1E293B',
          muted: '#64748B',
          faint: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        jp: ['Noto Sans JP', 'sans-serif'],
        arabic: ['Noto Sans Arabic', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
