/**
 * ========================================
 * HOSTELHUB - UI COMPONENTS
 * ========================================
 * Author: Thayaneshwaran S (UI/UX Designer)
 * Description: Reusable UI components for design prototyping
 * ========================================
 */

import DesignSystem from './design_system.js';

const { colors, typography, spacing, radius, shadows } = DesignSystem;

// ========================================
// 1. CONTAINER
// ========================================
export const Container = (children, styles = {}) => {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        min-height: 100vh;
        background: ${colors.white};
        font-family: ${typography.fontFamily};
        ${Object.entries(styles).map(([key, value]) => `${key}: ${value};`).join('')}
    `;
    if (typeof children === 'string') {
        container.innerHTML = children;
    } else {
        container.appendChild(children);
    }
    return container;
};

// ========================================
// 2. BRANDING (Left Side)
// ========================================
export const Branding = (title, tagline, description, features, logoUrl) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
        flex: 1.2;
        background: ${colors.primaryGradient};
        display: flex;
        align-items: center;
        justify-content: center;
        padding: ${spacing['2xl']};
        color: ${colors.white};
        position: relative;
        overflow: hidden;
    `;

    // Animated background glow
    const glow = document.createElement('div');
    glow.style.cssText = `
        content: '';
        position: absolute;
        top: -50%;
        right: -30%;
        width: 80%;
        height: 150%;
        background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
        animation: floatGlow 10s ease-in-out infinite;
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes floatGlow {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
            50% { transform: translate(-20px, -20px) scale(1.1); opacity: 0.6; }
        }
    `;
    wrapper.appendChild(style);

    const content = document.createElement('div');
    content.style.cssText = `
        z-index: 1;
        max-width: 500px;
        width: 100%;
    `;

    // Logo
    const logo = document.createElement('img');
    logo.src = logoUrl || 'assets/logo.png';
    logo.alt = 'HostelHub Logo';
    logo.style.cssText = `
        width: 100px;
        height: 100px;
        margin-bottom: ${spacing.lg};
        background: rgba(255,255,255,0.15);
        border-radius: ${radius.full};
        padding: ${spacing.md};
        object-fit: contain;
        backdrop-filter: blur(10px);
        display: block;
        margin-left: auto;
        margin-right: auto;
    `;

    // Title
    const titleEl = document.createElement('h1');
    titleEl.textContent = title;
    titleEl.style.cssText = `
        font-size: ${typography.sizes['4xl']};
        font-weight: ${typography.weights.extrabold};
        letter-spacing: -0.5px;
        margin-bottom: ${spacing.xs};
        color: ${colors.white};
        text-align: center;
    `;

    // Tagline
    const taglineEl = document.createElement('p');
    taglineEl.textContent = tagline;
    taglineEl.style.cssText = `
        font-size: ${typography.sizes.lg};
        font-weight: ${typography.weights.light};
        opacity: 0.9;
        margin-bottom: ${spacing.md};
        color: ${colors.white};
        text-align: center;
    `;

    // Description
    const descEl = document.createElement('p');
    descEl.textContent = description;
    descEl.style.cssText = `
        font-size: ${typography.sizes.sm};
        opacity: 0.8;
        line-height: 1.8;
        margin-bottom: ${spacing.lg};
        color: ${colors.white};
        text-align: center;
    `;

    // Features
    const featuresContainer = document.createElement('div');
    featuresContainer.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: ${spacing.sm};
        font-size: ${typography.sizes.sm};
        max-width: 400px;
        margin: 0 auto;
    `;

    features.forEach(feature => {
        const span = document.createElement('span');
        span.style.cssText = `
            display: flex;
            align-items: center;
            gap: ${spacing.sm};
            opacity: 0.9;
            color: ${colors.white};
        `;
        span.innerHTML = `<i class="fas fa-check-circle" style="color: ${colors.accentLight};"></i> ${feature}`;
        featuresContainer.appendChild(span);
    });

    content.appendChild(logo);
    content.appendChild(titleEl);
    content.appendChild(taglineEl);
    content.appendChild(descEl);
    content.appendChild(featuresContainer);
    wrapper.appendChild(content);

    return wrapper;
};

// ========================================
// 3. FORM CARD (Right Side)
// ========================================
export const FormCard = (title, subtitle, children) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: ${spacing['2xl']};
        background: ${colors.gray50};
    `;

    const card = document.createElement('div');
    card.style.cssText = `
        background: ${colors.white};
        padding: ${spacing['2xl']};
        border-radius: ${radius.xl};
        box-shadow: ${shadows.lg};
        width: 100%;
        max-width: 500px;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
        text-align: center;
        margin-bottom: ${spacing.xl};
    `;

    const titleEl = document.createElement('h2');
    titleEl.textContent = title;
    titleEl.style.cssText = `
        font-size: ${typography.sizes['2xl']};
        color: ${colors.primary};
        font-weight: ${typography.weights.bold};
    `;

    const subtitleEl = document.createElement('p');
    subtitleEl.textContent = subtitle;
    subtitleEl.style.cssText = `
        color: ${colors.gray500};
        font-size: ${typography.sizes.sm};
        margin-top: ${spacing.xs};
    `;

    header.appendChild(titleEl);
    header.appendChild(subtitleEl);
    card.appendChild(header);

    // Form content
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'auth-card-content';
    if (typeof children === 'string') {
        contentWrapper.innerHTML = children;
    } else {
        contentWrapper.appendChild(children);
    }
    card.appendChild(contentWrapper);

    wrapper.appendChild(card);
    return wrapper;
};

