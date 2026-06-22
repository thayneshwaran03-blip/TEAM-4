/**
 * ========================================
 * HOSTELHUB - SIGNUP PAGE DESIGN (FIXED)
 * ========================================
 * Author: Thayaneshwaran S (UI/UX Designer)
 * Description: Signup page created with JavaScript only
 * ========================================
 */

import DesignSystem from './design_system.js';
import {
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
    FormRow,
    addResponsiveStyles
} from './components.js';

// ========================================
// SIGNUP PAGE DESIGN
// ========================================
export function createSignupPage() {
    const { colors, typography, spacing } = DesignSystem;

    // Add responsive styles
    addResponsiveStyles();

    // ========================================
    // 1. LEFT SIDE - BRANDING
    // ========================================
    const features = [
        'Student Room Allocation',
        'Visitor Entry',
        'Leave Requests',
        'Occupancy Reports'
    ];

    const branding = Branding(
        '🏠 HostelHub',
        'centralize & digitalize hostel management.',
        'Join our community and experience smart hostel management.',
        features,
        'assets/logo.png'
    );

    // ========================================
    // 2. RIGHT SIDE - SIGNUP FORM
    // ========================================

    // Create form
    const form = document.createElement('form');
    form.id = 'signupForm';
    form.noValidate = true;
    form.style.cssText = `
        margin: 0;
        padding: 0;
        width: 100%;
    `;

    // --- Personal Information ---
    form.appendChild(SectionTitle('Personal Information'));

    // Full Name
    const nameInput = Input('text', 'Enter your full name');
    form.appendChild(FormGroup(
        '<i class="fas fa-user" style="color: #1a237e; width:20px;"></i> Full Name',
        nameInput,
        ''
    ));

    // Email and Phone Row
    const emailInput = Input('email', 'student@hostel.com');
    const emailGroup = FormGroup(
        '<i class="fas fa-envelope" style="color: #1a237e; width:20px;"></i> Email Address',
        emailInput,
        ''
    );

    const phoneInput = Input('tel', '9876543210');
    const phoneGroup = FormGroup(
        '<i class="fas fa-phone" style="color: #1a237e; width:20px;"></i> Phone Number',
        phoneInput,
        ''
    );

    form.appendChild(FormRow([emailGroup, phoneGroup]));

    // --- Academic Information ---
    form.appendChild(SectionTitle('Academic Information'));

    // Department and Year Row
    const deptOptions = [
        { value: 'Computer Science', label: 'Computer Science' },
        { value: 'Information Technology', label: 'Information Technology' },
        { value: 'Electronics', label: 'Electronics' },
        { value: 'Mechanical', label: 'Mechanical' },
        { value: 'Civil', label: 'Civil' },
        { value: 'Biotechnology', label: 'Biotechnology' },
        { value: 'Electrical', label: 'Electrical' }
    ];
    const deptSelect = Select(deptOptions, 'Select Department');
    const deptGroup = FormGroup(
        '<i class="fas fa-graduation-cap" style="color: #1a237e; width:20px;"></i> Department',
        deptSelect,
        ''
    );

    const yearOptions = [
        { value: '1', label: '1st Year' },
        { value: '2', label: '2nd Year' },
        { value: '3', label: '3rd Year' },
        { value: '4', label: '4th Year' }
    ];
    const yearSelect = Select(yearOptions, 'Select Year');
    const yearGroup = FormGroup(
        '<i class="fas fa-calendar-alt" style="color: #1a237e; width:20px;"></i> Year',
        yearSelect,
        ''
    );

    form.appendChild(FormRow([deptGroup, yearGroup]));

    // Gender and Role Row
    const genderOptions = [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' }
    ];
    const genderSelect = Select(genderOptions, 'Select Gender');
    const genderGroup = FormGroup(
        '<i class="fas fa-venus-mars" style="color: #1a237e; width:20px;"></i> Gender',
        genderSelect,
        ''
    );

    const roleOptions = [
        { value: 'student', label: 'Student' },
        { value: 'warden', label: 'Warden' },
        { value: 'admin', label: 'Admin' }
    ];
    const roleSelect = Select(roleOptions, 'Select Role');
    const roleGroup = FormGroup(
        '<i class="fas fa-user-tag" style="color: #1a237e; width:20px;"></i> Role',
        roleSelect,
        ''
    );

    form.appendChild(FormRow([genderGroup, roleGroup]));

    // --- Parent Information ---
    form.appendChild(SectionTitle('Parent / Guardian Information'));

    // Parent Name and Phone Row
    const parentNameInput = Input('text', "Parent's full name");
    const parentNameGroup = FormGroup(
        '<i class="fas fa-user-friends" style="color: #1a237e; width:20px;"></i> Parent/Guardian Name',
        parentNameInput,
        ''
    );

    const parentPhoneInput = Input('tel', "Parent's phone number");
    const parentPhoneGroup = FormGroup(
        '<i class="fas fa-phone" style="color: #1a237e; width:20px;"></i> Parent Contact',
        parentPhoneInput,
        ''
    );

    form.appendChild(FormRow([parentNameGroup, parentPhoneGroup]));

    // --- Account Security ---
    form.appendChild(SectionTitle('Account Security'));

    // Password
    const passwordWrapper = PasswordInput('Create a password (min 6 characters)');
    form.appendChild(FormGroup(
        '<i class="fas fa-lock" style="color: #1a237e; width:20px;"></i> Password',
        passwordWrapper,
        ''
    ));

    // Confirm Password
    const confirmPasswordWrapper = PasswordInput('Confirm your password');
    form.appendChild(FormGroup(
        '<i class="fas fa-lock" style="color: #1a237e; width:20px;"></i> Confirm Password',
        confirmPasswordWrapper,
        ''
    ));

    // Signup Button
    const signupBtn = Button('Create Account', 'submit', 'fas fa-user-plus');

    const btnWrapper = document.createElement('div');
    btnWrapper.style.cssText = `
        margin-top: ${spacing.sm};
        width: 100%;
    `;
    btnWrapper.appendChild(signupBtn);
    form.appendChild(btnWrapper);

    // Auth links
    const authLink = AuthLink(
        "Already have an account?",
        'Sign In',
        () => {
            console.log('Navigate to Login');
            // Toggle to login page
            const loginContainer = document.getElementById('loginContainer');
            const signupContainer = document.getElementById('signupContainer');
            if (loginContainer && signupContainer) {
                signupContainer.style.display = 'none';
                loginContainer.style.display = 'flex';
            }
        }
    );

    const footer = Footer('© 2026 HostelHub System. Centralized College Utilities.');

    // Create form card
    const formCard = FormCard(
        'Create Account',
        'Register to access the HostelHub portal.',
        form
    );

    // Add auth link and footer inside card
    const cardContent = formCard.querySelector('.auth-card-content');
    if (cardContent) {
        cardContent.appendChild(authLink);
        cardContent.appendChild(footer);
    }

    // ========================================
    // 3. MAIN CONTAINER
    // ========================================
    const container = Container('');
    container.id = 'signupContainer';

    const flexWrapper = document.createElement('div');
    flexWrapper.style.cssText = `
        display: flex;
        width: 100%;
        min-height: 100vh;
    `;
    flexWrapper.appendChild(branding);
    flexWrapper.appendChild(formCard);
    container.appendChild(flexWrapper);

    // ========================================
    // 4. VALIDATION (Design only)
    // ========================================
    setupSignupValidation(
        form,
        nameInput,
        emailInput,
        phoneInput,
        deptSelect,
        yearSelect,
        genderSelect,
        roleSelect,
        passwordWrapper,
        confirmPasswordWrapper
    );

    return container;
}

