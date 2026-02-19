// Variables globales
let allSkins = [];
let userSkins = [];
let filteredSkins = [];

// Éléments DOM
const collectionGrid = document.getElementById('collectionGrid');
const collectionSearchInput = document.getElementById('collectionSearchInput');
const collectionRarityFilter = document.getElementById('collectionRarityFilter');
const collectionCount = document.getElementById('collectionCount');
const emptyCollection = document.getElementById('emptyCollection');
const totalSkinsEl = document.getElementById('totalSkins');
const legendaryCountEl = document.getElementById('legendaryCount');
const mythicCountEl = document.getElementById('mythicCount');

// Charger les données au démarrage
document.addEventListener('DOMContentLoaded', () => {
    if (!window.auth?.isAuthenticated()) {
        showLoginRequired();
        return;
    }
    
    loadAllSkins();
    setupEventListeners();
});

// Recharger la collection quand la page devient visible
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.auth?.isAuthenticated()) {
        loadAllSkins();
    }
});

// Écouter les événements de modification de collection depuis d'autres pages
window.addEventListener('storage', (e) => {
    if (e.key === 'collection-updated' && window.auth?.isAuthenticated()) {
        loadAllSkins();
    }
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
    collectionSearchInput?.addEventListener('input', filterCollection);
    collectionRarityFilter?.addEventListener('change', filterCollection);
}

// Afficher message de connexion requise
function showLoginRequired() {
    collectionGrid.innerHTML = `
        <div class="empty-state">
            <p class="empty-icon">🔒</p>
            <h3>Connexion requise</h3>
            <p>Connectez-vous pour voir votre collection de skins</p>
        </div>
    `;
}

// Charger tous les skins
async function loadAllSkins() {
    try {
        const [skinsResponse, userSkinsResponse] = await Promise.all([
            fetch('/api/skins'),
            fetch('/api/user/skins')
        ]);
        
        const skinsData = await skinsResponse.json();
        const userSkinsData = await userSkinsResponse.json();
        
        // Tous les skins disponibles
        allSkins = Object.values(skinsData);
        
        // IDs des skins de l'utilisateur
        if (userSkinsData.success) {
            userSkins = userSkinsData.skins;
        }
        
        // Filtrer pour n'afficher que les skins possédés
        updateCollection();
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        collectionGrid.innerHTML = '<div class="error">❌ Erreur lors du chargement de la collection</div>';
    }
}

// Mettre à jour la collection
function updateCollection() {
    // Filtrer les skins possédés
    const ownedSkins = allSkins.filter(skin => userSkins.includes(skin.id));
    filteredSkins = ownedSkins;
    
    // Mettre à jour les statistiques
    updateStats(ownedSkins);
    
    // Afficher
    if (ownedSkins.length === 0) {
        showEmptyState();
    } else {
        displayCollection(ownedSkins);
        updateCount(ownedSkins.length);
    }
}

// Mettre à jour les statistiques
function updateStats(ownedSkins) {
    const legendary = ownedSkins.filter(s => s.rarity === 'kLegendary').length;
    const mythic = ownedSkins.filter(s => s.rarity === 'kMythic' || s.rarity === 'kUltimate').length;
    
    if (totalSkinsEl) totalSkinsEl.textContent = ownedSkins.length;
    if (legendaryCountEl) legendaryCountEl.textContent = legendary;
    if (mythicCountEl) mythicCountEl.textContent = mythic;
}

// Afficher état vide
function showEmptyState() {
    collectionGrid.style.display = 'none';
    if (emptyCollection) {
        emptyCollection.style.display = 'block';
    }
}

// Filtrer la collection
function filterCollection() {
    const searchTerm = collectionSearchInput?.value.toLowerCase() || '';
    const selectedRarity = collectionRarityFilter?.value || '';
    
    const ownedSkins = allSkins.filter(skin => userSkins.includes(skin.id));
    
    filteredSkins = ownedSkins.filter(skin => {
        const matchesSearch = skin.name?.toLowerCase().includes(searchTerm);
        const matchesRarity = !selectedRarity || skin.rarity === selectedRarity;
        
        return matchesSearch && matchesRarity;
    });
    
    displayCollection(filteredSkins);
    updateCount(filteredSkins.length);
}

// Afficher la collection
function displayCollection(skins) {
    if (emptyCollection) {
        emptyCollection.style.display = 'none';
    }
    collectionGrid.style.display = 'grid';
    
    if (skins.length === 0) {
        collectionGrid.innerHTML = '<div class="no-results">Aucun skin trouvé 😢</div>';
        return;
    }
    
    collectionGrid.innerHTML = skins.map(skin => createSkinCard(skin)).join('');
    
    // Ajouter les événements sur les boutons
    addRemoveButtonListeners();
}

// Créer une carte de skin
function createSkinCard(skin) {
    // Extraire le champion et le numéro de skin du splashPath (centré)
    let imageUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect width="300" height="200" fill="%230a1428"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23c89b3c" font-size="20" font-family="Arial"%3E${skin.name}%3C/text%3E%3C/svg%3E';
    
    if (skin.splashPath) {
        const match = skin.splashPath.match(/\/Characters\/([^\/]+)\/.*_(\d+)\.jpg$/);
        if (match) {
            const championName = match[1];
            const skinNum = match[2];
            imageUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championName}_${skinNum}.jpg`;
        }
    }
    
    let rarityLabel = 'Standard';
    let rarityClass = skin.rarity || 'kNoRarity';
    
    switch(skin.rarity) {
        case 'kEpic': rarityLabel = 'Épique'; break;
        case 'kLegendary': rarityLabel = 'Légendaire'; break;
        case 'kMythic': rarityLabel = 'Mythique'; break;
        case 'kUltimate': rarityLabel = 'Ultimate'; break;
    }
    
    return `
        <div class="skin-card owned" data-skin-id="${skin.id}">
            <div class="skin-image">
                <img src="${imageUrl}" 
                     alt="${skin.name}"
                     loading="lazy">
            </div>
            <div class="skin-info">
                <h3 class="skin-name">${skin.name}</h3>
                <div class="skin-badges">
                    <span class="skin-badge rarity-badge ${rarityClass}">${rarityLabel}</span>
                    ${skin.isLegacy ? '<span class="skin-badge legacy-badge">Legacy</span>' : ''}
                    ${skin.skinLines && skin.skinLines.length > 0 ? 
                        `<span class="skin-badge skin-line-badge">Line ${skin.skinLines[0].id}</span>` : ''}
                </div>
                <div class="skin-actions">
                    <button class="skin-btn remove" data-action="remove" data-skin-id="${skin.id}">
                        Retirer de ma collection
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Ajouter les événements sur les boutons de suppression
function addRemoveButtonListeners() {
    const buttons = document.querySelectorAll('.skin-btn.remove');
    buttons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            const skinId = parseInt(button.dataset.skinId);
            button.disabled = true;
            
            await removeSkinFromCollection(skinId);
            
            button.disabled = false;
        });
    });
}

// Retirer un skin de la collection
async function removeSkinFromCollection(skinId) {
    if (!confirm('Voulez-vous vraiment retirer ce skin de votre collection ?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/user/skins/${skinId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            userSkins = userSkins.filter(id => id !== skinId);
            updateCollection();
            window.toast?.success('Skin retiré de votre collection');
            // Notifier les autres onglets/pages
            localStorage.setItem('collection-updated', Date.now().toString());
        } else {
            window.toast?.error(data.error || 'Erreur lors de la suppression du skin');
        }
    } catch (error) {
        console.error('Erreur:', error);
        window.toast?.error('Erreur lors de la suppression du skin');
    }
}

// Mettre à jour le compteur
function updateCount(count) {
    if (collectionCount) {
        collectionCount.textContent = `${count} skin${count > 1 ? 's' : ''} dans votre collection`;
    }
}
