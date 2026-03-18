let isRegisterMode = false;

function toggleMode() {
    isRegisterMode = !isRegisterMode;
    const emailGroup = document.getElementById('email-group');
    const formTitle = document.getElementById('form-title');
    const loginBtn = document.getElementById('login-btn');
    const toggleBtn = document.getElementById('toggle-btn');
    const errorMsg = document.getElementById('error');
    
    errorMsg.textContent = '';
    
    if (isRegisterMode) {
        emailGroup.style.display = 'block';
        formTitle.textContent = 'Create Account';
        loginBtn.textContent = 'Register';
        loginBtn.onclick = register;
        toggleBtn.textContent = 'Already have an account? Login';
    } else {
        emailGroup.style.display = 'none';
        formTitle.textContent = 'Welcome Back';
        loginBtn.textContent = 'Login';
        loginBtn.onclick = login;
        toggleBtn.textContent = 'Need an account? Register';
    }
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error');
    const loginBtn = document.getElementById('login-btn');
    
    if (!username || !password) {
        errorMsg.textContent = 'Please enter username and password';
        return;
    }
    
    // Add loading state
    loginBtn.classList.add('loading');
    loginBtn.textContent = 'Logging in...';
    errorMsg.textContent = '';
    
    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Login failed');
        }

        localStorage.setItem('token', data.access_token);
        
        // Show success and redirect
        errorMsg.className = 'success-message';
        errorMsg.textContent = '✓ Login successful! Redirecting...';
        
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 500);
    } catch (error) {
        console.error('Login error:', error);
        errorMsg.className = '';
        errorMsg.textContent = error.message;
    } finally {
        loginBtn.classList.remove('loading');
        loginBtn.textContent = isRegisterMode ? 'Register' : 'Login';
    }
}

async function register() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error');
    const loginBtn = document.getElementById('login-btn');
    
    if (!username || !email || !password) {
        errorMsg.textContent = 'Please fill in all fields';
        return;
    }
    
    loginBtn.classList.add('loading');
    loginBtn.textContent = 'Creating account...';
    errorMsg.textContent = '';
    
    try {
        console.log('Attempting registration with:', { username, email });
        
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        console.log('Server response:', data);

        if (!response.ok) {
            if (Array.isArray(data.detail)) {
                const errors = data.detail.map(err => {
                    return `${err.loc?.join('.')}: ${err.msg}`;
                }).join('\n');
                throw new Error(errors);
            } else if (typeof data.detail === 'string') {
                throw new Error(data.detail);
            } else {
                throw new Error(JSON.stringify(data.detail));
            }
        }

        // Show success
        errorMsg.className = 'success-message';
        errorMsg.textContent = '✓ Account created! Switching to login...';
        
        // Clear form
        document.getElementById('username').value = '';
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        
        // Switch to login mode after 1.5 seconds
        setTimeout(() => {
            toggleMode();
        }, 1500);
    } catch (error) {
        console.error('Registration failed:', error);
        errorMsg.className = '';
        errorMsg.textContent = error.message;
    } finally {
        loginBtn.classList.remove('loading');
        loginBtn.textContent = 'Register';
    }
}