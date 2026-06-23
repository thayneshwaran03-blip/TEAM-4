// ========================================
// RESPONSIVE STYLES
// ========================================
export const addResponsiveStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        /* Responsive Styles */
        @media (max-width: 768px) {
            .auth-container {
                flex-direction: column !important;
            }
            
            .branding {
                padding: 1.5rem !important;
                min-height: 200px !important;
                flex: none !important;
                width: 100% !important;
            }
            
            .branding-logo {
                width: 60px !important;
                height: 60px !important;
            }
            
            .branding h1 {
                font-size: 1.5rem !important;
            }
            
            .branding-description {
                display: none !important;
            }
            
            .branding-features {
                grid-template-columns: 1fr 1fr !important;
                font-size: 0.75rem !important;
            }
            
            .auth-form-wrapper {
                padding: 1rem !important;
                max-height: 100vh !important;
                overflow-y: auto !important;
            }
            
            .auth-card {
                padding: 1.5rem !important;
                max-height: 95vh !important;
                max-width: 100% !important;
            }
            
            .form-row {
                grid-template-columns: 1fr !important;
                gap: 0 !important;
            }
            
            .form-section-title {
                font-size: 0.75rem !important;
                margin-top: 1rem !important;
            }
        }

        @media (max-width: 480px) {
            .branding {
                min-height: 150px !important;
                padding: 1rem !important;
            }
            
            .branding-logo {
                width: 40px !important;
                height: 40px !important;
            }
            
            .branding h1 {
                font-size: 1.25rem !important;
            }
            
            .branding-tagline {
                font-size: 0.875rem !important;
            }
            
            .branding-features {
                grid-template-columns: 1fr !important;
            }
            
            .auth-card {
                padding: 1rem !important;
            }
            
            select {
                font-size: 0.875rem !important;
                padding: 10px 14px !important;
            }
            
            input {
                font-size: 0.875rem !important;
                padding: 10px 14px !important;
            }
            
            .login-btn {
                font-size: 0.875rem !important;
                padding: 12px !important;
            }
        }

        /* Scrollbar for auth card */
        .auth-card::-webkit-scrollbar {
            width: 6px;
        }
        .auth-card::-webkit-scrollbar-track {
            background: #f0f2f5;
            border-radius: 50%;
        }
        .auth-card::-webkit-scrollbar-thumb {
            background: #1a237e;
            border-radius: 50%;
        }
        .auth-card::-webkit-scrollbar-thumb:hover {
            background: #283593;
        }

        /* Fade In Animation */
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Smooth transitions */
        * {
            transition: all 0.2s ease;
        }
    `;
    document.head.appendChild(style);
};