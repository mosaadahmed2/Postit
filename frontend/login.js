let isRegisterMode = false;

function toggleMode() {
    isRegisterMode = !isRegisterMode;
    const emailField = document.getElementById('email');
    const formTitle = document.getElementById('form-title');
    const loginBtn = document.getElementById('login-btn');
    const toggleBtn = document.getElementById('toggle-btn');
    const errorMsg = document.getElementById('error');
    
    errorMsg.textContent = ''; // Clear any errors
    
    if (isRegisterMode) {
        emailField.style.display = 'block';
        formTitle.textContent = 'Register';
        loginBtn.textContent = 'Create Account';
        loginBtn.onclick = register;
        toggleBtn.textContent = 'Already have an account? Login';
    } else {
        emailField.style.display = 'none';
        formTitle.textContent = 'Login';
        loginBtn.textContent = 'Login';
        loginBtn.onclick = login;
        toggleBtn.textContent = 'Need an account? Register';
    }
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error');
    
    if (!username || !password) {
        errorMsg.textContent = 'Please enter username and password';
        return;
    }
    
    try {
        const response = await fetch('http://127.0.0.1:8086/auth/login', {
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

        // Store token and redirect
        localStorage.setItem('token', data.access_token);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Login error:', error);
        errorMsg.textContent = error.message;
    }
}

async function register() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error');
    
    if (!username || !email || !password) {
        errorMsg.textContent = 'Please fill in all fields';
        return;
    }
    
    try {
        console.log('Attempting registration with:', { username, email });
        
        const response = await fetch('http://127.0.0.1:8086/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        console.log('Server response:', data);

        if (!response.ok) {
            // Handle validation errors properly
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

        alert('Registration successful! Please login.');
        toggleMode(); // Switch back to login mode
        
        // Clear the form
        document.getElementById('username').value = '';
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
    } catch (error) {
        console.error('Registration failed:', error);
        errorMsg.textContent = error.message;
    }
}