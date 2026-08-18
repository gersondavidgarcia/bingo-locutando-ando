(function() {
    // 🟢 CARGAR CONFIGURACIÓN DEL MENÚ
    let configuracion = { totalCartones: 15, vozActiva: true };
    const configGuardada = localStorage.getItem('bingoConfig');
    if (configGuardada) {
        configuracion = JSON.parse(configGuardada);
    }
    const TOTAL_CARTONES = configuracion.totalCartones;

    let markedNumbers = new Set();
    let currentCartones = [];
    let bolasDisponibles = [];
    let historialBolas = [];
    let isAnimating = false;
    let esPrimeraBola = true;

    let lineaCantadaGlobal = false;
    let bingoCantadoGlobal = false;
    let pausarMarcadoGeneral = false;

    let estadoAlertasA1 = new Map();

    const paletasColores = [
        { border: '#0d47a1', bg: '#42a5f5' },
        { border: '#01579b', bg: '#29b6f6' },
        { border: '#006064', bg: '#26c6da' },
        { border: '#1a237e', bg: '#5c6bc0' },
        { border: '#004d40', bg: '#26a69a' },
        { border: '#1b5e20', bg: '#66bb6a' },
        { border: '#2e7d32', bg: '#4caf50' },
        { border: '#33691e', bg: '#8bc34a' },
        { border: '#054425', bg: '#388e3c' },
        { border: '#b71c1c', bg: '#ef5350' },
        { border: '#880e4f', bg: '#ec407a' },
        { border: '#78909c', bg: '#e53935' },
        { border: '#4a148c', bg: '#ab47bc' },
        { border: '#311b92', bg: '#7e57c2' },
        { border: '#6a1b9a', bg: '#8e24aa' },
        { border: '#e65100', bg: '#ff7043' },
        { border: '#d84315', bg: '#ff5722' },
        { border: '#bf360c', bg: '#f4511e' },
        { border: '#37474f', bg: '#78909c' },
        { border: '#4e342e', bg: '#8d6e63' },
        { border: '#263238', bg: '#546e7a' },
        { border: '#00838f', bg: '#00acc1' },
        { border: '#ad1457', bg: '#d81b60' },
        { border: '#1565c0', bg: '#1e88e5' },
        { border: '#283593', bg: '#3f51b5' }
    ];

    const coloresExteriorBola = [
        '#1f77b4', '#2ca02c', '#d62728', '#9467bd', 
        '#17becf', '#e377c2', '#393b79', '#6b6ecf'
    ];

    function animarCirculoEnCelda(celda) {
        return new Promise((resolve) => {
            if (!celda) {
                resolve();
                return;
            }

            const rect = celda.getBoundingClientRect();
            const centroX = rect.left + rect.width / 2;
            const centroY = rect.top + rect.height / 2;

            const circulo = document.createElement('div');
            circulo.className = 'circulo-foco-ganador';
            
            circulo.style.left = `${centroX}px`;
            circulo.style.top = `${centroY}px`;
            circulo.style.width = `${Math.max(rect.width * 1.5, 60)}px`;
            circulo.style.height = `${Math.max(rect.height * 1.5, 60)}px`;

            document.body.appendChild(circulo);

            void circulo.offsetWidth;

            setTimeout(() => {
                if (circulo.parentNode) {
                    circulo.remove();
                }
                resolve();
            }, 1800);
        });
    }

    function obtenerColorExterior(numero) {
        if (!numero) return '#1f77b4';
        const indice = Math.min(Math.floor((numero - 1) / 10), coloresExteriorBola.length - 1);
        return coloresExteriorBola[indice];
    }

    function decirNumero(numero) {
        if ('speechSynthesis' in window && configuracion.vozActiva) {
            window.speechSynthesis.cancel();
            const mensaje = new SpeechSynthesisUtterance(numero.toString());
            mensaje.lang = 'es-ES';
            mensaje.rate = 1.0;
            window.speechSynthesis.speak(mensaje);
        }
    }

    function cambiarColorAleatorio() {
        const idx = Math.floor(Math.random() * paletasColores.length);
        const colorActual = paletasColores[idx];
        document.documentElement.style.setProperty('--tema-color', colorActual.border);
        document.documentElement.style.setProperty('--tema-color-bg', colorActual.bg);
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function inicializarBolillero() {
        bolasDisponibles = Array.from({ length: 90 }, (_, i) => i + 1);
        shuffle(bolasDisponibles);
        historialBolas = [];
        esPrimeraBola = true;
        pausarMarcadoGeneral = false;
    }

    function tieneDemasiadosConsecutivos(fila) {
        let maxConsecutivos = 0;
        let contadorActual = 0;
        for (let i = 0; i < 9; i++) {
            if (fila[i] === 1) {
                contadorActual++;
                if (contadorActual > maxConsecutivos) maxConsecutivos = contadorActual;
            } else {
                contadorActual = 0;
            }
        }
        return maxConsecutivos >= 4;
    }

    function generar10CartonesGlobales() {
        let intentoExitoso = false;
        let cartonesResultado = [];

        while (!intentoExitoso) {
            let mascaras = Array.from({ length: TOTAL_CARTONES }, () => 
                Array.from({ length: 3 }, () => Array(9).fill(0))
            );

            let validoEstructura = true;

            for (let i = 0; i < TOTAL_CARTONES; i++) {
                let colsConDos = shuffle([0,1,2,3,4,5,6,7,8]).slice(0, 6);
                let conteoCols = Array(9).fill(1);
                colsConDos.forEach(c => conteoCols[c] = 2);

                let subIntento = 0;
                let exitoCarton = false;

                while (subIntento < 100 && !exitoCarton) {
                    subIntento++;
                    let m = Array.from({ length: 3 }, () => Array(9).fill(0));
                    let copiaConteos = [...conteoCols];
                    let cValido = true;

                    for (let r = 0; r < 3; r++) {
                        let disponibles = [];
                        for (let c = 0; c < 9; c++) {
                            if (copiaConteos[c] > 0 && m[r][c] === 0) disponibles.push(c);
                        }
                        if (disponibles.length < 5) { cValido = false; break; }

                        shuffle(disponibles);
                        let elegidas = disponibles.slice(0, 5);
                        for (let c of elegidas) {
                            m[r][c] = 1;
                        }

                        if (tieneDemasiadosConsecutivos(m[r])) {
                            cValido = false;
                            break;
                        }

                        for (let c of elegidas) {
                            copiaConteos[c]--;
                        }
                    }

                    if (cValido && copiaConteos.every(v => v === 0)) {
                        mascaras[i] = m;
                        exitoCarton = true;
                    }
                }

                if (!exitoCarton) {
                    validoEstructura = false;
                    break;
                }
            }

            if (!validoEstructura) continue;

            cartonesResultado = Array.from({ length: TOTAL_CARTONES }, () => 
                Array.from({ length: 3 }, () => Array(9).fill(null))
            );

            let exitoAsignacion = true;

            for (let col = 0; col < 9; col++) {
                let min = (col === 0) ? 1 : col * 10;
                let max = (col === 8) ? 90 : (col * 10) + 9;
                let todosNumeros = Array.from({ length: max - min + 1 }, (_, k) => min + k);
                
                let casillerosDisponibles = [];
                for (let i = 0; i < TOTAL_CARTONES; i++) {
                    for (let r = 0; r < 3; r++) {
                        if (mascaras[i][r][col] === 1) {
                            casillerosDisponibles.push({ carton: i, fila: r });
                        }
                    }
                }

                let totalRequerido = casillerosDisponibles.length;
                let bolsaNumerosColumna = [...todosNumeros];

                while (bolsaNumerosColumna.length < totalRequerido) {
                    let numExtra = todosNumeros[Math.floor(Math.random() * todosNumeros.length)];
                    bolsaNumerosColumna.push(numExtra);
                }

                shuffle(bolsaNumerosColumna);
                shuffle(casillerosDisponibles);

                let asignadoCorrectamente = true;
                for (let slot of casillerosDisponibles) {
                    let cIdx = slot.carton;
                    let rIdx = slot.fila;

                    let numElegidoIdx = bolsaNumerosColumna.findIndex(n => 
                        !cartonesResultado[cIdx].some(row => row.includes(n))
                    );

                    if (numElegidoIdx !== -1) {
                        cartonesResultado[cIdx][rIdx][col] = bolsaNumerosColumna[numElegidoIdx];
                        bolsaNumerosColumna.splice(numElegidoIdx, 1);
                    } else {
                        asignadoCorrectamente = false;
                        break;
                    }
                }

                if (!asignadoCorrectamente) {
                    exitoAsignacion = false;
                    break;
                }

                for (let i = 0; i < TOTAL_CARTONES; i++) {
                    let numsEnCol = [cartonesResultado[i][0][col], cartonesResultado[i][1][col], cartonesResultado[i][2][col]].filter(n => n !== null);
                    numsEnCol.sort((a, b) => a - b);
                    let ptr = 0;
                    for (let r = 0; r < 3; r++) {
                        if (cartonesResultado[i][r][col] !== null) {
                            cartonesResultado[i][r][col] = numsEnCol[ptr++];
                        }
                    }
                }
            }

            if (exitoAsignacion) {
                intentoExitoso = true;
            }
        }

        return cartonesResultado;
    }

    function renderCartones() {
        const gridContainer = document.getElementById('cartonesGrid');
        gridContainer.innerHTML = '';

        // 🟢 LÓGICA INTELIGENTE DE COLUMNAS
        if (TOTAL_CARTONES === 10) {
            // Modo 10 cartones: 2 columnas, sin reducción
            gridContainer.classList.remove('modo-15');
        } else {
            // Cualquier múltiplo de 3: 3 columnas, con reducción
            gridContainer.classList.add('modo-15');
        }

        currentCartones.forEach((carton, idx) => {
            const cartonDiv = document.createElement('div');
            cartonDiv.className = 'carton';
            cartonDiv.id = `carton-${idx + 1}`;

            const header = document.createElement('div');
            header.className = 'carton-header';
            header.id = `carton-header-${idx + 1}`;
            
            const titleSpan = document.createElement('span');
            titleSpan.className = 'carton-title';
            titleSpan.textContent = `CARTÓN ${idx + 1}`;
            header.appendChild(titleSpan);

            const badgeContainer = document.createElement('div');
            badgeContainer.id = `carton-badges-${idx + 1}`;
            badgeContainer.className = 'carton-badges-right';
            header.appendChild(badgeContainer);

            cartonDiv.appendChild(header);

            const innerGrid = document.createElement('div');
            innerGrid.className = 'carton-grid-inner';
            innerGrid.id = `carton-grid-inner-${idx + 1}`;

            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 9; c++) {
                    const celda = document.createElement('div');
                    celda.className = 'celda';
                    const val = carton[r][c];

                    if (val === null) {
                        celda.classList.add('vacia');
                    } else {
                        const spanVal = document.createElement('span');
                        spanVal.className = 'num-val';
                        spanVal.textContent = val;
                        celda.appendChild(spanVal);
                        
                        celda.dataset.num = val;
                        if (markedNumbers.has(val)) {
                            celda.classList.add('marcada', 'con-raya');
                        }
                    }
                    innerGrid.appendChild(celda);
                }
            }

            cartonDiv.appendChild(innerGrid);
            gridContainer.appendChild(cartonDiv);
        });
    }

    function renderTabla() {
        const tabla = document.getElementById('tablaNumeros');
        tabla.innerHTML = '';
        for (let fila = 0; fila < 9; fila++) {
            const filaDiv = document.createElement('div');
            filaDiv.className = 'fila-numeros';
            for (let col = 0; col < 10; col++) {
                const num = fila * 10 + col + 1;
                const btn = document.createElement('button');
                btn.className = 'bolita';
                btn.textContent = num;
                btn.id = `bolita-${num}`;
                if (markedNumbers.has(num)) btn.classList.add('marcada');
                btn.addEventListener('click', () => toggleNumero(num));
                filaDiv.appendChild(btn);
            }
            tabla.appendChild(filaDiv);
        }
    }

    function actualizarRecientesUI() {
        const contenedor = document.getElementById('recientesLista');
        contenedor.innerHTML = '';
        
        // 🟢 CAMBIO DEFINITIVO: Tomamos las últimas 6 bolas (sin reverse)
        const ultimasBolas = historialBolas.slice(-6);

        ultimasBolas.forEach(num => {
            const mini = document.createElement('div');
            mini.className = 'mini-bola';
            mini.style.setProperty('--bola-bg', obtenerColorExterior(num));
            
            const spanNum = document.createElement('span');
            spanNum.textContent = num;
            mini.appendChild(spanNum);

            // 🟢 prepend inserta la nueva bola a la izquierda (empujando las otras a la derecha)
            contenedor.prepend(mini);
        });
    }

    function actualizarMarcasCartones(num) {
        if (pausarMarcadoGeneral) return;

        const celdasCoincidentes = document.querySelectorAll(`.celda[data-num="${num}"]`);
        
        celdasCoincidentes.forEach(celda => {
            if (markedNumbers.has(num)) {
                celda.classList.remove('marcada', 'animar-marca', 'con-raya');
                void celda.offsetWidth;

                celda.classList.add('animar-marca');

                setTimeout(() => {
                    if (markedNumbers.has(num)) celda.classList.add('marcada');
                }, 600);

                setTimeout(() => {
                    if (markedNumbers.has(num)) celda.classList.add('con-raya');
                }, 1000);

            } else {
                celda.classList.remove('marcada', 'animar-marca', 'con-raya');
            }
        });

        if (markedNumbers.has(num)) {
            currentCartones.forEach((carton, idx) => {
                const idCartonActual = idx + 1;
                const tieneNumero = carton.some(row => row.includes(num));
                if (tieneNumero) {
                    const headerElem = document.getElementById(`carton-header-${idCartonActual}`);
                    if (headerElem) {
                        headerElem.classList.remove('hit-alert');
                        void headerElem.offsetWidth;
                        headerElem.classList.add('hit-alert');
                    }
                }
            });
        }

        // Actualizar el botón en la tabla
        const bolita = document.getElementById(`bolita-${num}`);
        if (bolita) {
            if (markedNumbers.has(num)) {
                bolita.classList.add('marcada');
            } else {
                bolita.classList.remove('marcada');
            }
        }
    }

    function ejecutarMarcadoPremioGanador(num, idCarton) {
        const celda = document.querySelector(`#carton-${idCarton} .celda[data-num="${num}"]`);
        if (celda) {
            celda.classList.remove('marcada', 'animar-marca', 'con-raya');
            void celda.offsetWidth;
            celda.classList.add('animar-marca', 'marcada', 'con-raya');
        }

        const headerElem = document.getElementById(`carton-header-${idCarton}`);
        if (headerElem) {
            headerElem.classList.remove('hit-alert');
            void headerElem.offsetWidth;
            headerElem.classList.add('hit-alert');
        }

        // Actualizar el botón en la tabla
        const bolita = document.getElementById(`bolita-${num}`);
        if (bolita) {
            bolita.classList.add('marcada');
        }
    }

    function agregarBadgePremio(idCarton, tipo) {
        const badgeContainer = document.getElementById(`carton-badges-${idCarton}`);
        if (!badgeContainer) return;

        const badgeId = `badge-${tipo}-${idCarton}`;
        if (document.getElementById(badgeId)) return;

        const badge = document.createElement('span');
        badge.id = badgeId;
        badge.className = `carton-badge ${tipo}`;

        if (tipo === 'linea') {
            badge.innerHTML = '⭐ LÍNEA';
        } else if (tipo === 'bingo') {
            badge.innerHTML = '🏆 BINGO';
        }

        badgeContainer.appendChild(badge);
    }

    function trazarLineaGanadora(idxCarton, filaIdx) {
        const gridInner = document.getElementById(`carton-grid-inner-${idxCarton + 1}`);
        if (!gridInner) return;

        const strike = document.createElement('div');
        strike.className = 'linea-ganadora-strike';
        
        const porcentajeTop = (filaIdx * 33.33) + 16.66;
        strike.style.top = `calc(${porcentajeTop}% - 2px)`;

        gridInner.appendChild(strike);
    }

    function borrarAlertasA1Total() {
        document.querySelectorAll('.raya-alerta').forEach(el => el.remove());
        document.querySelectorAll('.carton-header').forEach(el => {
            el.classList.remove('a-uno-linea', 'a-uno-bingo');
        });
    }

    function calcularYMostrarAlertasA1() {
        borrarAlertasA1Total();

        if (bingoCantadoGlobal) return;

        currentCartones.forEach((carton, idx) => {
            const idCarton = idx + 1;
            const headerElem = document.getElementById(`carton-header-${idCarton}`);
            const badgeContainer = document.getElementById(`carton-badges-${idCarton}`);
            if (!headerElem || !badgeContainer) return;

            if (!estadoAlertasA1.has(idCarton)) {
                estadoAlertasA1.set(idCarton, { filasNotificadas: new Set(), bingoNotificado: false });
            }
            const registroCarton = estadoAlertasA1.get(idCarton);

            let totalMarcadosCarton = 0;
            let filasA1Actuales = [];

            for (let r = 0; r < 3; r++) {
                const numerosFila = carton[r].filter(n => n !== null);
                const marcadosEnFila = numerosFila.filter(n => markedNumbers.has(n)).length;
                totalMarcadosCarton += marcadosEnFila;

                if (marcadosEnFila === 4 && !lineaCantadaGlobal) {
                    filasA1Actuales.push(r);
                }
            }

            let faltaUnoParaBingo = (totalMarcadosCarton === 14 && !bingoCantadoGlobal);
            let faltaUnoParaLinea = (filasA1Actuales.length > 0 && !lineaCantadaGlobal);

            if (faltaUnoParaBingo || faltaUnoParaLinea) {
                let esNuevaAlerta = false;

                filasA1Actuales.forEach(filaIdx => {
                    if (!registroCarton.filasNotificadas.has(filaIdx)) {
                        esNuevaAlerta = true;
                        registroCarton.filasNotificadas.add(filaIdx);
                    }
                });

                if (faltaUnoParaBingo && !registroCarton.bingoNotificado) {
                    esNuevaAlerta = true;
                    registroCarton.bingoNotificado = true;
                }

                const tipoClase = faltaUnoParaBingo ? 'bingo' : 'linea';
                headerElem.classList.add(`a-uno-${tipoClase}`);

                const claseTamanio = esNuevaAlerta ? '' : 'pequeno';
                badgeContainer.insertAdjacentHTML('beforeend', `<span class="raya-alerta ${tipoClase} ${claseTamanio}">⚫</span>`);
            }
        });
    }

    function toggleNumero(num) {
        if (markedNumbers.has(num)) {
            markedNumbers.delete(num);
            historialBolas = historialBolas.filter(n => n !== num);
            actualizarMarcasCartones(num);
            actualizarEstado(num);
            actualizarRecientesUI();
            // No verificamos premios al desmarcar
        } else {
            // Para marcar manual desde la tabla
            markedNumbers.add(num);
            historialBolas.push(num);
            
            // Actualizar UI inmediatamente
            actualizarMarcasCartones(num);
            actualizarEstado(num);
            actualizarRecientesUI();
            
            // Verificar premios de forma síncrona (sin animaciones)
            verificarPremiosManual(num);
        }
    }

    function verificarPremiosManual(numActual) {
        // Verificar si hay premio después de marcar manualmente
        let hayLinea = false;
        let hayBingo = false;
        let ganadorLinea = null;
        let ganadorBingo = null;

        for (let idx = 0; idx < currentCartones.length; idx++) {
            const carton = currentCartones[idx];
            let numerosMarcadosTotal = 0;

            for (let r = 0; r < 3; r++) {
                const numerosFila = carton[r].filter(n => n !== null);
                const filaCompletada = numerosFila.every(n => markedNumbers.has(n));

                if (filaCompletada && !lineaCantadaGlobal) {
                    hayLinea = true;
                    ganadorLinea = { idx, r, idCarton: idx + 1 };
                }

                numerosMarcadosTotal += numerosFila.filter(n => markedNumbers.has(n)).length;
            }

            if (numerosMarcadosTotal === 15 && !bingoCantadoGlobal) {
                hayBingo = true;
                ganadorBingo = { idx, idCarton: idx + 1 };
            }
        }

        if (hayLinea && !lineaCantadaGlobal) {
            lineaCantadaGlobal = true;
            if (ganadorLinea) {
                trazarLineaGanadora(ganadorLinea.idx, ganadorLinea.r);
                agregarBadgePremio(ganadorLinea.idCarton, 'linea');
                mostrarBanner(`¡LÍNEA EN CARTÓN ${ganadorLinea.idCarton}! 📐`, false);
            }
        }

        if (hayBingo && !bingoCantadoGlobal) {
            bingoCantadoGlobal = true;
            if (ganadorBingo) {
                agregarBadgePremio(ganadorBingo.idCarton, 'bingo');
                mostrarBanner(`¡¡ BINGO EN CARTÓN ${ganadorBingo.idCarton} !! 🎉🏆`, true);
            }
        }

        calcularYMostrarAlertasA1();
    }

    function sacarBolaConAnimacion() {
        if (isAnimating) return;
        if (bolasDisponibles.length === 0) {
            alert('¡Ya se han extraído todas las bolas!');
            return;
        }

        isAnimating = true;
        const sphere = document.getElementById('bolilleroSphere');
        const display = document.getElementById('numeroDisplay');

        const ejecutarEntradaNuevaBola = async () => {
            const num = bolasDisponibles.pop();
            
            // 1. Mostrar la bola en el bolillero
            display.textContent = num;
            sphere.style.setProperty('--bola-exterior', obtenerColorExterior(num));

            sphere.classList.remove('rodar-salida', 'rodar-entrada');
            void sphere.offsetWidth;
            sphere.classList.add('rodar-entrada');

            decirNumero(num);

            // Esperar a que la bola termine la animación
            await new Promise(r => setTimeout(r, 650));

            // 2. Verificar premios (el número NO se ha marcado aún)
            await verificarPremiosConSincronizacion(num);

            // 3. ACTUALIZAR LAS BOLAS RECIENTES (esto es lo que faltaba)
            actualizarRecientesUI();

            // 4. Actualizar estadísticas
            actualizarEstado(num);

            sphere.classList.remove('rodar-entrada');
            isAnimating = false;
        };

        if (esPrimeraBola) {
            esPrimeraBola = false;
            ejecutarEntradaNuevaBola();
        } else {
            sphere.classList.remove('rodar-entrada', 'rodar-salida');
            void sphere.offsetWidth;
            sphere.classList.add('rodar-salida');

            setTimeout(() => {
                ejecutarEntradaNuevaBola();
            }, 480);
        }
    }

    function actualizarEstado(num) {
        document.getElementById('numeroDisplay').textContent = num || '--';
        document.getElementById('statsDisplay').textContent = `${markedNumbers.size}/90`;
    }

    async function verificarPremiosConSincronizacion(numActual) {
        // PRIMERO: Buscar candidatos a premio ANTES de pintar
        let candidatosLinea = [];
        let candidatosBingo = [];

        // Verificar si hay premio con el número actual (sin marcarlo aún)
        for (let idx = 0; idx < currentCartones.length; idx++) {
            const carton = currentCartones[idx];
            let numerosMarcadosTotal = 0;

            for (let r = 0; r < 3; r++) {
                const numerosFila = carton[r].filter(n => n !== null);
                // Verificar si con el número actual se completa la fila
                const filaCompletada = numerosFila.every(n => markedNumbers.has(n) || n === numActual);

                if (filaCompletada && !lineaCantadaGlobal) {
                    // Solo si la fila NO estaba completa antes de este número
                    const filaCompletaSinActual = numerosFila.every(n => markedNumbers.has(n));
                    if (!filaCompletaSinActual) {
                        candidatosLinea.push({ idx, r, idCarton: idx + 1 });
                    }
                }

                // Contar marcados incluyendo el actual
                const marcadosEnFila = numerosFila.filter(n => markedNumbers.has(n) || n === numActual).length;
                numerosMarcadosTotal += marcadosEnFila;
            }

            // Verificar bingo incluyendo el número actual
            if (numerosMarcadosTotal === 15 && !bingoCantadoGlobal) {
                // Solo si NO estaba completo antes
                let marcadosPrevios = 0;
                for (let r = 0; r < 3; r++) {
                    const numerosFila = carton[r].filter(n => n !== null);
                    marcadosPrevios += numerosFila.filter(n => markedNumbers.has(n)).length;
                }
                if (marcadosPrevios === 14) {
                    candidatosBingo.push({ idx, idCarton: idx + 1 });
                }
            }
        }

        // CASO: HAY PREMIO (Línea o Bingo)
        if ((candidatosLinea.length > 0 && !lineaCantadaGlobal) || (candidatosBingo.length > 0 && !bingoCantadoGlobal)) {
            
            // La casilla NO se pinta aún - permanece en blanco
            
            // Si hay línea
            if (candidatosLinea.length > 0 && !lineaCantadaGlobal) {
                lineaCantadaGlobal = true;
                const ganador = candidatosLinea[0];
                
                // Buscar la celda ganadora (está en blanco porque no se ha pintado)
                const celdaGanadora = document.querySelector(`#carton-${ganador.idCarton} .celda[data-num="${numActual}"]`);
                
                // 1. BAJA EL CÍRCULO sobre la casilla en BLANCO
                if (celdaGanadora) {
                    await animarCirculoEnCelda(celdaGanadora);
                }
                
                // 2. DESPUÉS del círculo: Se MARCA el número, se PINTA y se RAYA la casilla y la fila
                markedNumbers.add(numActual);
                // AGREGAR AL HISTORIAL DE BOLAS RECIENTES
                historialBolas.push(numActual);
                pausarMarcadoGeneral = false;
                actualizarMarcasCartones(numActual);
                
                ejecutarMarcadoPremioGanador(numActual, ganador.idCarton);
                trazarLineaGanadora(ganador.idx, ganador.r);
                agregarBadgePremio(ganador.idCarton, 'linea');
                mostrarBanner(`¡LÍNEA EN CARTÓN ${ganador.idCarton}! 📐`, false);
                
            // Si hay bingo
            } else if (candidatosBingo.length > 0 && !bingoCantadoGlobal) {
                bingoCantadoGlobal = true;
                const ganador = candidatosBingo[0];
                
                // Buscar la celda ganadora (está en blanco porque no se ha pintado)
                const celdaGanadora = document.querySelector(`#carton-${ganador.idCarton} .celda[data-num="${numActual}"]`);
                
                // 1. BAJA EL CÍRCULO sobre la casilla en BLANCO
                if (celdaGanadora) {
                    await animarCirculoEnCelda(celdaGanadora);
                }
                
                // 2. DESPUÉS del círculo: Se MARCA el número, se PINTA y se RAYA la casilla
                markedNumbers.add(numActual);
                // AGREGAR AL HISTORIAL DE BOLAS RECIENTES
                historialBolas.push(numActual);
                pausarMarcadoGeneral = false;
                actualizarMarcasCartones(numActual);
                
                ejecutarMarcadoPremioGanador(numActual, ganador.idCarton);
                agregarBadgePremio(ganador.idCarton, 'bingo');
                mostrarBanner(`¡¡ BINGO EN CARTÓN ${ganador.idCarton} !! 🎉🏆`, true);
            }

        } else {
            // CASO: JUGADA NORMAL (Sin premio) -> Se marca y se pinta la casilla normalmente
            markedNumbers.add(numActual);
            // AGREGAR AL HISTORIAL DE BOLAS RECIENTES
            historialBolas.push(numActual);
            pausarMarcadoGeneral = false;
            actualizarMarcasCartones(numActual);
        }

        calcularYMostrarAlertasA1();
    }

    function mostrarBanner(texto, esBingo) {
        const banner = document.getElementById('bannerPremio');
        banner.textContent = texto;
        banner.className = 'banner-premio show' + (esBingo ? ' bingo' : '');

        setTimeout(() => {
            banner.classList.remove('show');
        }, 3500);
    }

    function reiniciarJuego() {
        markedNumbers.clear();
        lineaCantadaGlobal = false;
        bingoCantadoGlobal = false;
        pausarMarcadoGeneral = false;
        estadoAlertasA1.clear();
        inicializarBolillero();
        document.getElementById('numeroDisplay').textContent = '--';
        const sphere = document.getElementById('bolilleroSphere');
        sphere.style.setProperty('--bola-exterior', '#1f77b4');
        sphere.classList.remove('rodar-entrada', 'rodar-salida');
        document.getElementById('statsDisplay').textContent = '0/90';
        renderCartones();
        renderTabla();
        actualizarRecientesUI();
        borrarAlertasA1Total();
    }

    function init() {
        cambiarColorAleatorio();
        currentCartones = generar10CartonesGlobales();
        reiniciarJuego();

        document.getElementById('btnSacarBola').addEventListener('click', sacarBolaConAnimacion);
        document.getElementById('bolilleroSphere').addEventListener('click', sacarBolaConAnimacion);

        document.getElementById('btnGenerar').addEventListener('click', () => {
            cambiarColorAleatorio();
            currentCartones = generar10CartonesGlobales();
            reiniciarJuego();
        });

        document.getElementById('resetBtn').addEventListener('click', reiniciarJuego);
    }

    init();

    // ==========================================================
    // 🟢 CÓDIGO PARA FORZAR LA PANTALLA COMPLETA EN LA APK 🟢
    // ==========================================================
    function forzarPantallaCompleta() {
        var elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE/Edge */
            elem.msRequestFullscreen();
        }
    }

    // Intentar forzar al cargar la página
    setTimeout(forzarPantallaCompleta, 500);
    // Intentar de nuevo si falla la primera vez
    setTimeout(forzarPantallaCompleta, 1500);

    // Forzar cada vez que el usuario toque la pantalla (Chrome sale del modo cuando tocas)
    document.addEventListener('click', function() {
        if (!document.fullscreenElement) {
            forzarPantallaCompleta();
        }
    });

    // Forzar si el usuario hace scroll (aunque esté bloqueado, por si acaso)
    document.addEventListener('touchstart', function() {
        if (!document.fullscreenElement) {
            forzarPantallaCompleta();
        }
    });

})();
