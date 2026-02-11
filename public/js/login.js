document.addEventListener('DOMContentLoaded', () => {
    // Password Visibility Toggle
    const togglePassword = document.querySelector('#togglePassword');
    const password = document.querySelector('#password');

    if (togglePassword && password) {
        togglePassword.addEventListener('click', function (e) {
            // toggle the type attribute
            const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
            password.setAttribute('type', type);
            // toggle the eye / eye slash icon
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // Form Submission Loading State
    const loginForm = document.querySelector('form');
    const submitBtn = document.querySelector('button[type="submit"]');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            // Basic client-side validation could go here

            // Show loading state
            if (submitBtn) {
                const originalText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';

                // If the server response is very fast, we might want to ensure the spinner shows for a split second 
                // for better UX, but usually standard form submission navigation handles this naturally.
                // If using AJAX, we would reset this on error. Since this is a standard POST, 
                // the page will reload or redirect. 

                // Fallback reset after 5s in case something hangs (optional)
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }, 5000);
            }
        });
    }

    // Add float effect to inputs
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => {
        // Init state
        if (input.value) {
            input.parentElement.classList.add('focused');
        }

        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });
    });
});
