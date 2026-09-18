/* ============================================
   TEMAS DISPONIBLES
   ============================================ */
const TEMAS_DISPONIBLES = [
    'Verde', 'Azul', 'Rojo', 'Negro', 'Naranja', 'Morado',
    'Clásico', 'Dorado', 'Madera',
    'Kate', 'Cyberpunk', 'Volcano', 'Pixel', 'Esmeralda',
    'Candy', 'Oro', 'Pacifico', 'Halloween', 'Sport', 'Titan', 'Bronce'
];

/* ============================================
   ABRIR / CERRAR MODAL
   ============================================ */
function abrirConfiguracion() {
    const modal = document.getElementById('modalConfig');
    if (modal) {
        modal.classList.add('visible');
        cargarConfigEnModal();
        volverAlMenuConfig(); // siempre empezamos en el menú
    }
}

function cerrarConfiguracion() {
    const modal = document.getElementById('modalConfig');
    if (modal) modal.classList.remove('visible');
}

/* ============================================
   NAVEGACIÓN ENTRE PANTALLAS DEL MODAL
   ============================================ */
function mostrarPantallaConfig(idPantalla) {
    document.querySelectorAll('.config-pantalla').forEach(p => p.classList.remove('visible'));
    const pantalla = document.getElementById(idPantalla);
    if (pantalla) pantalla.classList.add('visible');

    // Actualizamos el título del modal según la pantalla
    const titulo = document.getElementById('modalTitulo');
    if (!titulo) return;
    switch (idPantalla) {
        case 'pantallaGeneral':   titulo.textContent = '⚙️ General'; break;
        case 'pantallaTemas':     titulo.textContent = '🎨 Temas'; break;
        case 'pantallaResaltado': titulo.textContent = '✨ Resaltado de figura'; break;
        case 'pantallaApariencia':titulo.textContent = '📐 Apariencia'; break;
        default:                  titulo.textContent = '⚙️ Configuración';
    }

    // Scroll al inicio del modal
    const box = document.querySelector('.modal-box');
    if (box) box.scrollTop = 0;
}

function abrirSeccionConfig(nombre) {
    switch (nombre) {
        case 'general':    mostrarPantallaConfig('pantallaGeneral'); break;
        case 'temas':      mostrarPantallaConfig('pantallaTemas'); break;
        case 'resaltado':  mostrarPantallaConfig('pantallaResaltado'); break;
        case 'apariencia': mostrarPantallaConfig('pantallaApariencia'); break;
        default:           volverAlMenuConfig();
    }
}

function volverAlMenuConfig() {
    mostrarPantallaConfig('pantallaMenu');
}

/* ============================================
   CARGAR CONFIGURACIÓN EN EL MODAL
   ============================================ */
function cargarConfigEnModal() {
    try {
        const raw = localStorage.getItem('bingo_config');
        if (raw) {
            const config = JSON.parse(raw);
            const setVal = (id, v) => {
                const el = document.getElementById(id);
                if (el && v !== undefined) el.value = v;
            };
            setVal('cantCartones', config.cartones);
            setVal('usarBaseDatos', config.usarDB ? 'si' : 'no');
            setVal('formatoControl', config.formatoControl || '15x5');
            setVal('cantidadFiguras', config.cantidadFiguras);
            setVal('tamanoControl', config.tamanoControl);
            setVal('tamanoFiguras', config.tamanoFiguras);

            // Parámetros del resaltado de figura
            setVal('intensidadGlow', config.intensidadGlow !== undefined ? config.intensidadGlow : 95);
            setVal('intensidadSuave', config.intensidadSuave !== undefined ? config.intensidadSuave : 55);
            setVal('duracionPorCasilla', config.duracionPorCasilla !== undefined ? config.duracionPorCasilla : 260);

            const temasGuardados = Array.isArray(config.temasActivos) && config.temasActivos.length > 0
                ? config.temasActivos : ['Verde'];
            document.querySelectorAll('.tema-check').forEach(chk => {
                chk.checked = temasGuardados.includes(chk.value);
            });
        } else {
            document.querySelectorAll('.tema-check').forEach(chk => {
                chk.checked = chk.value === 'Verde';
            });
        }
    } catch (e) {}
    actualizarLabelsSliders();
}

/* ============================================
   LABELS DINÁMICOS DE LOS SLIDERS
   ============================================ */
