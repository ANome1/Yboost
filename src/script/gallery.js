// Variables globales
let allSkins = [];
let filteredSkins = [];
let userSkins = [];
let skinLines = new Map();

// Éléments DOM
const skinGrid = document.getElementById('skinGrid');
const skinSearchInput = document.getElementById('skinSearchInput');
const rarityFilter = document.getElementById('rarityFilter');
const skinLineFilter = document.getElementById('skinLineFilter');
const legacyFilter = document.getElementById('legacyFilter');
const ownedFilter = document.getElementById('ownedFilter');
const skinCount = document.getElementById('skinCount');

// Charger les données au démarrage
document.addEventListener('DOMContentLoaded', () => {
    loadSkins();
    loadUserSkins();
    setupEventListeners();
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
    skinSearchInput?.addEventListener('input', filterSkins);
    rarityFilter?.addEventListener('change', filterSkins);
    skinLineFilter?.addEventListener('change', filterSkins);
    legacyFilter?.addEventListener('change', filterSkins);
    ownedFilter?.addEventListener('change', filterSkins);
}

// Charger tous les skins
async function loadSkins() {
    try {
        const response = await fetch('/api/skins');
        const data = await response.json();
        
        // Convertir l'objet en tableau
        allSkins = Object.values(data);
        
        // Extraire les skin lines uniques
        allSkins.forEach(skin => {
            if (skin.skinLines && skin.skinLines.length > 0) {
                skin.skinLines.forEach(line => {
                    if (!skinLines.has(line.id)) {
                        skinLines.set(line.id, line);
                    }
                });
            }
        });
        
        // Remplir le filtre de skin lines
        populateSkinLineFilter();
        
        filteredSkins = [...allSkins];
        console.log(`${allSkins.length} skins chargés`);
        
        displaySkins(filteredSkins);
        updateCount(filteredSkins.length);
    } catch (error) {
        console.error('Erreur lors du chargement des skins:', error);
        skinGrid.innerHTML = '<div class="error">❌ Erreur lors du chargement des skins</div>';
    }
}

// Charger les skins de l'utilisateur
async function loadUserSkins() {
    if (!window.auth?.isAuthenticated()) {
        return;
    }
    
    try {
        const response = await fetch('/api/user/skins');
        const data = await response.json();
        
        if (data.success) {
            userSkins = data.skins;
            // Rafraîchir l'affichage si les skins sont déjà chargés
            if (allSkins.length > 0) {
                displaySkins(filteredSkins);
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des skins utilisateur:', error);
    }
}

// Remplir le filtre de skin lines
function populateSkinLineFilter() {
    if (!skinLineFilter) return;
    
    const sortedLines = Array.from(skinLines.values()).sort((a, b) => a.id - b.id);
    
    sortedLines.forEach(line => {
        const option = document.createElement('option');
        option.value = line.id;
        option.textContent = `Skin Line ${line.id}`;
        skinLineFilter.appendChild(option);
    });
}

// Filtrer les skins
function filterSkins() {
    const searchTerm = skinSearchInput?.value.toLowerCase() || '';
    const selectedRarity = rarityFilter?.value || '';
    const selectedSkinLine = skinLineFilter?.value || '';
    const showLegacyOnly = legacyFilter?.checked || false;
    const showOwnedOnly = ownedFilter?.checked || false;
    
    filteredSkins = allSkins.filter(skin => {
        // Recherche par nom
        const matchesSearch = skin.name?.toLowerCase().includes(searchTerm);
        
        // Filtre par rareté
        const matchesRarity = !selectedRarity || skin.rarity === selectedRarity;
        
        // Filtre par skin line
        const matchesSkinLine = !selectedSkinLine || 
            (skin.skinLines && skin.skinLines.some(line => line.id.toString() === selectedSkinLine));
        
        // Filtre legacy
        const matchesLegacy = !showLegacyOnly || skin.isLegacy === true;
        
        // Filtre skins possédés
        const matchesOwned = !showOwnedOnly || userSkins.includes(skin.id);
        
        return matchesSearch && matchesRarity && matchesSkinLine && matchesLegacy && matchesOwned;
    });
    
    displaySkins(filteredSkins);
    updateCount(filteredSkins.length);
}

// Afficher les skins
function displaySkins(skins) {
    if (skins.length === 0) {
        skinGrid.innerHTML = '<div class="no-results">Aucun skin trouvé 😢</div>';
        return;
    }
    
    skinGrid.innerHTML = skins.map(skin => createSkinCard(skin)).join('');
    
    // Ajouter les événements sur les boutons
    addSkinButtonListeners();
}

// Créer une carte de skin
function createSkinCard(skin) {
    const isOwned = userSkins.includes(skin.id);
    const isAuthenticated = window.auth?.isAuthenticated();
    
    // Utiliser le splash path centré ou l'image de tile
    const imageUrl = skin.splashPath 
        ? `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1${skin.splashPath}`
        : '';
    
    // Badge de rareté
    let rarityLabel = 'Standard';
    let rarityClass = skin.rarity || 'kNoRarity';
    
    switch(skin.rarity) {
        case 'kEpic': rarityLabel = 'Épique'; break;
        case 'kLegendary': rarityLabel = 'Légendaire'; break;
        case 'kMythic': rarityLabel = 'Mythique'; break;
        case 'kUltimate': rarityLabel = 'Ultimate'; break;
    }
    
    return `
        <div class="skin-card ${isOwned ? 'owned' : ''}" data-skin-id="${skin.id}">
            <div class="skin-image">
                <img src="${imageUrl}" 
                     alt="${skin.name}"
                     loading="lazy"
                     onerror="this.src='/placeholder-skin.jpg'">
            </div>
            <div class="skin-info">
                <h3 class="skin-name">${skin.name}</h3>
                <div class="skin-badges">
                    <span class="skin-badge rarity-badge ${rarityClass}">${rarityLabel}</span>
                    ${skin.isLegacy ? '<span class="skin-badge legacy-badge">Legacy</span>' : ''}
                    ${skin.skinLines && skin.skinLines.length > 0 ? 
                        `<span class="skin-badge skin-line-badge">Line ${skin.skinLines[0].id}</span>` : ''}
                </div>
                ${isAuthenticated ? `
                    <div class="skin-actions">
                        ${isOwned ? 
                            `<button class="skin-btn remove" data-action="remove" data-skin-id="${skin.id}">
                                Retirer de ma collection
                            </button>` :
                            `<button class="skin-btn add" data-action="add" data-skin-id="${skin.id}">
                                Ajouter à ma collection
                            </button>`
                        }
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Ajouter les événements sur les boutons
function addSkinButtonListeners() {
    const buttons = document.querySelectorAll('.skin-btn');
    buttons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            const action = button.dataset.action;
            const skinId = parseInt(button.dataset.skinId);
            
            button.disabled = true;
            
            if (action === 'add') {
                await addSkinToCollection(skinId);
            } else if (action === 'remove') {
                await removeSkinFromCollection(skinId);
            }
            
            button.disabled = false;
        });
    });
}

// Ajouter un skin à la collection
async function addSkinToCollection(skinId) {
    try {
        const response = await fetch(`/api/user/skins/${skinId}`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            userSkins.push(skinId);
            displaySkins(filteredSkins);
        } else {
            alert(data.error || 'Erreur lors de l\'ajout du skin');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'ajout du skin');
    }
}

// Retirer un skin de la collection
async function removeSkinFromCollection(skinId) {
    try {
        const response = await fetch(`/api/user/skins/${skinId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            userSkins = userSkins.filter(id => id !== skinId);
            displaySkins(filteredSkins);
        } else {
            alert(data.error || 'Erreur lors de la suppression du skin');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression du skin');
    }
}

// Mettre à jour le compteur
function updateCount(count) {
    if (skinCount) {
        skinCount.textContent = `${count} skin${count > 1 ? 's' : ''} affiché${count > 1 ? 's' : ''}`;
    }
}
