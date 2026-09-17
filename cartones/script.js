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
            const selFig = document.getElementById('cantidadFiguras');
            const rangoControl = document.getElementById('tamanoControl');
            const rangoFiguras = document.getElementById('tamanoFiguras');
            const valControl = document.getElementById('valTamanoControl');
            const valFiguras = document.getElementById('valTamanoFiguras');

            if (selCartones && config.cartones) selCartones.value = config.cartones;
            if (selModo && config.modo) selModo.value = config.modo;
            if (selDB && config.usarDB !== undefined) selDB.value = config.usarDB ? 'si' : 'no';
            if (selFig && config.cantidadFiguras !== undefined) selFig.value = config.cantidadFiguras;
            if (rangoControl && config.tamanoControl !== undefined) {
                rangoControl.value = config.tamanoControl;
                if (valControl) valControl.textContent = config.tamanoControl + '%';
            }
            if (rangoFiguras && config.tamanoFiguras !== undefined) {
                rangoFiguras.value = config.tamanoFiguras;
                if (valFiguras) valFiguras.textContent = config.tamanoFiguras + 'px';
            }
        }
    } catch (e) {}
    actualizarLabelsSliders();
}

function actualizarLabelsSliders() {
    const rangoControl = document.getElementById('tamanoControl');
    const rangoFiguras = document.getElementById('tamanoFiguras');
    const valControl = document.getElementById('valTamanoControl');
    const valFiguras = document.getElementById('valTamanoFiguras');

    if (rangoControl && valControl) {
        rangoControl.oninput = () => { valControl.textContent = rangoControl.value + '%'; };
    }
    if (rangoFiguras && valFiguras) {
        rangoFiguras.oninput = () => { valFiguras.textContent = rangoFiguras.value + 'px'; };
    }
}

function guardarConfiguracion() {
    const usarDB = document.getElementById('usarBaseDatos')?.value === 'si';
    const cantidadFiguras = parseInt(document.getElementById('cantidadFiguras')?.value || '2');
    const tamanoControl = parseInt(document.getElementById('tamanoControl')?.value || '58');
    const tamanoFiguras = parseInt(document.getElementById('tamanoFiguras')?.value || '42');

    const config = {
        cartones: document.getElementById('cantCartones')?.value || '15',
        modo: document.getElementById('maxBolas')?.value || '75',
        usarDB: usarDB,
        cantidadFiguras: cantidadFiguras,
        tamanoControl: tamanoControl,
        tamanoFiguras: tamanoFiguras
    };
    localStorage.setItem('bingo_config', JSON.stringify(config));
    cerrarConfiguracion();
}

function iniciarJuegoDirecto() {
    const existente = localStorage.getItem('bingo_config');
    if (!existente) {
        const usarDB = document.getElementById('usarBaseDatos')?.value === 'si';
        const cantidadFiguras = parseInt(document.getElementById('cantidadFiguras')?.value || '2');
        const tamanoControl = parseInt(document.getElementById('tamanoControl')?.value || '58');
        const tamanoFiguras = parseInt(document.getElementById('tamanoFiguras')?.value || '42');

        const config = {
            cartones: document.getElementById('cantCartones')?.value || '15',
            modo: document.getElementById('maxBolas')?.value || '75',
            usarDB: usarDB,
            cantidadFiguras: cantidadFiguras,
            tamanoControl: tamanoControl,
            tamanoFiguras: tamanoFiguras
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