// ========================================
// 4. FORM GROUP
// ========================================
export const FormGroup = (label, inputElement, errorMessage = '') => {
    const group = document.createElement('div');
    group.className = 'form-group';
    group.style.cssText = `
        margin-bottom: ${spacing.lg};
    `;

    const labelEl = document.createElement('label');
    labelEl.style.cssText = `
        display: block;
        font-weight: ${typography.weights.semibold};
        font-size: ${typography.sizes.sm};
        color: ${colors.gray700};
        margin-bottom: ${spacing.xs};
    `;
    labelEl.innerHTML = label;

    const inputWrapper = document.createElement('div');
    inputWrapper.style.cssText = `
        position: relative;
    `;
    inputWrapper.appendChild(inputElement);

    const errorEl = document.createElement('small');
    errorEl.className = 'error-message';
    errorEl.style.cssText = `
        color: ${colors.danger};
        font-size: ${typography.sizes.xs};
        margin-top: ${spacing.xs};
        display: ${errorMessage ? 'block' : 'none'};
        min-height: 18px;
    `;
    errorEl.textContent = errorMessage;

    group.appendChild(labelEl);
    group.appendChild(inputWrapper);
    group.appendChild(errorEl);

    return group;
};

// ========================================
// 5. INPUT FIELD
// ========================================
export const Input = (type, placeholder, value = '', styles = {}) => {
    const input = document.createElement('input');
    input.type = type;
    input.placeholder = placeholder;
    input.value = value;
    input.style.cssText = `
        width: 100%;
        padding: 12px 16px;
        border: 2px solid ${colors.gray200};
        border-radius: ${radius.md};
        font-size: ${typography.sizes.base};
        transition: all 0.2s ease;
        font-family: ${typography.fontFamily};
        background: ${colors.gray50};
        color: ${colors.gray800};
        ${Object.entries(styles).map(([key, value]) => `${key}: ${value};`).join('')}
    `;

    // Focus styles
    input.addEventListener('focus', () => {
        input.style.borderColor = colors.primary;
        input.style.boxShadow = `0 0 0 4px rgba(26, 35, 126, 0.1)`;
        input.style.background = colors.white;
    });

    input.addEventListener('blur', () => {
        if (!input.dataset.error) {
            input.style.borderColor = colors.gray200;
            input.style.boxShadow = 'none';
            input.style.background = colors.gray50;
        }
    });

    return input;
};

