/* ============================================
   FUNCIONES DEL MENÚ (index.html)
   ============================================ */
function abrirConfiguracion() {
    const modal = document.getElementById('modalConfig');
    if (modal) {
        modal.classList.add('visible');
        cargarConfigEnModal();
    }
}

function cerrarConfiguracion() {
    const modal = document.getElementById('modalConfig');
    if (modal) modal.classList.remove('visible');
}

function cargarConfigEnModal() {
    try {
        const raw = localStorage.getItem('bingo_config');
        if (raw) {
            const config = JSON.parse(raw);
            const selCartones = document.getElementById('cantCartones');
            const selModo = document.getElementById('maxBolas');
            const selDB = document.getElementById('usarBaseDatos');
            if (selCartones && config.cartones) selCartones.value = config.cartones;
            if (selModo && config.modo) selModo.value = config.modo;
            if (selDB && config.usarDB !== undefined) selDB.value = config.usarDB ? 'si' : 'no';
        }
    } catch (e) {}
}

function guardarConfiguracion() {
    const usarDB = document.getElementById('usarBaseDatos')?.value === 'si';
    const config = {
        cartones: document.getElementById('cantCartones')?.value || '15',
        modo: document.getElementById('maxBolas')?.value || '75',
        usarDB: usarDB
    };
    localStorage.setItem('bingo_config', JSON.stringify(config));
    cerrarConfiguracion();
}

function iniciarJuegoDirecto() {
    const existente = localStorage.getItem('bingo_config');
    if (!existente) {
        const usarDB = document.getElementById('usarBaseDatos')?.value === 'si';
        const config = {
            cartones: document.getElementById('cantCartones')?.value || '15',
            modo: document.getElementById('maxBolas')?.value || '75',
            usarDB: usarDB
        };
        localStorage.setItem('bingo_config', JSON.stringify(config));
    }
    window.location.href = 'juego.html';
}

/* Cerrar modal al tocar el fondo oscuro */
document.addEventListener('click', (e) => {
    const modal = document.getElementById('modalConfig');
    if (modal && e.target === modal) cerrarConfiguracion();
});