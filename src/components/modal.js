// Gestion du modal
class Modal {
    constructor() {
        this.modal = null;
        this.init();
    }

    init() {
        // Créer le conteneur modal s'il n'existe pas
        if (!document.getElementById('championModal')) {
            const modalHTML = `
                <div id="championModal" class="modal">
                    <div class="modal-overlay"></div>
                    <div class="modal-content">
                        <button class="modal-close" aria-label="Fermer">×</button>
                        <div id="modalBody" class="modal-body"></div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        this.modal = document.getElementById('championModal');
        this.modalBody = document.getElementById('modalBody');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Fermer avec le bouton X
        const closeBtn = this.modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.close());

        // Fermer en cliquant sur l'overlay
        const overlay = this.modal.querySelector('.modal-overlay');
        overlay.addEventListener('click', () => this.close());

        // Fermer avec la touche Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }

    open(content) {
        this.modalBody.innerHTML = content;
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Exporter l'instance du modal
const championModal = new Modal();
