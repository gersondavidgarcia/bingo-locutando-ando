/* ============================================
   PALETAS DE COLOR (5 tonos por paleta)
   ============================================ */
const PALETAS = [
    {
        nombre: 'Esmeralda',
        colores: ['#1b5e20', '#2e7d32', '#388e3c', '#43a047', '#4caf50'],
        tema: '#2e7d32'
    },
    {
        nombre: 'Zafiro',
        colores: ['#0d47a1', '#1565c0', '#1976d2', '#1e88e5', '#2196f3'],
        tema: '#1565c0'
    },
    {
        nombre: 'Rubí',
        colores: ['#7f0000', '#b71c1c', '#c62828', '#d32f2f', '#e53935'],
        tema: '#c62828'
    },
    {
        nombre: 'Onyx',
        colores: ['#1c1c1c', '#2c2c2c', '#3d3d3d', '#4d4d4d', '#5e5e5e'],
        tema: '#3d3d3d'
    },
    {
        nombre: 'Ámbar',
        colores: ['#b45309', '#d97706', '#ea8c1c', '#f59e0b', '#fbbf24'],
        tema: '#d97706'
    },
    {
        nombre: 'Amatista',
        colores: ['#4a148c', '#6a1b9a', '#7b1fa2', '#8e24aa', '#9c27b0'],
        tema: '#7b1fa2'
    }
];

let paletaActual = 0;

/* ============================================
   CONFIGURACIÓN GLOBAL
   ============================================ */
let TOTAL_CARTONES = 15;
let MAX_BALOTAS = 75;
let MODO_JUEGO = 75;

let bombo = [];
let historialSacadas = [];

const RANGOS_BINGO = {
    B: [1, 15],
    I: [16, 30],
    N: [31, 45],
    G: [46, 60],
    O: [61, 75]
};

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
            if (selCartones && config.cartones) selCartones.value = config.cartones;
            if (selModo && config.modo) selModo.value = config.modo;
        }
    } catch (e) {
        // sin config previa, se queda con los valores por defecto
    }
}

function guardarConfiguracion() {
    const config = {
        cartones: document.getElementById('cantCartones')?.value || '15',
        modo: document.getElementById('maxBolas')?.value || '75'
    };
    localStorage.setItem('bingo_config', JSON.stringify(config));
    cerrarConfiguracion();
}

function iniciarJuegoDirecto() {
    // Si el usuario ya abrió config antes, la respetamos.
    // Si no hay nada guardado, usamos los defaults del modal.
    const existente = localStorage.getItem('bingo_config');
    if (!existente) {
        const config = {
            cartones: document.getElementById('cantCartones')?.value || '15',
            modo: document.getElementById('maxBolas')?.value || '75'
        };
        localStorage.setItem('bingo_config', JSON.stringify(config));
    }
    window.location.href = 'juego.html';
}

/* Cerrar modal al tocar el fondo oscuro */
document.addEventListener('click', (e) => {
    const modal = document.getElementById('modalConfig');
    if (modal && e.target === modal) {
        cerrarConfiguracion();
    }
});

/* ============================================
   LECTURA DE CONFIGURACIÓN (para juego.html)
   ============================================ */
function cargarConfiguracion() {
    try {
        const raw = localStorage.getItem('bingo_config');
        if (raw) {
            const config = JSON.parse(raw);
            TOTAL_CARTONES = parseInt(config.cartones) || 15;
            MODO_JUEGO = parseInt(config.modo) || 75;
            MAX_BALOTAS = MODO_JUEGO;
        }
    } catch (e) {
        console.warn('Config no leída, usando default.');
    }

    const grid = document.getElementById('cartonesGrid');
    if (grid) grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
}

/* ============================================
   GENERACIÓN DE CARTONES
   ============================================ */
