// script.js - Shared across all pages

const ADMIN_USERNAMES = ['admin', 'owner', 'headadmin']; // Add more admins here if needed

// Storage helpers
function getUsers() {
    return JSON.parse(localStorage.getItem('funfire_users') || '[]');
}

function saveUsers(users) {
    localStorage.setItem('funfire_users', JSON.stringify(users));
}

function getApplications() {
    return JSON.parse(localStorage.getItem('funfire_applications') || '[]');
}

function saveApplications(apps) {
    localStorage.setItem('funfire_applications', JSON.stringify(apps));
}

function getCurrentUser() {
    return localStorage.getItem('funfire_currentUser');
}

function setCurrentUser(username) {
    localStorage.setItem('funfire_currentUser', username);
}

function clearCurrentUser() {
    localStorage.removeItem('funfire_currentUser');
}

function isAdmin() {
    const user = getCurrentUser();
    return user && ADMIN_USERNAMES.includes(user.toLowerCase());
}

// Update navigation links based on login status
function updateNav() {
    const loggedIn = !!getCurrentUser();
    const admin = isAdmin();

    const registerLink = document.getElementById('register-link');
    const loginLink = document.getElementById('login-link');
    const applicationLink = document.getElementById('application-link');
    const adminLink = document.getElementById('admin-link');
    const logoutLink = document.getElementById('logout-link');

    if (registerLink) registerLink.parentElement.classList.toggle('hidden', loggedIn);
    if (loginLink) loginLink.parentElement.classList.toggle('hidden', loggedIn);
    if (applicationLink) applicationLink.classList.toggle('hidden', !loggedIn || admin);
    if (adminLink) adminLink.classList.toggle('hidden', !admin);
    if (logoutLink) logoutLink.classList.toggle('hidden', !loggedIn);
}

// Logout function
function logout() {
    clearCurrentUser();
    updateNav();
    window.location.href = 'index.html';
}

// Show message helper (used on forms)
function showMessage(elementId, text, type = 'danger') {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = text;
        el.className = `mt-3 text-${type}`;
    }
}

// ================ PAGE-SPECIFIC FUNCTIONS =================

// Register page
function registerUser() {
    const username = document.getElementById('reg-username')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim();
    const password = document.getElementById('reg-password')?.value;

    if (!username || !email || !password) {
        showMessage('register-message', 'All fields are required.', 'danger');
        return;
    }

    const users = getUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        showMessage('register-message', 'Username already exists.', 'danger');
        return;
    }

    users.push({ username, email, password });
    saveUsers(users);
    showMessage('register-message', 'Registration successful! Redirecting to login...', 'success');
    setTimeout(() => window.location.href = 'login.html', 1500);
}

// Login page
function loginUser() {
    const username = document.getElementById('login-username')?.value.trim();
    const password = document.getElementById('login-password')?.value;

    const users = getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

    if (user) {
        setCurrentUser(user.username);
        showMessage('login-message', 'Login successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = isAdmin() ? 'admin.html' : 'application.html';
        }, 1000);
    } else {
        showMessage('login-message', 'Invalid username or password.', 'danger');
    }
}

// Application page
function submitApplication() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('You must be logged in to submit an application.');
        window.location.href = 'login.html';
        return;
    }

    const why = document.getElementById('app-why')?.value.trim();
    const experience = document.getElementById('app-experience')?.value.trim();
    const age = document.getElementById('app-age')?.value;
    const mcUsername = document.getElementById('app-minecraft-username')?.value.trim();

    if (!why || !experience || !age || !mcUsername) {
        showMessage('application-message', 'All fields are required.', 'danger');
        return;
    }

    const applications = getApplications();
    if (applications.find(app => app.username === currentUser)) {
        showMessage('application-message', 'You have already submitted an application.', 'danger');
        return;
    }

    applications.push({
        username: currentUser,
        why,
        experience,
        age,
        mcUsername,
        status: 'pending',
        submittedAt: new Date().toLocaleString()
    });
    saveApplications(applications);

    showMessage('application-message', 'Application submitted successfully! Thank you.', 'success');
    document.getElementById('application-form')?.reset();
}

// Admin panel functions
function renderApplications() {
    const list = document.getElementById('applications-list');
    if (!list) return;

    const apps = getApplications();

    if (apps.length === 0) {
        list.innerHTML = '<p>No applications yet.</p>';
        return;
    }

    list.innerHTML = '';
    apps.forEach((app, index) => {
        const statusBadge = app.status === 'accepted' ? 'success' :
                            app.status === 'rejected' ? 'danger' : 'warning';

        const item = document.createElement('div');
        item.className = 'application-item border-bottom py-3';
        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>${app.mcUsername}</strong> 
                    <small class="text-muted">(@${app.username})</small>
                    <span class="badge bg-${statusBadge} ms-2">${app.status.toUpperCase()}</span>
                    <br>
                    <small class="text-muted">Submitted: ${app.submittedAt} | Age: ${app.age}</small>
                    <p class="mt-2"><strong>Why join staff:</strong><br>${app.why.replace(/\n/g, '<br>')}</p>
                    <p><strong>Experience:</strong><br>${app.experience.replace(/\n/g, '<br>')}</p>
                </div>
                <div class="btn-group-vertical btn-group-sm">
                    <button class="btn btn-success" onclick="acceptApplication(${index})" ${app.status !== 'pending' ? 'disabled' : ''}>Accept</button>
                    <button class="btn btn-danger" onclick="rejectApplication(${index})" ${app.status !== 'pending' ? 'disabled' : ''}>Reject</button>
                    <button class="btn btn-secondary" onclick="deleteApplication(${index})">Delete</button>
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

function acceptApplication(index) {
    if (!confirm('Mark this application as ACCEPTED?')) return;
    const apps = getApplications();
    apps[index].status = 'accepted';
    saveApplications(apps);
    renderApplications();
}

function rejectApplication(index) {
    if (!confirm('Mark this application as REJECTED?')) return;
    const apps = getApplications();
    apps[index].status = 'rejected';
    saveApplications(apps);
    renderApplications();
}

function deleteApplication(index) {
    if (!confirm('Permanently delete this application?')) return;
    const apps = getApplications();
    apps.splice(index, 1);
    saveApplications(apps);
    renderApplications();
}

// Run on every page load
document.addEventListener('DOMContentLoaded', () => {
    updateNav();

    // Auto-render applications if on admin page
    if (document.getElementById('applications-list')) {
        renderApplications();
    }
});