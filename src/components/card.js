// Créer une carte détaillée de champion pour le modal
function createDetailedCard(champion) {
    const difficulty = champion.info?.difficulty || 0;
    const difficultyStars = '⭐'.repeat(Math.min(difficulty, 5)) || 'N/A';
    const roles = champion.tags?.join(', ') || 'Non défini';
    const imageUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_0.jpg`;
    
    // Statistiques
    const stats = champion.stats || {};
    const hp = Math.round(stats.hp || 0);
    const mp = Math.round(stats.mp || 0);
    const armor = Math.round(stats.armor || 0);
    const spellblock = Math.round(stats.spellblock || 0);
    const attackdamage = Math.round(stats.attackdamage || 0);
    const attackspeed = (stats.attackspeed || 0).toFixed(3);
    const movespeed = Math.round(stats.movespeed || 0);
    const attackrange = Math.round(stats.attackrange || 0);
    
    // Info général
    const attack = champion.info?.attack || 0;
    const defense = champion.info?.defense || 0;
    const magic = champion.info?.magic || 0;
    
    return `
        <div class="detailed-card">
            <div class="detailed-header">
                <div class="detailed-image">
                    <img src="${imageUrl}" alt="${champion.name}">
                    <div class="champion-overlay">
                        <h2>${champion.name}</h2>
                        <p class="detailed-title">${champion.title}</p>
                    </div>
                </div>
            </div>
            
            <div class="detailed-body">
                <div class="info-section">
                    <h3>📊 Informations Générales</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Rôle:</span>
                            <span class="info-value">${roles}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Type de ressource:</span>
                            <span class="info-value">${champion.partype || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Difficulté:</span>
                            <span class="info-value">${difficultyStars} (${difficulty}/10)</span>
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <h3>⚡ Capacités</h3>
                    <div class="abilities-grid">
                        <div class="ability-stat">
                            <div class="ability-icon">⚔️</div>
                            <div class="ability-info">
                                <span class="ability-label">Attaque</span>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${attack * 10}%"></div>
                                </div>
                                <span class="ability-value">${attack}/10</span>
                            </div>
                        </div>
                        <div class="ability-stat">
                            <div class="ability-icon">🛡️</div>
                            <div class="ability-info">
                                <span class="ability-label">Défense</span>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${defense * 10}%"></div>
                                </div>
                                <span class="ability-value">${defense}/10</span>
                            </div>
                        </div>
                        <div class="ability-stat">
                            <div class="ability-icon">✨</div>
                            <div class="ability-info">
                                <span class="ability-label">Magie</span>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${magic * 10}%"></div>
                                </div>
                                <span class="ability-value">${magic}/10</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <h3>📈 Statistiques de Base</h3>
                    <div class="stats-grid">
                        <div class="stat-box">
                            <span class="stat-icon">❤️</span>
                            <span class="stat-label">Santé</span>
                            <span class="stat-number">${hp}</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-icon">💧</span>
                            <span class="stat-label">Ressource</span>
                            <span class="stat-number">${mp}</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-icon">🛡️</span>
                            <span class="stat-label">Armure</span>
                            <span class="stat-number">${armor}</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-icon">✨</span>
                            <span class="stat-label">Rés. Magique</span>
                            <span class="stat-number">${spellblock}</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-icon">⚔️</span>
                            <span class="stat-label">Dégâts</span>
                            <span class="stat-number">${attackdamage}</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-icon">⚡</span>
                            <span class="stat-label">Vitesse Atq</span>
                            <span class="stat-number">${attackspeed}</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-icon">👟</span>
                            <span class="stat-label">Vitesse Mvt</span>
                            <span class="stat-number">${movespeed}</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-icon">🎯</span>
                            <span class="stat-label">Portée</span>
                            <span class="stat-number">${attackrange}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
