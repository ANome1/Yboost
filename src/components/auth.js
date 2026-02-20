// Gestion de l'authentification

let currentUser = null;

// Vérifier si l'utilisateur est connecté
async function checkAuth() {
  try {
    const response = await fetch('/api/session', {
      credentials: 'same-origin'
    });
    const data = await response.json();
    
    if (data.authenticated) {
      currentUser = data.user;
      updateAuthUI();
      return true;
    } else {
      currentUser = null;
      updateAuthUI();
      return false;
    }
  } catch (error) {
    console.error('Erreur vérification session:', error);
    return false;
  }
}

// Mettre à jour l'interface en fonction de l'état de connexion
function updateAuthUI() {
  const authBtn = document.getElementById('auth-btn');
  if (!authBtn) return;
  
  if (currentUser) {
    authBtn.textContent = currentUser.pseudo;
    authBtn.onclick = logout;
  } else {
    authBtn.textContent = 'Connexion';
    authBtn.onclick = showAuthModal;
  }
}

// Afficher le modal d'authentification
function showAuthModal() {
  // Vérifier si le modal existe déjà
  let modal = document.getElementById('auth-modal');
  
  if (!modal) {
    // Créer le modal
    modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="login">Connexion</button>
          <button class="auth-tab" data-tab="register">Inscription</button>
        </div>
        
        <div id="login-form" class="auth-form active">
          <h2>Connexion</h2>
          <input type="text" id="login-pseudo" placeholder="Pseudo" autocomplete="username">
          <input type="password" id="login-password" placeholder="Mot de passe" autocomplete="current-password">
          <button onclick="login()">Se connecter</button>
          <p class="error-message" id="login-error"></p>
        </div>
        
        <div id="register-form" class="auth-form">
          <h2>Inscription</h2>
          <input type="text" id="register-pseudo" placeholder="Pseudo (3-20 caractères)" autocomplete="username">
          <input type="password" id="register-password" placeholder="Mot de passe (min 6 caractères)" autocomplete="new-password">
          <input type="password" id="register-confirm" placeholder="Confirmer le mot de passe" autocomplete="new-password">
          <button onclick="register()">S'inscrire</button>
          <p class="error-message" id="register-error"></p>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Gestion des onglets
    const tabs = modal.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const tabName = this.dataset.tab;
        
        // Mettre à jour les onglets actifs
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // Mettre à jour les formulaires visibles
        document.getElementById('login-form').classList.remove('active');
        document.getElementById('register-form').classList.remove('active');
        document.getElementById(tabName + '-form').classList.add('active');
      });
    });
    
    // Fermer le modal
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = function() {
      modal.style.display = 'none';
    };
    
    // Fermer en cliquant en dehors
    window.onclick = function(event) {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    };
  }
  
  modal.style.display = 'flex';
}

// Connexion
async function login() {
  const pseudo = document.getElementById('login-pseudo').value;
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  
  errorEl.textContent = '';
  
  if (!pseudo || !password) {
    errorEl.textContent = 'Veuillez remplir tous les champs';
    return;
  }
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pseudo, motDePasse: password }),
      credentials: 'same-origin'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentUser = data.user;
      updateAuthUI();
      document.getElementById('auth-modal').style.display = 'none';
      
      // Afficher un message de succès
      if (typeof showToast === 'function') {
        showToast('Connecté avec succès !', 'success');
      }
      
      // Recharger les skins depuis la BDD si on est sur la page collection
      if (typeof loadAllSkins === 'function') {
        loadAllSkins();
      }
    } else {
      errorEl.textContent = data.error || 'Erreur de connexion';
    }
  } catch (error) {
    console.error('Erreur connexion:', error);
    errorEl.textContent = 'Erreur de connexion au serveur';
  }
}

// Inscription
async function register() {
  const pseudo = document.getElementById('register-pseudo').value;
  const password = document.getElementById('register-password').value;
  const confirm = document.getElementById('register-confirm').value;
  const errorEl = document.getElementById('register-error');
  
  errorEl.textContent = '';
  
  if (!pseudo || !password || !confirm) {
    errorEl.textContent = 'Veuillez remplir tous les champs';
    return;
  }
  
  if (password !== confirm) {
    errorEl.textContent = 'Les mots de passe ne correspondent pas';
    return;
  }
  
  if (pseudo.length < 3 || pseudo.length > 20) {
    errorEl.textContent = 'Le pseudo doit contenir entre 3 et 20 caractères';
    return;
  }
  
  if (password.length < 6) {
    errorEl.textContent = 'Le mot de passe doit contenir au moins 6 caractères';
    return;
  }
  
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pseudo, motDePasse: password }),
      credentials: 'same-origin'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentUser = data.user;
      updateAuthUI();
      document.getElementById('auth-modal').style.display = 'none';
      
      // Afficher un message de succès
      if (typeof showToast === 'function') {
        showToast('Compte créé avec succès !', 'success');
      }
    } else {
      errorEl.textContent = data.error || 'Erreur lors de l\'inscription';
    }
  } catch (error) {
    console.error('Erreur inscription:', error);
    errorEl.textContent = 'Erreur de connexion au serveur';
  }
}

// Déconnexion
async function logout() {
  try {
    const response = await fetch('/api/logout', { 
      method: 'POST',
      credentials: 'same-origin'
    });
    
    if (response.ok) {
      currentUser = null;
      updateAuthUI();
      
      if (typeof showToast === 'function') {
        showToast('Déconnecté', 'info');
      }
      
      // Retourner à l'accueil
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Erreur déconnexion:', error);
  }
}

// Vérifier l'authentification au chargement
document.addEventListener('DOMContentLoaded', checkAuth);