// ========================================
// 6. PASSWORD INPUT (with toggle)
// ========================================
export const PasswordInput = (placeholder, value = '') => {
    const wrapper = document.createElement('div');
    wrapper.className = 'password-wrapper';
    wrapper.style.cssText = `
        position: relative;
    `;

    const input = document.createElement('input');
    input.type = 'password';
    input.placeholder = placeholder;
    input.value = value;
    input.style.cssText = `
        width: 100%;
        padding: 12px 48px 12px 16px;
        border: 2px solid ${colors.gray200};
        border-radius: ${radius.md};
        font-size: ${typography.sizes.base};
        transition: all 0.2s ease;
        font-family: ${typography.fontFamily};
        background: ${colors.gray50};
        color: ${colors.gray800};
    `;

    // Focus styles
    input.addEventListener('focus', () => {
        input.style.borderColor = colors.primary;
        input.style.boxShadow = `0 0 0 4px rgba(26, 35, 126, 0.1)`;
        input.style.background = colors.white;
    });

    input.addEventListener('blur', () => {
        if (!input.dataset.error) {
            input.style.borderColor = colors.gray200;
            input.style.boxShadow = 'none';
            input.style.background = colors.gray50;
        }
    });

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'toggle-btn';
    toggleBtn.style.cssText = `
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: ${colors.gray400};
        cursor: pointer;
        padding: 8px;
        border-radius: ${radius.sm};
        transition: all 0.2s ease;
    `;
    toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';

    toggleBtn.addEventListener('click', () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        toggleBtn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
        toggleBtn.style.color = isPassword ? colors.primary : colors.gray400;
    });

    toggleBtn.addEventListener('mouseenter', () => {
        toggleBtn.style.color = colors.primary;
        toggleBtn.style.background = colors.gray100;
    });

    toggleBtn.addEventListener('mouseleave', () => {
        toggleBtn.style.color = colors.gray400;
        toggleBtn.style.background = 'none';
    });

    wrapper.appendChild(input);
    wrapper.appendChild(toggleBtn);

    return wrapper;
};

// ========================================
// 7. SELECT DROPDOWN
// ========================================
export const Select = (options, placeholder = 'Select', styles = {}) => {
    const select = document.createElement('select');
    select.style.cssText = `
        width: 100%;
        padding: 12px 16px;
        border: 2px solid ${colors.gray200};
        border-radius: ${radius.md};
        font-size: ${typography.sizes.base};
        font-family: ${typography.fontFamily};
        background: ${colors.gray50};
        color: ${colors.gray700};
        transition: all 0.2s ease;
        appearance: none;
        -webkit-appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23616161' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 16px center;
        cursor: pointer;
        ${Object.entries(styles).map(([key, value]) => `${key}: ${value};`).join('')}
    `;

    // Focus styles
    select.addEventListener('focus', () => {
        select.style.borderColor = colors.primary;
        select.style.boxShadow = `0 0 0 4px rgba(26, 35, 126, 0.1)`;
        select.style.background = colors.white;
    });

    select.addEventListener('blur', () => {
        if (!select.dataset.error) {
            select.style.borderColor = colors.gray200;
            select.style.boxShadow = 'none';
            select.style.background = colors.gray50;
        }
    });

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = placeholder;
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        select.appendChild(option);
    });

    return select;
};

// ========================================
// 8. BUTTON
// ========================================
export const Button = (text, type = 'submit', icon = '', styles = {}) => {
    const btn = document.createElement('button');
    btn.type = type;
    btn.style.cssText = `
        width: 100%;
        padding: 14px;
        background: ${colors.primaryGradient};
        color: ${colors.white};
        border: none;
        border-radius: ${radius.md};
        font-size: ${typography.sizes.base};
        font-weight: ${typography.weights.semibold};
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: ${spacing.sm};
        font-family: ${typography.fontFamily};
        ${Object.entries(styles).map(([key, value]) => `${key}: ${value};`).join('')}
    `;

    btn.innerHTML = icon ? `<i class="${icon}"></i> ${text}` : text;

    btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = shadows.lg;
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = 'none';
    });

    return btn;
};