// ========================================
// VALIDATION (Design only)
// ========================================
function setupSignupValidation(
    form,
    nameInput,
    emailInput,
    phoneInput,
    deptSelect,
    yearSelect,
    genderSelect,
    roleSelect,
    passwordWrapper,
    confirmPasswordWrapper
) {
    const { colors } = DesignSystem;

    const passwordInput = passwordWrapper.querySelector('input');
    const confirmInput = confirmPasswordWrapper.querySelector('input');

    const getErrorEl = (input) => {
        return input.closest('.form-group').querySelector('.error-message');
    };

    const validateField = (input, validationFn) => {
        const errorEl = getErrorEl(input);
        const result = validationFn(input.value);
        if (!result.valid) {
            input.style.borderColor = colors.danger;
            input.style.boxShadow = '0 0 0 4px rgba(229, 57, 53, 0.1)';
            if (errorEl) {
                errorEl.textContent = '⚠️ ' + result.message;
                errorEl.style.display = 'block';
            }
            input.dataset.error = 'true';
            return false;
        }
        input.style.borderColor = colors.success;
        input.style.boxShadow = '0 0 0 4px rgba(67, 160, 71, 0.1)';
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
        delete input.dataset.error;
        return true;
    };

    // Validators
    const validators = {
        name: (val) => {
            if (!val) return { valid: false, message: 'Full name is required' };
            if (val.length < 3) return { valid: false, message: 'Name must be at least 3 characters' };
            if (val.length > 100) return { valid: false, message: 'Name must be less than 100 characters' };
            return { valid: true };
        },
        email: (val) => {
            if (!val) return { valid: false, message: 'Email address is required' };
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                return { valid: false, message: 'Please enter a valid email address' };
            }
            return { valid: true };
        },
        phone: (val) => {
            if (!val) return { valid: false, message: 'Phone number is required' };
            if (!/^[0-9]{10}$/.test(val)) {
                return { valid: false, message: 'Please enter a valid 10-digit phone number' };
            }
            return { valid: true };
        },
        select: (val, field) => {
            if (!val) return { valid: false, message: `Please select your ${field}` };
            return { valid: true };
        },
        password: (val) => {
            if (!val) return { valid: false, message: 'Password is required' };
            if (val.length < 6) return { valid: false, message: 'Password must be at least 6 characters' };
            return { valid: true };
        },
        confirm: (val) => {
            if (!val) return { valid: false, message: 'Please confirm your password' };
            if (val !== passwordInput.value.trim()) {
                return { valid: false, message: 'Passwords do not match' };
            }
            return { valid: true };
        }
    };

    // Event listeners
    nameInput.addEventListener('blur', () => validateField(nameInput, validators.name));
    nameInput.addEventListener('input', function() {
        if (this.value.trim() !== '') validateField(this, validators.name);
    });

    emailInput.addEventListener('blur', () => validateField(emailInput, validators.email));
    emailInput.addEventListener('input', function() {
        if (this.value.trim() !== '') validateField(this, validators.email);
    });

    phoneInput.addEventListener('blur', () => validateField(phoneInput, validators.phone));
    phoneInput.addEventListener('input', function() {
        if (this.value.trim() !== '') validateField(this, validators.phone);
    });

    deptSelect.addEventListener('blur', () => validateField(deptSelect, (v) => validators.select(v, 'department')));
    deptSelect.addEventListener('change', () => validateField(deptSelect, (v) => validators.select(v, 'department')));

    yearSelect.addEventListener('blur', () => validateField(yearSelect, (v) => validators.select(v, 'year')));
    yearSelect.addEventListener('change', () => validateField(yearSelect, (v) => validators.select(v, 'year')));

    genderSelect.addEventListener('blur', () => validateField(genderSelect, (v) => validators.select(v, 'gender')));
    genderSelect.addEventListener('change', () => validateField(genderSelect, (v) => validators.select(v, 'gender')));

    roleSelect.addEventListener('blur', () => validateField(roleSelect, (v) => validators.select(v, 'role')));
    roleSelect.addEventListener('change', () => validateField(roleSelect, (v) => validators.select(v, 'role')));

    passwordInput.addEventListener('blur', () => validateField(passwordInput, validators.password));
    passwordInput.addEventListener('input', function() {
        if (this.value.trim() !== '') {
            validateField(this, validators.password);
            if (confirmInput.value.trim() !== '') {
                validateField(confirmInput, validators.confirm);
            }
        }
    });

    confirmInput.addEventListener('blur', () => validateField(confirmInput, validators.confirm));
    confirmInput.addEventListener('input', function() {
        if (this.value.trim() !== '') validateField(this, validators.confirm);
    });

    // Form submit
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const fields = [
            { input: nameInput, validator: validators.name },
            { input: emailInput, validator: validators.email },
            { input: phoneInput, validator: validators.phone },
            { input: deptSelect, validator: (v) => validators.select(v, 'department') },
            { input: yearSelect, validator: (v) => validators.select(v, 'year') },
            { input: genderSelect, validator: (v) => validators.select(v, 'gender') },
            { input: roleSelect, validator: (v) => validators.select(v, 'role') },
            { input: passwordInput, validator: validators.password },
            { input: confirmInput, validator: validators.confirm }
        ];

        let allValid = true;
        fields.forEach(({ input, validator }) => {
            const isValid = validateField(input, validator);
            if (!isValid) allValid = false;
        });

        if (allValid) {
            Toast('✅ All fields are valid! Ready to sign up.', 'success');
        } else {
            Toast('❌ Please fix the errors above', 'error');
        }
    });
}

// ========================================
// AUTO-RENDER (If used directly)
// ========================================
if (document.getElementById('root')) {
    const root = document.getElementById('root');
    const signupPage = createSignupPage();
    root.appendChild(signupPage);
}

export default createSignupPage;