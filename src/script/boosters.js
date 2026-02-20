// Variables globales
let allSkins = [];
let championSkins = {}; // Mapping champion ID -> skins
let championsList = []; // Liste des champions disponibles

// Système de rareté pour les skins (basé sur le système LoL)
const RARITIES = {
    kNoRarity: { name: 'Standard', color: '#6b7280', glow: '#9ca3af' },
    kEpic: { name: 'Épique', color: '#a855f7', glow: '#c084fc' },
    kLegendary: { name: 'Légendaire', color: '#f59e0b', glow: '#fbbf24' },
    kMythic: { name: 'Mythique', color: '#ef4444', glow: '#fca5a5' },
    kUltimate: { name: 'Ultimate', color: '#ff1493', glow: '#ff69b4' }
};

// Configuration du booster
const BOOSTER_CONFIG = {
    name: 'Pack de Skins',
    count: 5
};

// Charger les données au démarrage
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupBoosterButtons();
});

// Charger uniquement les skins
async function loadData() {
    try {
        const skinsResponse = await fetch('/api/skins');
        const skinsData = await skinsResponse.json();
        
        allSkins = Object.values(skinsData);
        
        // Créer un mapping champion -> skins
        createChampionSkinMapping();
        
        console.log(`${allSkins.length} skins chargés pour ${championsList.length} champions`);
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
    }
}

