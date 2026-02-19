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

// Système de rareté (même que dans boosters.js)
const RARITIES = {
    kNoRarity: { name: 'Standard', color: '#6b7280', glow: '#9ca3af' },
    kEpic: { name: 'Épique', color: '#a855f7', glow: '#c084fc' },
    kLegendary: { name: 'Légendaire', color: '#f59e0b', glow: '#fbbf24' },
    kMythic: { name: 'Mythique', color: '#ef4444', glow: '#fca5a5' },
    kUltimate: { name: 'Ultimate', color: '#ff1493', glow: '#ff69b4' }
};

// Charger les données au démarrage
document.addEventListener('DOMContentLoaded', () => {
    loadAllSkins();
    setupEventListeners();
});

// Écouter les mises à jour de collection
window.addEventListener('storage', (e) => {
    if (e.key === 'collection-updated') {
        loadAllSkins();
    }
});

window.addEventListener('collection-updated', () => {
    loadAllSkins();
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
    collectionSearchInput?.addEventListener('input', filterCollection);
    collectionRarityFilter?.addEventListener('change', filterCollection);
}



// Charger tous les skins obtenus
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
        
        // Skins obtenus par l'utilisateur (avec raretés)
        if (userSkinsData.success) {
            userSkins = userSkinsData.skins || [];
        } else {
            userSkins = [];
        }
        
        // Afficher la collection
        updateCollection();
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        collectionGrid.innerHTML = '<div class="error">❌ Erreur lors du chargement de la collection</div>';
    }
}

// Mettre à jour la collection
function updateCollection() {
    // Les skins avec leurs raretés
    filteredSkins = userSkins;
    
    // Mettre à jour les statistiques
    updateStats(userSkins);
    
    // Afficher
    if (userSkins.length === 0) {
        showEmptyState();
    } else {
        displayCollection(userSkins);
        updateCount(userSkins.length);
    }
}

// Mettre à jour les statistiques
function updateStats(skins) {
    const legendary = skins.filter(s => s.rarity === 'kLegendary').length;
    const mythic = skins.filter(s => s.rarity === 'kMythic' || s.rarity === 'kUltimate').length;
    
    if (totalSkinsEl) totalSkinsEl.textContent = skins.length;
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
    
    filteredSkins = userSkins.filter(skin => {
        const matchesSearch = skin.skinName?.toLowerCase().includes(searchTerm);
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
}

// Créer une carte de skin
function createSkinCard(skinData) {
    const rarityInfo = RARITIES[skinData.rarity] || RARITIES.kNoRarity;
    
    // Trouver le skin complet depuis allSkins
    const fullSkin = allSkins.find(s => s.id === skinData.skinId);
    
    let imageUrl = '';
    if (fullSkin && fullSkin.splashPath) {
        const match = fullSkin.splashPath.match(/\/Characters\/([^\/]+)\/.*_(\d+)\.jpg$/);
        if (match) {
            const championName = match[1];
            const skinNum = match[2];
            imageUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championName}_${skinNum}.jpg`;
        }
    }
    
    return `
        <div class="skin-card owned" style="border-color: ${rarityInfo.color}; box-shadow: 0 0 20px ${rarityInfo.glow};">
            <div class="skin-image">
                <img src="${imageUrl}" 
                     alt="${skinData.skinName}"
                     loading="lazy">
            </div>
            <div class="skin-info">
                <h3 class="skin-name">${skinData.skinName}</h3>
                <div class="skin-badges">
                    <span class="skin-badge rarity-badge" style="background: ${rarityInfo.color};">${rarityInfo.name}</span>
                </div>
            </div>
        </div>
    `;
}



// Mettre à jour le compteur
function updateCount(count) {
    if (collectionCount) {
        collectionCount.textContent = `${count} skin${count > 1 ? 's' : ''} dans votre collection`;
    }
}
