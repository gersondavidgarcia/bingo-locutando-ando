const configGuardada = JSON.parse(localStorage.getItem('bingo_config')) || {
    cartones: 18,
    modo: 75
};

const TOTAL_CARTONES = parseInt(configGuardada.cartones);
const MAX_BALOTAS = parseInt(configGuardada.modo);

let bombo = [];
let historialSacadas = [];

async function toggleFullScreen() {
    try {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            const docEl = document.documentElement;
            if (docEl.requestFullscreen) {
                await docEl.requestFullscreen();
            } else if (docEl.webkitRequestFullscreen) {
                await docEl.webkitRequestFullscreen();
            }

            if (screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock('portrait');
            }
        } else {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen();
            }
            
            if (screen.orientation && screen.orientation.unlock) {
                screen.orientation.unlock();
            }
        }
    } catch (err) {
        console.log("Error al ajustar pantalla u orientación:", err);
    }
}

function obtenerLetra(num) {
    if (MAX_BALOTAS === 75) {
        if (num <= 15) return 'B';
        if (num <= 30) return 'I';
        if (num <= 45) return 'N';
        if (num <= 60) return 'G';
        return 'O';
    }
    return '';
}

function generarCarton75() {
    const rangos = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };
    const columnas = { B: [], I: [], N: [], G: [], O: [] };
    
    Object.keys(rangos).forEach(letra => {
        const [min, max] = rangos[letra];
        while (columnas[letra].length < 5) {
            let num = Math.floor(Math.random() * (max - min + 1)) + min;
            if (!columnas[letra].includes(num)) {
                columnas[letra].push(num);
            }
        }
    });
    return columnas;
}

function renderizarEstructura() {
    const grid = document.getElementById('cartonesGrid');
    grid.innerHTML = '';

    for (let i = 1; i <= TOTAL_CARTONES; i++) {
        const datos = generarCarton75();
        const carton = document.createElement('div');
        carton.className = 'carton';

        carton.innerHTML = `
            <div class="star-badge">★${i}</div>
            <div class="bingo-header-row">
                <span>B</span><span>I</span><span>N</span><span>G</span><span>O</span>
            </div>
            <div class="carton-grid-inner"></div>
        `;

        grid.appendChild(carton);
        const innerGrid = carton.querySelector('.carton-grid-inner');

        for (let fila = 0; fila < 5; fila++) {
            ['B', 'I', 'N', 'G', 'O'].forEach((letra, colIdx) => {
                const celda = document.createElement('div');
                celda.className = 'celda';

                if (fila === 2 && colIdx === 2) {
                    celda.classList.add('vacia');
                    celda.innerHTML = `<span class="num-val">★</span>`;
                } else {
                    const val = datos[letra][fila];
                    celda.dataset.valor = val;
                    celda.innerHTML = `<span class="num-val">${val}</span>`;
                }
                innerGrid.appendChild(celda);
            });
        }
    }

    const tabla = document.getElementById('tablaNumeros');
    tabla.innerHTML = '';

    const cols = 5;
    const filasNecesarias = Math.ceil(MAX_BALOTAS / cols);
    
    for (let f = 0; f < filasNecesarias; f++) {
        const fila = document.createElement('div');
        fila.className = 'fila-numeros';
        
        for (let c = 0; c < cols; c++) {
            const num = f * cols + (c + 1);
            if (num <= MAX_BALOTAS) {
                const bolita = document.createElement('div');
                bolita.className = 'bolita';
                bolita.id = `ctrl-${num}`;
                bolita.textContent = num;
                fila.appendChild(bolita);
            }
        }
        tabla.appendChild(fila);
    }
}

function sacarBola(e) {
    if (bombo.length === 0) return;

    const idx = Math.floor(Math.random() * bombo.length);
    const numero = bombo.splice(idx, 1)[0];
    const letra = obtenerLetra(numero);

    historialSacadas.unshift({ numero, letra });

    const display = document.getElementById('numeroDisplay');
    display.innerHTML = `${letra}${numero}`;

    document.getElementById('statsDisplay').textContent = `${historialSacadas.length}/${MAX_BALOTAS}`;

    document.querySelectorAll(`.celda[data-valor="${numero}"]`).forEach(el => {
        el.classList.add('marcada');
    });

    const ctrlEl = document.getElementById(`ctrl-${numero}`);
    if (ctrlEl) ctrlEl.classList.add('marcada');

    const recientesLista = document.getElementById('recientesLista');
    recientesLista.innerHTML = '';
    historialSacadas.slice(0, 4).forEach(item => {
        const bola = document.createElement('div');
        bola.className = 'mini-bola';
        bola.textContent = item.numero;
        recientesLista.appendChild(bola);
    });
}

function reiniciarJuego() {
    bombo = Array.from({ length: MAX_BALOTAS }, (_, i) => i + 1);
    historialSacadas = [];
    document.getElementById('numeroDisplay').textContent = '--';
    document.getElementById('statsDisplay').textContent = `0/${MAX_BALOTAS}`;
    document.getElementById('recientesLista').innerHTML = '';
    renderizarEstructura();
}

document.addEventListener('DOMContentLoaded', reiniciarJuego);
