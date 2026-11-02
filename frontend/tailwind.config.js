/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./design/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a237e',
          light: '#283593',
          dark: '#0d1445',
        },
        accent: {
          DEFAULT: '#ff6f00',
          light: '#ffa726',
        },
        success: '#43a047',
        danger: '#e53935',
        warning: '#fdd835',
        info: '#00bcd4',
        gray: {
          50: '#f8f9fa',
          100: '#f0f2f5',
          200: '#e0e0e0',
          300: '#bdbdbd',
          400: '#9e9e9e',
          500: '#757575',
          600: '#616161',
          700: '#424242',
          800: '#212121',
          900: '#121212',
        }
      },
      fontFamily: {
        sans: ["'Poppins'", "'Outfit'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        outfit: ["'Outfit'", "sans-serif"],
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
      }
    },
  },
  plugins: [],
}