function generarCarton75() {
    const columnas = { B: [], I: [], N: [], G: [], O: [] };
    
    Object.keys(RANGOS_BINGO).forEach(letra => {
        const [min, max] = RANGOS_BINGO[letra];
        while (columnas[letra].length < 5) {
            let num = Math.floor(Math.random() * (max - min + 1)) + min;
            if (!columnas[letra].includes(num)) {
                columnas[letra].push(num);
            }
        }
    });

    return columnas;
}

function obtenerLetra(num) {
    if (num <= 15) return 'B';
    if (num <= 30) return 'I';
    if (num <= 45) return 'N';
    if (num <= 60) return 'G';
    return 'O';
}

/* ============================================
   SELECCIÓN DE COLOR POR CARTÓN (patrón A,A,A,B,B,B...)
   ============================================ */
function obtenerIndiceTonoPorCarton(idx) {
    const bloque = Math.floor(idx / 3); // 0, 1, 2, 3, 4...
    const par = bloque % 2;            // 0 → tono A, 1 → tono B
    return par === 0 ? 0 : 2;
}

/* ============================================
   APLICAR PALETA AL DOM
   ============================================ */
function aplicarPaleta() {
    const paleta = PALETAS[paletaActual];
    document.documentElement.style.setProperty('--tema-color', paleta.tema);
    
    const btnSacar = document.querySelector('.btn-sacar-bola');
    if (btnSacar) btnSacar.style.background = paleta.tema;
    
    const sphere = document.querySelector('.bolillero-sphere');
    if (sphere) {
        sphere.style.background = `radial-gradient(circle at 30% 30%, ${paleta.colores[4]}, ${paleta.colores[0]})`;
    }
}

/* ============================================
   RENDERIZADO
   ============================================ */
function renderizarEstructura() {
    const grid = document.getElementById('cartonesGrid');
    if (!grid) return;
    
    grid.innerHTML = '';

    const paleta = PALETAS[paletaActual];
    const colores = paleta.colores;

    for (let i = 1; i <= TOTAL_CARTONES; i++) {
        const datos = generarCarton75();
        const carton = document.createElement('div');
        carton.className = 'carton';
        
        const idxTono = obtenerIndiceTonoPorCarton(i - 1);
        const colorHex = colores[idxTono];
        const colorDark = paleta.colores[0];

        carton.style.setProperty('--carton-color', colorHex);
        carton.style.setProperty('--carton-color-dark', colorDark);

        carton.innerHTML = `
            <div class="carton-header">
                <span class="carton-title">CARTÓN ${i}</span>
            </div>
            <div class="bingo-header-row">
                <span>B</span><span>I</span><span>N</span><span>G</span><span>O</span>
            </div>
            <div class="carton-grid-inner" style="grid-template-columns: repeat(5, 1fr);"></div>
        `;

        grid.appendChild(carton);
        const innerGrid = carton.querySelector('.carton-grid-inner');

        for (let fila = 0; fila < 5; fila++) {
            ['B', 'I', 'N', 'G', 'O'].forEach((letra, colIdx) => {
                const celda = document.createElement('div');
                celda.className = 'celda';

                if (fila === 2 && colIdx === 2) {
                    celda.classList.add('vacia');
                    celda.innerHTML = `<span class="num-val">${i}</span>`;
                } else {
                    const val = datos[letra][fila];
                    celda.dataset.valor = val;
                    celda.innerHTML = `<span class="num-val">${val}</span>`;
                }
                innerGrid.appendChild(celda);
            });
        }
    }

    aplicarPaleta();
    renderizarTablaControl();
}