// Créer le mapping champion -> skins
function createChampionSkinMapping() {
    championSkins = {};
    
    allSkins.forEach(skin => {
        // Extraire l'ID du champion depuis le splashPath
        if (skin.splashPath) {
            const match = skin.splashPath.match(/\/Characters\/([^\/]+)\//);
            if (match) {
                const championId = match[1];
                if (!championSkins[championId]) {
                    championSkins[championId] = [];
                }
                championSkins[championId].push(skin);
            }
        }
    });
    
    // Créer la liste des champions disponibles
    championsList = Object.keys(championSkins);
    
    console.log(`Mapping créé pour ${championsList.length} champions`);
}



// Configuration des boutons d'achat
function setupBoosterButtons() {
    const buyButtons = document.querySelectorAll('.booster-buy-btn');
    buyButtons.forEach(btn => {
        btn.addEventListener('click', handleBoosterPurchase);
    });
}

// Gestion de l'ouverture de booster
async function handleBoosterPurchase(event) {
    const btn = event.target;
    const count = parseInt(btn.dataset.count);

    // Vérifier l'authentification avant d'ouvrir un booster
    if (typeof currentUser === 'undefined' || !currentUser) {
        showToast('⚠️ Connectez-vous pour ouvrir des boosters !', 'warning');
        if (typeof showAuthModal === 'function') {
            showAuthModal();
        }
        return;
    }

    // Ouvrir le booster
    openBooster(count);
}

// Ouvrir un booster
function openBooster(count) {
    const skins = generateBoosterContent(count);
    
    displayOpeningAnimation(skins, BOOSTER_CONFIG.name);
}

// Générer le contenu du booster
function generateBoosterContent(count) {
    const obtainedSkins = [];
    
    for (let i = 0; i < count; i++) {
        // Sélectionner un champion aléatoire
        const championId = selectRandomChampion();
        
        // Sélectionner un skin aléatoire pour ce champion
        const skin = selectRandomSkinForChampion(championId);
        
        if (skin) {
            obtainedSkins.push(skin);
        }
    }
    
    return obtainedSkins;
}

// Sélectionner un champion au hasard
function selectRandomChampion() {
    if (!championsList || championsList.length === 0) {
        console.error('Aucun champion disponible');
        return null;
    }
    const randomIndex = Math.floor(Math.random() * championsList.length);
    return championsList[randomIndex];
}

// Sélectionner un skin aléatoire pour un champion
function selectRandomSkinForChampion(championId) {
    if (!championId) {
        console.warn('Champion ID invalide');
        return null;
    }
    
    const skins = championSkins[championId];
    
    if (!skins || skins.length === 0) {
        console.warn(`Aucun skin trouvé pour le champion ${championId}`);
        return null;
    }
    
    const randomIndex = Math.floor(Math.random() * skins.length);
    return skins[randomIndex];
}

// Afficher l'animation d'ouverture
function displayOpeningAnimation(skins, boosterName) {
    const openingZone = document.getElementById('openingZone');
    const cardsContainer = document.getElementById('cardsContainer');
    const revealAllBtn = document.getElementById('revealAllBtn');
    const closeBtn = document.getElementById('closeOpeningBtn');
    
    if (!openingZone || !cardsContainer || !revealAllBtn || !closeBtn) {
        console.error('Éléments du DOM manquants');
        return;
    }
    
    // Réinitialiser
    cardsContainer.innerHTML = '';
    revealAllBtn.classList.add('hidden');
    closeBtn.classList.add('hidden');
    
    // Filtrer les skins valides
    const validSkins = skins.filter(skin => skin && skin.name);
    
    if (validSkins.length === 0) {
        console.error('Aucun skin valide trouvé');
        showToast('Erreur lors de la génération du pack', 'error');
        return;
    }
    
    // Créer les cartes
    validSkins.forEach((skin, index) => {
        const card = createCard(skin, index);
        if (card) {
            cardsContainer.appendChild(card);
        }
    });
    
    // Afficher la zone d'ouverture
    openingZone.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Empêcher le scroll
    
    // Afficher toutes les cartes immédiatement
    setTimeout(() => {
        const cards = cardsContainer.querySelectorAll('.pack-card');
        cards.forEach((card) => {
            card.classList.add('enter');
        });
    }, 100);
    
    // Afficher le bouton "Tout révéler" après un délai
    setTimeout(() => {
        revealAllBtn.classList.remove('hidden');
    }, 800);
    
    // Configuration des événements
    revealAllBtn.onclick = () => revealAllCards(validSkins);
    closeBtn.onclick = () => closeOpening(validSkins);
}

// Créer une carte
function createCard(skin, index) {
    if (!skin || !skin.name) {
        console.error('Skin invalide:', skin);
        return null;
    }
    
    const rarity = skin.rarity || 'kNoRarity';
    const rarityInfo = RARITIES[rarity] || RARITIES.kNoRarity;
    
    // Extraire l'image depuis le splashPath
    let imageUrl = '';
    if (skin.splashPath) {
        const match = skin.splashPath.match(/\/Characters\/([^\/]+)\/.*_(\d+)\.jpg$/);
        if (match) {
            const championName = match[1];
            const skinNum = match[2];
            imageUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championName}_${skinNum}.jpg`;
        }
    }
    
    // Fallback si pas d'image
    if (!imageUrl) {
        imageUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect width="300" height="200" fill="%230a1428"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23c89b3c" font-size="16"%3E' + encodeURIComponent(skin.name) + '%3C/text%3E%3C/svg%3E';
    }
    
    const card = document.createElement('div');
    card.className = 'pack-card';
    card.dataset.rarity = rarity;
    card.dataset.revealed = 'false';
    
    card.innerHTML = `
        <div class="pack-card-inner">
            <div class="pack-card-back">
                <div class="card-back-pattern"></div>
                <span class="card-back-logo">⚔️</span>
            </div>
            <div class="pack-card-front" style="border-color: ${rarityInfo.color}; box-shadow: 0 0 30px ${rarityInfo.glow};">
                <div class="card-rarity-badge" style="background: ${rarityInfo.color};">
                    ${rarityInfo.name}
                </div>
                <img src="${imageUrl}" alt="${skin.name}" class="card-image" width="308" height="560" decoding="async" onerror="this.style.opacity='0.5'">
                <div class="card-content">
                    <h3 class="card-title">${skin.name}</h3>
                    <p class="card-subtitle">${rarityInfo.name}</p>
                </div>
                <div class="card-shine"></div>
            </div>
        </div>
    `;
    
    // Clic pour révéler
    card.addEventListener('click', () => {
        if (card.dataset.revealed === 'false') {
            revealCard(card, rarity);
        }
    });
    
    return card;
}

// Révéler une carte
function revealCard(card, rarity) {
    card.dataset.revealed = 'true';
    card.classList.add('revealed');
    
    // Son et effet
    playRevealSound(rarity);
    
    // Vérifier si toutes les cartes sont révélées
    const allCards = document.querySelectorAll('.pack-card');
    const allRevealed = Array.from(allCards).every(c => c.dataset.revealed === 'true');
    
    if (allRevealed) {
        setTimeout(() => {
            document.getElementById('revealAllBtn').classList.add('hidden');
            document.getElementById('closeOpeningBtn').classList.remove('hidden');
        }, 500);
    }
}

// Révéler toutes les cartes
function revealAllCards(skins) {
    const cards = document.querySelectorAll('.pack-card');
    cards.forEach((card, index) => {
        if (card.dataset.revealed === 'false') {
            setTimeout(() => {
                const rarity = skins[index]?.rarity || 'kNoRarity';
                revealCard(card, rarity);
            }, index * 200);
        }
    });
}

// Effet sonore (simulation)
function playRevealSound(rarity) {
    // On pourrait ajouter de vrais sons ici
    console.log(`🔊 Révélation ${rarity}`);
}

// Fermer l'ouverture
async function closeOpening(skins) {
    const openingZone = document.getElementById('openingZone');
    
    // Sauvegarder les skins obtenus
    await saveObtainedSkins(skins);
    
    // Animation de sortie
    openingZone.classList.add('closing');
    
    setTimeout(() => {
        openingZone.classList.add('hidden');
        openingZone.classList.remove('closing');
        document.body.style.overflow = ''; // Rétablir le scroll
        
        // Afficher un résumé
        showSummaryToast(skins);
    }, 500);
}

// Sauvegarder les skins obtenus (désactivé - pas de BDD)
async function saveObtainedSkins(skins) {
    try {
        const skinsData = skins.map(skin => ({
            skinId: skin.id,
            skinName: skin.name,
            rarity: skin.rarity || 'kNoRarity',
            dateObtained: new Date().toISOString()
        }));
        
        // Vérifier si l'utilisateur est connecté (si currentUser existe dans auth.js)
        if (typeof currentUser !== 'undefined' && currentUser) {
            // Sauvegarder dans la base de données
            const response = await fetch('/api/user/skins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skins: skinsData }),
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                console.log('✅ Skins sauvegardés dans la base de données:', skinsData.length);
            } else {
                // Lire la réponse d'erreur du serveur
                let errorMessage = 'Erreur inconnue';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || 'Erreur serveur';
                    console.error('❌ Erreur BDD (status ' + response.status + '):', errorMessage);
                } catch (e) {
                    console.error('❌ Erreur BDD (status ' + response.status + ') - impossible de lire la réponse');
                }
                showToast('❌ Erreur lors de la sauvegarde: ' + errorMessage, 'error');
            }
        } else {
            // Utilisateur non connecté - bloquer l'action
            showToast('❌ Vous devez être connecté pour sauvegarder vos skins !', 'error');
            console.error('Tentative de sauvegarde sans authentification');
        }
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des skins:', error);
        showToast('❌ Erreur lors de la sauvegarde', 'error');
    }
}


// Afficher un résumé
function showSummaryToast(skins) {
    const rarityCount = {};
    skins.forEach(skin => {
        const rarity = skin.rarity || 'kNoRarity';
        rarityCount[rarity] = (rarityCount[rarity] || 0) + 1;
    });
    
    let summary = `Vous avez obtenu ${skins.length} skins ! `;
    Object.entries(rarityCount).forEach(([rarity, count]) => {
        const emoji = {
            kNoRarity: '⚪',
            kEpic: '🟣',
            kLegendary: '🟡',
            kMythic: '🔴',
            kUltimate: '💎'
        }[rarity] || '⭐';
        summary += `${emoji}${count} `;
    });
    
    showToast(summary, 'success');
}

// Fonction Toast (réutilisée du toast.js)
function showToast(message, type = 'info') {
    if (window.toast) {
        window.toast.show(message, type);
    } else {
        console.log(`Toast: ${message}`);
    }
}
