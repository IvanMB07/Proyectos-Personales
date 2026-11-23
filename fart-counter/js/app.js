/* ============================================
   APP.JS - Lógica principal de la aplicación
   ============================================ */

// ESTADO GLOBAL
const App = {
    counter: 0,
    isAnimating: false,
    clickCooldown: false,
    
    /**
     * Inicializa la aplicación
     */
    init() {
        console.log('🚀 Inicializando Fart Counter...');
        
        // Cargar datos del storage
        this.counter = Storage.getCounter();
        
        // Inicializar audio PRIMERO
        AudioManager.init();
        
        // Renderizar UI
        this.render();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Aplicar preferencias guardadas
        this.applyPreferences();
        
        // Permitir reproducción de audio al hacer click
        this.allowAudioPlayback();
        
        console.log('✅ App lista. Contador actual:', this.counter);
    },
    
    /**
     * Permite la reproducción de audio después de interacción del usuario
     */
    allowAudioPlayback() {
        const enableAudio = () => {
            console.log('🎵 Audio habilitado por interacción');
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('touchstart', enableAudio);
        };
        
        document.addEventListener('click', enableAudio, { once: true });
        document.addEventListener('touchstart', enableAudio, { once: true });
    },
    
    /**
     * Configura todos los event listeners
     */
    setupEventListeners() {
        // Botón principal
        const mainBtn = document.getElementById('mainButton');
        if (mainBtn) {
            mainBtn.addEventListener('click', () => this.handleMainClick());
            mainBtn.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleMainClick();
                }
            });
        }
        
        // Botón Reset
        const resetBtn = document.getElementById('resetButton');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.showResetConfirm());
        }
        
        // Botón Sonido
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => this.toggleSound());
        }
        
        // Botón Info
        const infoBtn = document.getElementById('infoButton');
        if (infoBtn) {
            infoBtn.addEventListener('click', () => this.showInfoModal());
        }
        
        // Slider de volumen
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => this.handleVolumeChange(e));
        }
        
        // Confirmación de Reset
        const confirmResetBtn = document.getElementById('confirmReset');
        if (confirmResetBtn) {
            confirmResetBtn.addEventListener('click', () => this.handleReset());
        }
        
        const cancelResetBtn = document.getElementById('cancelReset');
        if (cancelResetBtn) {
            cancelResetBtn.addEventListener('click', () => this.hideResetConfirm());
        }
        
        // Cerrar modal de info
        const closeInfoBtn = document.getElementById('closeInfoModal');
        if (closeInfoBtn) {
            closeInfoBtn.addEventListener('click', () => this.hideInfoModal());
        }
        
        // Cerrar modales al clickear overlay
        document.querySelectorAll('.modal__overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal);
                }
            });
        });
        
        // Tecla ESC para cerrar modales
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
        
        console.log('✅ Event listeners configurados');
    },
    
    /**
     * Aplica preferencias guardadas
     */
    applyPreferences() {
        // Aplicar estado del sonido
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.setAttribute('aria-pressed', AudioManager.isSoundEnabled().toString());
            soundToggle.classList.toggle('btn--disabled', !AudioManager.isSoundEnabled());
        }
        
        // Aplicar volumen
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.value = AudioManager.getVolume();
            this.updateVolumeDisplay();
        }
    },
    
    /**
     * Maneja el click en el botón principal
     */
    handleMainClick() {
        // Prevenir clicks muy rápidos
        if (this.clickCooldown) return;
        
        this.clickCooldown = true;
        setTimeout(() => {
            this.clickCooldown = false;
        }, 100);
        
        // Incrementar contador
        this.counter = Storage.incrementCounter();
        
        // Renderizar
        this.render();
        
        // Reproducir sonido
        AudioManager.playRandomFart();
        
        // Animar elementos
        this.animateClick();
        
        console.log('💨 Pedo #' + this.counter);
    },
    
    /**
     * Anima los elementos después de un click
     */
    animateClick() {
        const mainBtn = document.getElementById('mainButton');
        const counterDisplay = document.getElementById('counterDisplay');
        
        if (mainBtn) {
            mainBtn.classList.add('animate-bounce');
            setTimeout(() => {
                mainBtn.classList.remove('animate-bounce');
            }, 500);
        }
        
        if (counterDisplay) {
            counterDisplay.classList.add('animate-pulse');
            setTimeout(() => {
                counterDisplay.classList.remove('animate-pulse');
            }, 400);
        }
        
        // Animación espectacular de pedo
        this.createFartAnimation();
    },
    
    /**
     * Crea una animación espectacular de pedo
     */
    createFartAnimation() {
        const container = document.getElementById('fartAnimationContainer');
        if (!container) return;
        
        // Limpiar partículas anteriores
        container.innerHTML = '';
        
        // Crear nube principal
        const cloud = document.createElement('div');
        cloud.className = 'fart-cloud';
        cloud.style.animation = 'fartCloud 1.5s ease-out forwards';
        container.appendChild(cloud);
        
        // Crear 8 partículas que salen en diferentes direcciones
        const particleCount = 8;
        const emojis = ['💨', '💨', '💨', '💨', '💨', '💨', '💨', '💨'];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'fart-particle';
            particle.textContent = emojis[i];
            
            // Calcular ángulo para dispersión circular
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = 80;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance - 100; // Más hacia arriba
            
            // Añadir variación aleatoria
            const randomX = (Math.random() - 0.5) * 30;
            const randomY = (Math.random() - 0.5) * 30;
            
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.setProperty('--tx', `${tx + randomX}px`);
            particle.style.setProperty('--ty', `${ty + randomY}px`);
            
            // Duración aleatoria para variación
            const duration = 1 + Math.random() * 0.8;
            particle.style.animation = `fartBurst ${duration}s ease-out forwards`;
            particle.style.animationDelay = `${Math.random() * 0.1}s`;
            
            container.appendChild(particle);
        }
    },
    
    /**
     * Muestra el modal de confirmación para Reset
     */
    showResetConfirm() {
        const modal = document.getElementById('confirmModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    },
    
    /**
     * Oculta el modal de confirmación
     */
    hideResetConfirm() {
        const modal = document.getElementById('confirmModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    },
    
    /**
     * Maneja el reset del contador
     */
    handleReset() {
        this.counter = Storage.resetCounter();
        this.hideResetConfirm();
        this.render();
        
        // Animar reset
        const counterDisplay = document.getElementById('counterDisplay');
        if (counterDisplay) {
            counterDisplay.classList.add('animate-shake');
            setTimeout(() => {
                counterDisplay.classList.remove('animate-shake');
            }, 300);
        }
        
        console.log('🔄 Contador resetado');
    },
    
    /**
     * Toggle del sonido
     */
    toggleSound() {
        const enabled = !AudioManager.isSoundEnabled();
        AudioManager.setSoundEnabled(enabled);
        
        // Actualizar UI
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.setAttribute('aria-pressed', enabled.toString());
            soundToggle.textContent = enabled ? '🔊 Sonido' : '🔇 Sonido';
        }
        
        // Mostrar/ocultar volumen
        const volumeSection = document.getElementById('volumeSection');
        if (volumeSection) {
            volumeSection.style.display = enabled ? 'flex' : 'none';
        }
    },
    
    /**
     * Maneja cambios en el volumen
     */
    handleVolumeChange(e) {
        const volume = parseInt(e.target.value, 10);
        AudioManager.setVolume(volume);
        this.updateVolumeDisplay();
    },
    
    /**
     * Actualiza la visualización del volumen
     */
    updateVolumeDisplay() {
        const slider = document.getElementById('volumeSlider');
        const valueSpan = document.getElementById('volumeValue');
        
        if (slider && valueSpan) {
            valueSpan.textContent = slider.value + '%';
        }
    },
    
    /**
     * Muestra el modal de información
     */
    showInfoModal() {
        const modal = document.getElementById('infoModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    },
    
    /**
     * Oculta el modal de información
     */
    hideInfoModal() {
        const modal = document.getElementById('infoModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    },
    
    /**
     * Cierra todos los modales
     */
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            this.closeModal(modal);
        });
    },
    
    /**
     * Cierra un modal específico
     */
    closeModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    },
    
    /**
     * Renderiza la UI
     */
    render() {
        const counterDisplay = document.getElementById('counterDisplay');
        if (counterDisplay) {
            counterDisplay.textContent = this.counter;
        }
    },
    
    /**
     * Obtiene el contador actual
     */
    getCounter() {
        return this.counter;
    },
    
    /**
     * Resetea manualmente el contador (sin modal)
     */
    resetManually() {
        this.counter = Storage.resetCounter();
        this.render();
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    // Si el script se carga después
    App.init();
}

// Exportar para Node.js (si es necesario)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