function renderizarTablaControl() {
    const tabla = document.getElementById('tablaNumeros');
    if (!tabla) return;
    tabla.innerHTML = '';

    if (MODO_JUEGO === 75) {
        for (let f = 0; f < 5; f++) {
            const fila = document.createElement('div');
            fila.className = 'fila-numeros';
            for (let c = 1; c <= 15; c++) {
                const num = f * 15 + c;
                const bolita = document.createElement('div');
                bolita.className = 'bolita';
                bolita.id = `ctrl-${num}`;
                bolita.textContent = num;
                fila.appendChild(bolita);
            }
            tabla.appendChild(fila);
        }
    } else if (MODO_JUEGO === 90) {
        for (let f = 0; f < 6; f++) {
            const fila = document.createElement('div');
            fila.className = 'fila-numeros';
            for (let c = 1; c <= 15; c++) {
                const num = f * 15 + c;
                const bolita = document.createElement('div');
                bolita.className = 'bolita';
                bolita.id = `ctrl-${num}`;
                bolita.textContent = num;
                fila.appendChild(bolita);
            }
            tabla.appendChild(fila);
        }
    } else if (MODO_JUEGO === 100) {
        for (let f = 0; f < 5; f++) {
            const fila = document.createElement('div');
            fila.className = 'fila-numeros';
            fila.style.gridTemplateColumns = 'repeat(20, 1fr)';
            for (let c = 1; c <= 20; c++) {
                const num = f * 20 + c;
                const bolita = document.createElement('div');
                bolita.className = 'bolita';
                bolita.id = `ctrl-${num}`;
                bolita.textContent = num;
                fila.appendChild(bolita);
            }
            tabla.appendChild(fila);
        }
    }
}

/* ============================================
   LÓGICA DEL JUEGO
   ============================================ */
function sacarBola(e) {
    if (bombo.length === 0) return;

    if (typeof crearExplosion === 'function' && e) {
        crearExplosion(e);
    }

    const idx = Math.floor(Math.random() * bombo.length);
    const numero = bombo.splice(idx, 1)[0];
    const letra = obtenerLetra(numero);

    historialSacadas.unshift({ numero, letra });

    const display = document.getElementById('numeroDisplay');
    if (display) {
        display.innerHTML = `<span style="font-size: 0.75rem; display: block; line-height: 1;">${letra}</span>${numero}`;
    }

    const stats = document.getElementById('statsDisplay');
    if (stats) stats.textContent = `${historialSacadas.length}/${MAX_BALOTAS}`;

    document.querySelectorAll(`.celda[data-valor="${numero}"]`).forEach(el => {
        el.classList.add('marcada');
        el.classList.add('animar-marca');
    });

    const ctrlEl = document.getElementById(`ctrl-${numero}`);
    if (ctrlEl) ctrlEl.classList.add('marcada');

    const recientesLista = document.getElementById('recientesLista');
    if (recientesLista) {
        recientesLista.innerHTML = '';
        historialSacadas.slice(0, 6).forEach(item => {
            const bola = document.createElement('div');
            bola.className = 'mini-bola entrando';
            bola.innerHTML = `<span>${item.numero}</span>`;
            recientesLista.appendChild(bola);
        });
    }
}

function reiniciarJuego() {
    bombo = Array.from({ length: MAX_BALOTAS }, (_, i) => i + 1);
    historialSacadas = [];
    
    const display = document.getElementById('numeroDisplay');
    if (display) display.textContent = '--';
    
    const stats = document.getElementById('statsDisplay');
    if (stats) stats.textContent = `0/${MAX_BALOTAS}`;
    
    const recientes = document.getElementById('recientesLista');
    if (recientes) recientes.innerHTML = '';
    
    renderizarEstructura();
}

function cambiarCartonesYPaleta() {
    paletaActual = (paletaActual + 1) % PALETAS.length;
    reiniciarJuego();
}

/* ============================================
   INICIALIZACIÓN
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('cartonesGrid')) {
        paletaActual = Math.floor(Math.random() * PALETAS.length);
        cargarConfiguracion();
        reiniciarJuego();

        const btnCambiar = document.querySelector('.btn-cambiar');
        if (btnCambiar) {
            btnCambiar.onclick = cambiarCartonesYPaleta;
        }
    }
});