// ========================================
// 9. AUTH LINK
// ========================================
export const AuthLink = (text, linkText, onClick) => {
    const container = document.createElement('div');
    container.className = 'auth-links';
    container.style.cssText = `
        text-align: center;
        margin-top: ${spacing.lg};
        padding-top: ${spacing.md};
        border-top: 1px solid ${colors.gray200};
    `;

    const p = document.createElement('p');
    p.style.cssText = `
        font-size: ${typography.sizes.sm};
        color: ${colors.gray600};
    `;

    const textNode = document.createTextNode(text + ' ');
    const link = document.createElement('span');
    link.className = 'auth-link';
    link.textContent = linkText;
    link.style.cssText = `
        color: ${colors.primary};
        font-weight: ${typography.weights.semibold};
        cursor: pointer;
        transition: all 0.2s ease;
    `;
    link.addEventListener('click', onClick);
    link.addEventListener('mouseenter', () => {
        link.style.color = colors.accent;
        link.style.textDecoration = 'underline';
    });
    link.addEventListener('mouseleave', () => {
        link.style.color = colors.primary;
        link.style.textDecoration = 'none';
    });

    p.appendChild(textNode);
    p.appendChild(link);
    container.appendChild(p);

    return container;
};

// ========================================
// 10. FOOTER
// ========================================
export const Footer = (text) => {
    const footer = document.createElement('div');
    footer.className = 'auth-footer';
    footer.style.cssText = `
        text-align: center;
        margin-top: ${spacing.lg};
        color: ${colors.gray400};
        font-size: ${typography.sizes.xs};
    `;
    footer.textContent = text;
    return footer;
};

// ========================================
// 11. TOAST (Notification)
// ========================================
export const Toast = (message, type = 'info', duration = 3000) => {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = 'toast';
    const colors_map = {
        success: colors.success,
        error: colors.danger,
        warning: colors.warning,
        info: colors.info
    };
    const textColor = type === 'warning' ? colors.gray800 : colors.white;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: ${radius.md};
        background: ${colors_map[type] || colors.info};
        color: ${textColor};
        font-weight: ${typography.weights.medium};
        box-shadow: ${shadows.lg};
        z-index: 9999;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        max-width: 400px;
        font-family: ${typography.fontFamily};
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
    }, duration);

    return toast;
};

// ========================================
// 12. SECTION TITLE
// ========================================
export const SectionTitle = (text) => {
    const title = document.createElement('div');
    title.className = 'form-section-title';
    title.style.cssText = `
        font-size: ${typography.sizes.sm};
        font-weight: ${typography.weights.bold};
        color: ${colors.primary};
        margin-top: ${spacing.lg};
        margin-bottom: ${spacing.md};
        padding-bottom: ${spacing.xs};
        border-bottom: 2px solid ${colors.gray200};
        text-transform: uppercase;
        letter-spacing: 0.5px;
    `;
    title.textContent = text;
    return title;
};

// ========================================
// 13. FORM ROW (Two columns)
// ========================================
export const FormRow = (children) => {
    const row = document.createElement('div');
    row.className = 'form-row';
    row.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: ${spacing.md};
    `;

    if (Array.isArray(children)) {
        children.forEach(child => {
            row.appendChild(child);
        });
    } else {
        row.appendChild(children);
    }

    return row;
};

export default {
    Container,
    Branding,
    FormCard,
    FormGroup,
    Input,
    PasswordInput,
    Select,
    Button,
    AuthLink,
    Footer,
    Toast,
    SectionTitle,
    FormRow
};