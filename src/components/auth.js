// Gestion de l'authentification
let currentUser = null;

// Éléments DOM
const authModal = document.getElementById('authModal');
const authSection = document.getElementById('authSection');
const loginBtn = document.getElementById('loginBtn');
const authCloseBtn = document.getElementById('authCloseBtn');
const authTabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Au chargement de la page, vérifier la session
document.addEventListener('DOMContentLoaded', checkSession);

// Ouvrir la modal de connexion
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        openAuthModal('login');
    });
}

// Fermer la modal
if (authCloseBtn) {
    authCloseBtn.addEventListener('click', closeAuthModal);
}

// Fermer en cliquant en dehors
authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
        closeAuthModal();
    }
});

// Gestion des onglets
authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        switchTab(tabName);
    });
});

// Formulaire de connexion
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const pseudo = document.getElementById('loginPseudo').value.trim();
    const motDePasse = document.getElementById('loginPassword').value;
    
    const errorDiv = document.getElementById('loginError');
    errorDiv.classList.remove('active');
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pseudo, motDePasse })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = { pseudo: data.pseudo };
            updateAuthUI();
            closeAuthModal();
            loginForm.reset();
            // Notifier que l'utilisateur s'est connecté
            window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { user: currentUser } }));
        } else {
            showError('loginError', data.error || 'Erreur de connexion');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('loginError', 'Erreur de connexion au serveur');
    }
});

// Formulaire d'inscription
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const pseudo = document.getElementById('registerPseudo').value.trim();
    const motDePasse = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerPasswordConfirm').value;
    
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');
    errorDiv.classList.remove('active');
    successDiv.classList.remove('active');
    
    // Validation
    if (motDePasse !== confirmPassword) {
        showError('registerError', 'Les mots de passe ne correspondent pas');
        return;
    }
    
    if (pseudo.length < 3) {
        showError('registerError', 'Le pseudo doit contenir au moins 3 caractères');
        return;
    }
    
    if (motDePasse.length < 6) {
        showError('registerError', 'Le mot de passe doit contenir au moins 6 caractères');
        return;
    }
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pseudo, motDePasse })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = { pseudo: data.pseudo };
            updateAuthUI();
            closeAuthModal();
            registerForm.reset();
        } else {
            showError('registerError', data.error || 'Erreur lors de l\'inscription');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('registerError', 'Erreur de connexion au serveur');
    }
});

// Vérifier la session au chargement
async function checkSession() {
    try {
        const response = await fetch('/api/session');
        const data = await response.json();
        
        if (data.authenticated) {
            currentUser = { pseudo: data.pseudo };
            updateAuthUI();
            // Notifier les autres scripts que l'authentification est prête
            window.dispatchEvent(new CustomEvent('auth-ready', { detail: { authenticated: true, user: currentUser } }));
        } else {
            window.dispatchEvent(new CustomEvent('auth-ready', { detail: { authenticated: false } }));
        }
    } catch (error) {
        console.error('Erreur lors de la vérification de session:', error);
        window.dispatchEvent(new CustomEvent('auth-ready', { detail: { authenticated: false } }));
    }
}

// Déconnexion
async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST'
        });
        
        if (response.ok) {
            currentUser = null;
            updateAuthUI();
            // Notifier que l'utilisateur s'est déconnecté
            window.dispatchEvent(new CustomEvent('user-logged-out'));
            // Rediriger vers la page d'accueil si on est sur collection
            if (window.location.pathname === '/collection') {
                window.location.href = '/';
            }
        }
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
    }
}

// Mettre à jour l'interface utilisateur
function updateAuthUI() {
    if (currentUser) {
        authSection.innerHTML = `
            <div class="user-info">
                <span class="user-pseudo">👤 ${currentUser.pseudo}</span>
                <button id="logoutBtn" class="auth-btn logout">Déconnexion</button>
            </div>
        `;
        
        // Ajouter l'événement de déconnexion
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    } else {
        authSection.innerHTML = `
            <button id="loginBtn" class="auth-btn">Connexion</button>
        `;
        
        // Réattacher l'événement
        const newLoginBtn = document.getElementById('loginBtn');
        if (newLoginBtn) {
            newLoginBtn.addEventListener('click', () => {
                openAuthModal('login');
            });
        }
    }
}

// Ouvrir la modal d'authentification
function openAuthModal(tab = 'login') {
    authModal.classList.add('active');
    switchTab(tab);
}

// Fermer la modal d'authentification
function closeAuthModal() {
    authModal.classList.remove('active');
    // Réinitialiser les erreurs
    document.getElementById('loginError').classList.remove('active');
    document.getElementById('registerError').classList.remove('active');
    document.getElementById('registerSuccess').classList.remove('active');
}

// Changer d'onglet
function switchTab(tabName) {
    // Mettre à jour les onglets
    authTabs.forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Afficher le bon formulaire
    if (tabName === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    }
}

// Afficher une erreur
function showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    errorDiv.textContent = message;
    errorDiv.classList.add('active');
}

// Exporter pour utilisation dans d'autres scripts
window.auth = {
    currentUser: () => currentUser,
    isAuthenticated: () => currentUser !== null
};
