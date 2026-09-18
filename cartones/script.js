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

            const temasGuardados = Array.isArray(config.temasActivos) && config.temasActivos.length > 0
                ? config.temasActivos
                : ['Verde'];
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
}

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
        temasActivos: temasActivos
    };
    localStorage.setItem('bingo_config', JSON.stringify(config));
    cerrarConfiguracion();
}

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
            temasActivos: temasActivos
        };
        localStorage.setItem('bingo_config', JSON.stringify(config));
    }
    window.location.href = 'juego.html';
}

document.addEventListener('click', (e) => {
    const modal = document.getElementById('modalConfig');
    if (modal && e.target === modal) cerrarConfiguracion();
});