// Variables globales
let allChampions = [];
let filteredChampions = [];

// Éléments DOM
const championGrid = document.getElementById('championGrid');
const searchInput = document.getElementById('searchInput');
const roleFilter = document.getElementById('roleFilter');
const championCount = document.getElementById('championCount');

// Charger les champions au démarrage
document.addEventListener('DOMContentLoaded', () => {
    loadChampions();
    setupEventListeners();
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
    searchInput.addEventListener('input', filterChampions);
    roleFilter.addEventListener('change', filterChampions);
}

// Charger les champions depuis l'API
async function loadChampions() {
    try {
        const response = await fetch('/api/champions');
        const json = await response.json();
        
        // Convertir l'objet en tableau (les champions sont dans json.data)
        allChampions = Object.values(json.data || json);
        filteredChampions = [...allChampions];
        
        console.log(`${allChampions.length} champions chargés`);
        displayChampions(filteredChampions);
        updateCount(filteredChampions.length);
    } catch (error) {
        console.error('Erreur lors du chargement des champions:', error);
        championGrid.innerHTML = '<div class="error">❌ Erreur lors du chargement des champions</div>';
    }
}

// Filtrer les champions
function filterChampions() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedRole = roleFilter.value;
    
    filteredChampions = allChampions.filter(champion => {
        const matchesSearch = champion.name?.toLowerCase().includes(searchTerm) || 
                            champion.title?.toLowerCase().includes(searchTerm);
        const matchesRole = !selectedRole || champion.tags?.includes(selectedRole);
        
        return matchesSearch && matchesRole;
    });
    
    displayChampions(filteredChampions);
    updateCount(filteredChampions.length);
}

// Afficher les champions
function displayChampions(champions) {
    if (champions.length === 0) {
        championGrid.innerHTML = '<div class="no-results">Aucun champion trouvé 😢</div>';
        return;
    }
    
    championGrid.innerHTML = champions.map(champion => createChampionCard(champion)).join('');
    
    // Ajouter les événements de clic sur les cartes
    addCardClickListeners();
}

// Ajouter les événements de clic sur les cartes
function addCardClickListeners() {
    const cards = document.querySelectorAll('.champion-card');
    cards.forEach((card, index) => {
        card.addEventListener('click', () => {
            const champion = filteredChampions[index];
            openChampionDetail(champion);
        });
    });
}

// Ouvrir les détails d'un champion
function openChampionDetail(champion) {
    const detailedContent = createDetailedCard(champion);
    championModal.open(detailedContent);
}

// Créer une carte de champion
function createChampionCard(champion) {
    const imageUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_0.jpg`;
    
    return `
        <div class="champion-card">
            <div class="champion-image">
                <img src="${imageUrl}" 
                     alt="${champion.name}"
                     width="308"
                     height="560"
                     loading="lazy"
                     decoding="async">
            </div>
            <div class="champion-info">
                <h3 class="champion-name">${champion.name}</h3>
                <p class="champion-title">${champion.title}</p>
            </div>
            <div class="champion-hover-text">Cliquez pour plus de détails</div>
        </div>
    `;
}

// Mettre à jour le compteur
function updateCount(count) {
    championCount.textContent = `${count} champion${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`;
}
