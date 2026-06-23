/**
 * ========================================
 * HOSTELHUB - DESIGN SYSTEM
 * ========================================
 * Author: Thayaneshwaran S (UI/UX Designer)
 * Description: Design tokens - colors, typography, spacing, etc.
 * ========================================
 */

const DesignSystem = {
    // ========================================
    // COLORS
    // ========================================
    colors: {
        primary: '#1a237e',
        primaryLight: '#283593',
        primaryDark: '#0d1445',
        primaryGradient: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
        
        accent: '#ff6f00',
        accentLight: '#ffa726',
        
        success: '#43a047',
        danger: '#e53935',
        warning: '#fdd835',
        info: '#00bcd4',
        
        white: '#ffffff',
        gray50: '#f8f9fa',
        gray100: '#f0f2f5',
        gray200: '#e0e0e0',
        gray300: '#bdbdbd',
        gray400: '#9e9e9e',
        gray500: '#757575',
        gray600: '#616161',
        gray700: '#424242',
        gray800: '#212121',
        gray900: '#121212'
    },

    // ========================================
    // TYPOGRAPHY
    // ========================================
    typography: {
        fontFamily: "'Poppins', 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
        sizes: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '2rem',
            '4xl': '2.5rem'
        },
        weights: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            extrabold: 800
        }
    },

    // ========================================
    // SPACING
    // ========================================
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem'
    },

    // ========================================
    // BORDER RADIUS
    // ========================================
    radius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '50%'
    },

    // ========================================
    // SHADOWS
    // ========================================
    shadows: {
        sm: '0 1px 3px rgba(0,0,0,0.12)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 25px rgba(0,0,0,0.15)',
        xl: '0 20px 50px rgba(0,0,0,0.2)'
    },

    // ========================================
    // BREAKPOINTS
    // ========================================
    breakpoints: {
        mobile: '480px',
        tablet: '768px',
        desktop: '992px',
        large: '1200px'
    }
};

export default DesignSystem;