function actualizarLabelsSliders() {
    const rangoTamano = document.getElementById('tamanoControl');
    const rangoFiguras = document.getElementById('tamanoFiguras');
    const valTamano = document.getElementById('valTamanoControl');
    const valFiguras = document.getElementById('valTamanoFiguras');
    if (rangoTamano && valTamano) {
        valTamano.textContent = rangoTamano.value + '%';
        rangoTamano.oninput = () => { valTamano.textContent = rangoTamano.value + '%'; };
    }
    if (rangoFiguras && valFiguras) {
        valFiguras.textContent = rangoFiguras.value + 'px';
        rangoFiguras.oninput = () => { valFiguras.textContent = rangoFiguras.value + 'px'; };
    }

    // Sliders del resaltado de figura
    const rangoGlow = document.getElementById('intensidadGlow');
    const valGlow = document.getElementById('valIntensidadGlow');
    if (rangoGlow && valGlow) {
        valGlow.textContent = rangoGlow.value + '%';
        rangoGlow.oninput = () => { valGlow.textContent = rangoGlow.value + '%'; };
    }

    const rangoSuave = document.getElementById('intensidadSuave');
    const valSuave = document.getElementById('valIntensidadSuave');
    if (rangoSuave && valSuave) {
        valSuave.textContent = rangoSuave.value + '%';
        rangoSuave.oninput = () => { valSuave.textContent = rangoSuave.value + '%'; };
    }

    const rangoDur = document.getElementById('duracionPorCasilla');
    const valDur = document.getElementById('valDuracionPorCasilla');
    if (rangoDur && valDur) {
        valDur.textContent = rangoDur.value + ' ms';
        rangoDur.oninput = () => { valDur.textContent = rangoDur.value + ' ms'; };
    }
}

/* ============================================
   GUARDAR CONFIGURACIÓN
   ============================================ */
function guardarConfiguracion() {
    const temasActivos = [];
    document.querySelectorAll('.tema-check').forEach(chk => {
        if (chk.checked) temasActivos.push(chk.value);
    });
    if (temasActivos.length === 0) temasActivos.push('Verde');

    const config = {
        cartones: document.getElementById('cantCartones')?.value || '15',
        modo: '75',
        usarDB: document.getElementById('usarBaseDatos')?.value === 'si',
        formatoControl: document.getElementById('formatoControl')?.value || '15x5',
        cantidadFiguras: parseInt(document.getElementById('cantidadFiguras')?.value || '2'),
        tamanoControl: parseInt(document.getElementById('tamanoControl')?.value || '58'),
        tamanoFiguras: parseInt(document.getElementById('tamanoFiguras')?.value || '42'),
        // Parámetros del resaltado de figura (el color lo define el tema)
        intensidadGlow: parseInt(document.getElementById('intensidadGlow')?.value || '95'),
        intensidadSuave: parseInt(document.getElementById('intensidadSuave')?.value || '55'),
        duracionPorCasilla: parseInt(document.getElementById('duracionPorCasilla')?.value || '260'),
        temasActivos: temasActivos
    };
    localStorage.setItem('bingo_config', JSON.stringify(config));
    cerrarConfiguracion();
}

/* ============================================
   INICIAR JUEGO DIRECTO
   ============================================ */
function iniciarJuegoDirecto() {
    const existente = localStorage.getItem('bingo_config');
    if (!existente) {
        const temasActivos = [];
        document.querySelectorAll('.tema-check').forEach(chk => {
            if (chk.checked) temasActivos.push(chk.value);
        });
        if (temasActivos.length === 0) temasActivos.push('Verde');
        const config = {
            cartones: document.getElementById('cantCartones')?.value || '15',
            modo: '75',
            usarDB: document.getElementById('usarBaseDatos')?.value === 'si',
            formatoControl: document.getElementById('formatoControl')?.value || '15x5',
            cantidadFiguras: parseInt(document.getElementById('cantidadFiguras')?.value || '2'),
            tamanoControl: parseInt(document.getElementById('tamanoControl')?.value || '58'),
            tamanoFiguras: parseInt(document.getElementById('tamanoFiguras')?.value || '42'),
            intensidadGlow: parseInt(document.getElementById('intensidadGlow')?.value || '95'),
            intensidadSuave: parseInt(document.getElementById('intensidadSuave')?.value || '55'),
            duracionPorCasilla: parseInt(document.getElementById('duracionPorCasilla')?.value || '260'),
            temasActivos: temasActivos
        };
        localStorage.setItem('bingo_config', JSON.stringify(config));
    }
    window.location.href = 'juego.html';
}

/* ============================================
   CLICK FUERA DEL MODAL → CERRAR
   ============================================ */
document.addEventListener('click', (e) => {
    const modal = document.getElementById('modalConfig');
    if (modal && e.target === modal) cerrarConfiguracion();
});