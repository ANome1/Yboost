// Variables globales
let allSkins = [];
let userSkins = [];
let filteredSkins = [];
let skinCounts = {}; // Pour compter les doublons

// Éléments DOM
const collectionGrid = document.getElementById('collectionGrid');
const collectionSearchInput = document.getElementById('collectionSearchInput');
const collectionRarityFilter = document.getElementById('collectionRarityFilter');
const collectionCount = document.getElementById('collectionCount');
const emptyCollection = document.getElementById('emptyCollection');
const totalSkinsEl = document.getElementById('totalSkins');
const uniqueSkinsEl = document.getElementById('uniqueSkins');
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
    if (e.key === 'skinCollection') {
        loadAllSkins();
    }
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
    collectionSearchInput?.addEventListener('input', filterCollection);
    collectionRarityFilter?.addEventListener('change', filterCollection);
}

// Charger tous les skins obtenus
async function loadAllSkins() {
    try {
        // Charger les données de tous les skins depuis l'API
        const skinsResponse = await fetch('/api/skins');
        const skinsData = await skinsResponse.json();
        allSkins = Object.values(skinsData);
        
        let rawSkins = [];
        
        // Vérifier si l'utilisateur est connecté
        if (typeof currentUser !== 'undefined' && currentUser) {
            // Charger depuis la base de données
            const response = await fetch('/api/user/skins');
            
            if (response.ok) {
                rawSkins = await response.json();
                console.log('✅ Collection chargée depuis la BDD:', rawSkins.length);
            } else {
                console.error('Erreur lors du chargement depuis la BDD');
                showToast('❌ Erreur lors du chargement de la collection', 'error');
            }
        } else {
            // Utilisateur non connecté - afficher un message
            showToast('⚠️ Connectez-vous pour voir votre collection', 'warning');
            rawSkins = [];
        }
        
        // Compter les doublons
        skinCounts = {};
        rawSkins.forEach(skin => {
            const key = skin.skinId;
            if (!skinCounts[key]) {
                skinCounts[key] = {
                    count: 0,
                    skin: skin
                };
            }
            skinCounts[key].count++;
        });
        
        // Créer un tableau de skins uniques avec leur compte
        userSkins = Object.values(skinCounts).map(item => ({
            ...item.skin,
            count: item.count
        }));
        
        // Afficher la collection
        updateCollection();
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        collectionGrid.innerHTML = '<div class="error">❌ Erreur lors du chargement de la collection</div>';
    }
}

// Mettre à jour la collection
function updateCollection() {
    filteredSkins = userSkins;
    
    // Calculer le total de skins (avec doublons)
    const totalCount = userSkins.reduce((sum, skin) => sum + skin.count, 0);
    
    // Mettre à jour les statistiques
    updateStats(userSkins, totalCount);
    
    // Afficher
    if (userSkins.length === 0) {
        showEmptyState();
    } else {
        displayCollection(userSkins);
        updateCount(userSkins.length, totalCount);
    }
}

// Mettre à jour les statistiques
function updateStats(skins, totalCount) {
    const legendary = skins.filter(s => s.rarity === 'kLegendary').reduce((sum, s) => sum + s.count, 0);
    const mythic = skins.filter(s => s.rarity === 'kMythic' || s.rarity === 'kUltimate').reduce((sum, s) => sum + s.count, 0);
    
    if (totalSkinsEl) totalSkinsEl.textContent = totalCount;
    if (uniqueSkinsEl) uniqueSkinsEl.textContent = skins.length;
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
    
    const totalFiltered = filteredSkins.reduce((sum, skin) => sum + skin.count, 0);
    displayCollection(filteredSkins);
    updateCount(filteredSkins.length, totalFiltered);
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
    
    // Badge de compte si > 1
    const countBadge = skinData.count > 1 ? `<span class="skin-count-badge">x${skinData.count}</span>` : '';
    
    return `
        <div class="skin-card owned" style="border-color: ${rarityInfo.color}; box-shadow: 0 0 20px ${rarityInfo.glow};">
            ${countBadge}
            <div class="skin-image">
                <img src="${imageUrl}" 
                     alt="${skinData.skinName}"
                     loading="lazy"
                     onerror="this.style.opacity='0.5'">
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
function updateCount(uniqueCount, totalCount) {
    if (collectionCount) {
        if (uniqueCount === totalCount) {
            collectionCount.textContent = `${totalCount} skin${totalCount > 1 ? 's' : ''} dans votre collection`;
        } else {
            collectionCount.textContent = `${totalCount} skin${totalCount > 1 ? 's' : ''} (${uniqueCount} unique${uniqueCount > 1 ? 's' : ''}) dans votre collection`;
        }
    }
}
