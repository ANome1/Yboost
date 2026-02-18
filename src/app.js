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
}

// Créer une carte de champion
function createChampionCard(champion) {
    // Valeurs par défaut si les données sont manquantes
    const difficulty = champion.info?.difficulty || 0;
    const difficultyStars = '⭐'.repeat(Math.min(difficulty, 5)) || 'N/A';
    const roles = champion.tags?.join(', ') || 'Non défini';
    const attack = champion.info?.attack || 0;
    const defense = champion.info?.defense || 0;
    const magic = champion.info?.magic || 0;
    const imageUrl = champion.image?.full || '';
    const blurb = champion.blurb || 'Aucune description disponible';
    
    return `
        <div class="champion-card">
            <div class="champion-image">
                <img src="${imageUrl.replace('.png', '.jpg')}" 
                     alt="${champion.name}"
                     onerror="this.src='https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_0.jpg'"
                     loading="lazy">
            </div>
            <div class="champion-info">
                <h3 class="champion-name">${champion.name}</h3>
                <p class="champion-title">${champion.title}</p>
                <div class="champion-stats">
                    <div class="stat">
                        <span class="stat-label">Rôle:</span>
                        <span class="stat-value">${roles}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Difficulté:</span>
                        <span class="stat-value">${difficultyStars}</span>
                    </div>
                    <div class="stat-row">
                        <div class="stat-mini">
                            <span class="stat-icon">⚔️</span>
                            <span>${attack}/10</span>
                        </div>
                        <div class="stat-mini">
                            <span class="stat-icon">🛡️</span>
                            <span>${defense}/10</span>
                        </div>
                        <div class="stat-mini">
                            <span class="stat-icon">✨</span>
                            <span>${magic}/10</span>
                        </div>
                    </div>
                </div>
                <p class="champion-blurb">${blurb.substring(0, 150)}...</p>
            </div>
        </div>
    `;
}

// Mettre à jour le compteur
function updateCount(count) {
    championCount.textContent = `${count} champion${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`;
}
