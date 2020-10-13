const LONGITUD_CUADRADO = 30;
const COLUMNAS = 10;
const FILAS = 12;
const ANCHO = LONGITUD_CUADRADO * COLUMNAS;
const ALTO = LONGITUD_CUADRADO * FILAS;
const COLOR_LLENO = d3.color("#000000");
const COLOR_VACIO = d3.color("#eaeaea");
const COLOR_BORDE = d3.color("#ffffff");
let tablero = [];
const juego = [];
const milisegundosBloqueo = 1000;
let movimientoBloqueado = false;
let puedeAgregarOtraFigura = true;
const $canvas = document.querySelector("#canvas");
$canvas.setAttribute("width", ANCHO + "px");
$canvas.setAttribute("height", ALTO + "px");
const contexto = $canvas.getContext("2d");

let miX, miY;
const reiniciarXEY = () => {
    miX = Math.floor(COLUMNAS / 2) - 1;
    // En -1 para que al bajar, aparezca en 0
    miY = -1;
}

// Todo: mover a un init
reiniciarXEY();

class Punto {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.limiteX = COLUMNAS - 1;
        this.limiteY = FILAS - 1;
    }

    puedeMoverIzquierda(posicionX) {
        return this.x + posicionX > 0;
    }

    puedeMoverDerecha(posicionX) {
        return this.x + posicionX < this.limiteX;
    }

    puedeMoverAbajo(posicionY) {
        return this.y + posicionY < this.limiteY;
    }

    colapsaConOtroPuntoAbajo(posicionY, posicionX) {
        let siguienteY = this.y + 1;
        if (juego[siguienteY + posicionY][this.x + posicionX].ocupado) {
            return {
                x: this.x,
                y: siguienteY,
            }
        } else {
            return false;
        }
    }

    colapsaConOtroPuntoDerecha(posicionY, posicionX) {
        let siguienteX = this.x + 1;
        if (!juego[this.y + posicionY]) {
            return false;
        }
        if (!juego[this.y + posicionY][siguienteX + posicionX]) {
            return false;
        }
        if (juego[this.y + posicionY][siguienteX + posicionX].ocupado) {
            return {
                x: siguienteX,
                y: this.y,
            }
        } else {
            return false;
        }
    }

    colapsaConOtroPuntoIzquierda(posicionY, posicionX) {
        let anteriorX = this.x - 1;
        if (!juego[this.y + posicionY]) {
            return false;
        }
        if (!juego[this.y + posicionY][anteriorX + posicionX]) {
            return false;
        }
        if (juego[this.y + posicionY][anteriorX + posicionX].ocupado) {
            return {
                x: anteriorX,
                y: this.y,
            }
        } else {
            return false;
        }
    }
}

class Figura {
    constructor(rotaciones) {
        this.rotaciones = rotaciones;
        this.indiceRotacion = 0;
        this.puntos = this.rotaciones[this.indiceRotacion];
        this.aumentarIndiceDeRotacion();
    }

    getPuntos() {
        return this.puntos;
    }

    puedeMoverDerecha(posicionX, posicionY) {
        if (posicionY < 0) return false;
        const puedeMoverDerechaPared = this.puntos.every((p) => p.puedeMoverDerecha(posicionX, posicionY));
        if (!puedeMoverDerechaPared) {
            console.log("Derecha. No puede, choca con pared");
            return false;
        } else {
            return !this.puntos.some(punto => {
                const coordenadas = punto.colapsaConOtroPuntoDerecha(posicionY, posicionX);
                if (coordenadas) {
                    if (!this.puntoPerteneceAEstaFigura(coordenadas.x, coordenadas.y)) {
                        console.log("Choca con alguien que no es de acá")
                        console.log({coordenadas})
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            });
        }
    }

    puedeMoverIzquierda(posicionX, posicionY) {
        if (posicionY < 0) return false;
        const puedeMoverIzquierdaPared = this.puntos.every((p) => p.puedeMoverIzquierda(posicionX, posicionY));
        if (!puedeMoverIzquierdaPared) {
            console.log("Izquierda. No puede, choca con pared");
            return false;
        }
        // Si al menos un punto colapsa, pero no pertenece a esta figura, regresar false
        return !this.puntos.some(punto => {
            const coordenadas = punto.colapsaConOtroPuntoIzquierda(posicionY, posicionX);
            if (coordenadas) {
                if (!this.puntoPerteneceAEstaFigura(coordenadas.x, coordenadas.y)) {
                    console.log("Choca con alguien que no es de acá")
                    console.log({coordenadas})
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        });
    }

    puedeMoverAbajo(posicionY, posicionX) {
        if (this.colapsaConSuelo(posicionY)) {
            return false;
        }
        return !this.puntos.some(punto => {
            const coordenadas = punto.colapsaConOtroPuntoAbajo(posicionY, posicionX);
            if (coordenadas) {
                if (!this.puntoPerteneceAEstaFigura(coordenadas.x, coordenadas.y)) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        });
    }

    desocupado(x, y) {
        if (!juego[y]) return true;
        if (!juego[y][x]) return true;
        return !juego[y][x].ocupado;
    }

    fueraDeLimites(punto) {
        const xRelativo = punto.x + miX;
        const yRelativo = punto.y + miY;
        return xRelativo < 0 || xRelativo > punto.limiteX || yRelativo < 0 || yRelativo > punto.limiteY;
    }

    puedeRotar(posicionY, posicionX) {
        // Se supone que los otros puntos desaparecen así que se toman como desocupados
        const _this = this;
        const nuevosPuntosDespuesDeRotar = this.obtenerSiguienteRotacion();
        for (const puntoRotado of nuevosPuntosDespuesDeRotar) {
            const desocupado = _this.desocupado(posicionX + puntoRotado.x, posicionY + puntoRotado.y);
            const ocupaMismaCoordenadaQuePuntoActual = _this.puntos.findIndex(puntoExistente => {
                return puntoRotado.x === puntoExistente.x && puntoRotado.y === puntoExistente.y;
            }) !== -1;
            const fueraDeLimites = _this.fueraDeLimites(puntoRotado);
            if ((!desocupado && !ocupaMismaCoordenadaQuePuntoActual) || fueraDeLimites) {
                return false;
            }
        }
        return true;
    }

    aumentarIndiceDeRotacion() {
        if (this.rotaciones.length <= 0) {
            this.indiceRotacion = 0;
        } else {
            if (this.indiceRotacion + 1 >= this.rotaciones.length) {
                this.indiceRotacion = 0;
            } else {
                this.indiceRotacion++;
            }
        }
    }

    obtenerSiguienteRotacion() {
        return this.rotaciones[this.indiceRotacion];
    }

    rotar(posicionY, posicionX) {
        //todo: debería revisarse el bloqueo, y no si se está abajo pues de eso se encarga "puedeRotar"
        if (!this.puedeMoverAbajo(posicionY, posicionX)) {
            console.log("No puede mover hacia abajo. No se rota")
            return;
        }
        if (!this.puedeRotar(posicionY, posicionX)) {
            console.log("No puede rotar porque estaría fuera de los límites. No se rota");
            return;
        }
        this.puntos = this.obtenerSiguienteRotacion();
        this.aumentarIndiceDeRotacion();
    }

    puntoPerteneceAEstaFigura(x, y) {
        for (const punto of this.puntos) {
            if (punto.x === x && punto.y === y) {
                return true;
            }
        }
        return false;
    }

    colapsaConSuelo(posicionY) {
        return !this.puntos.every((p) => p.puedeMoverAbajo(posicionY));
    }
}

const llenarPrimeraVez = () => {
    for (let y = 0; y < FILAS; y++) {
        juego.push([]);
        for (let x = 0; x < COLUMNAS; x++) {
            juego[y].push({
                color: COLOR_VACIO,
                ocupado: false,
            });
        }
    }
};
llenarPrimeraVez();
const llenar = () => {
    for (let y = 0; y < FILAS; y++) {
        for (let x = 0; x < COLUMNAS; x++) {
            juego[y][x] = {
                color: COLOR_VACIO,
                ocupado: false,
            };
        }
    }
};
const agregarFiguraATablero = (figura) => {
    for (const punto of figura.getPuntos()) {
        punto.x += miX;
        punto.y += miY;
        tablero.push(punto);
    }
    reiniciarXEY();
}
const superponerTablero = () => {
    for (const punto of tablero) {
        juego[punto.y][punto.x] = {
            color: COLOR_LLENO,
            ocupado: true,
        };
    }
};


const colocarFiguraEnArreglo2 = (figura) => {
    for (const punto of figura.getPuntos()) {
        juego[punto.y + miY][punto.x + miX] = {
            color: COLOR_LLENO,
            ocupado: true,
        }
    }
}


llenar(juego);
const dibujar = () => {
    let x = 0, y = 0;
    for (const fila of juego) {
        x = 0;
        for (const cuadro of fila) {
            let colorRelleno;
            if (cuadro.ocupado) {
                colorRelleno = cuadro.color;
            } else {
                colorRelleno = COLOR_VACIO;
            }
            contexto.fillStyle = cuadro.ocupado ? cuadro.color : COLOR_VACIO;
            contexto.fillRect(x, y, LONGITUD_CUADRADO, LONGITUD_CUADRADO);
            contexto.strokeStyle = "white";
            contexto.strokeRect(x, y, LONGITUD_CUADRADO, LONGITUD_CUADRADO);
            x += LONGITUD_CUADRADO;
        }
        y += LONGITUD_CUADRADO;
    }
    requestAnimationFrame(dibujar);
}
const obtenerNumeroAleatorioEnRango = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
const elegirAleatoria = () => {
    /*
    * Nombres de los tetrominós tomados de: https://www.joe.co.uk/gaming/tetris-block-names-221127
    * Regresamos una nueva instancia en cada ocasión, pues si definiéramos las figuras en constantes o variables, se tomaría la misma
    * referencia en algunas ocasiones
    * */
    switch (obtenerNumeroAleatorioEnRango(7, 7)) {
        case 1:
            /*
            El cuadrado (smashboy)

            **
            **
            */
            return new Figura([
                [new Punto(0, 0), new Punto(1, 0), new Punto(0, 1), new Punto(1, 1)]
            ]);
        case 2:

            /*
            La línea (hero)

            ****
            */
            return new Figura([
                [new Punto(0, 0), new Punto(1, 0), new Punto(2, 0), new Punto(3, 0)],
                [new Punto(0, 0), new Punto(0, 1), new Punto(0, 2), new Punto(0, 3)],
            ]);
        case 3:

            /*
            La L (orange ricky)
              *
            ***

            */

            return new Figura([
                [new Punto(0, 1), new Punto(1, 1), new Punto(2, 1), new Punto(2, 0)],
                [new Punto(0, 0), new Punto(0, 1), new Punto(0, 2), new Punto(1, 2)],
                [new Punto(0, 0), new Punto(0, 1), new Punto(1, 0), new Punto(2, 0)],
                [new Punto(0, 0), new Punto(1, 0), new Punto(1, 1), new Punto(1, 2)],
            ]);
        case 4:

            /*
            La J (blue ricky)
            *
            ***

            */

            return new Figura([
                [new Punto(0, 0), new Punto(0, 1), new Punto(1, 1), new Punto(2, 1)],
                [new Punto(0, 0), new Punto(1, 0), new Punto(0, 1), new Punto(0, 2)],
                [new Punto(0, 0), new Punto(1, 0), new Punto(2, 0), new Punto(2, 1)],
                [new Punto(0, 2), new Punto(1, 2), new Punto(1, 1), new Punto(1, 0)],
            ]);
        case 5:
            /*
           La Z (Cleveland Z)
           **
            **
           */

            return new Figura([
                [new Punto(0, 0), new Punto(1, 0), new Punto(1, 1), new Punto(2, 1)],
                [new Punto(0, 1), new Punto(1, 1), new Punto(1, 0), new Punto(0, 2)],
            ]);
        case 6:

            /*
           La otra Z (Rhode island Z)
            **
           **
           */
            return new Figura([
                [new Punto(0, 1), new Punto(1, 1), new Punto(1, 0), new Punto(2, 0)],
                [new Punto(0, 0), new Punto(0, 1), new Punto(1, 1), new Punto(1, 2)],
            ]);
        case 7:
        default:

            /*
           La T (Teewee)

            *
           ***
           */
            return new Figura([
                [new Punto(0, 1), new Punto(1, 1), new Punto(1, 0), new Punto(2, 1)],
                [new Punto(0, 0), new Punto(0, 1), new Punto(0, 2), new Punto(1, 1)],
                [new Punto(0, 0), new Punto(1, 0), new Punto(2, 0), new Punto(1, 1)],
                [new Punto(0, 1), new Punto(1, 0), new Punto(1, 1), new Punto(1, 2)],
            ]);
    }
}
const refrescarAggg = () => {
    llenar();
    superponerTablero();
    colocarFiguraEnArreglo2(j);
};
let siguienteDireccion;
let idInterval;
let j = elegirAleatoria();
const loop = () => {
    refrescarAggg();
    if (j.puedeMoverAbajo(miY, miX)) {
        miY++;
    } else {
        agregarFiguraATablero(j);
        j = elegirAleatoria();
        console.log("Nueva figura ._.");
    }
};
document.addEventListener("keyup", (e) => {
    const {code} = e;
    let algunCambio = false;
    switch (code) {
        case "ArrowRight":
            if (j.puedeMoverDerecha(miX, miY)) {
                algunCambio = true;
                miX++;
            }
            break;
        case "ArrowLeft":
            if (j.puedeMoverIzquierda(miX, miY)) {
                algunCambio = true;
                miX--;
            }
            break;
        case "ArrowDown":
            if (j.puedeMoverAbajo(miY, miX)) {
                algunCambio = true;
                miY++;
            } else {
                agregarFiguraATablero(j);
                j = elegirAleatoria();
                console.log("Nueva figura ._.");
            }
            break;
        case "Space":
            j.rotar(miY, miX);
            algunCambio = true;
            break;
    }
    if (algunCambio) {
        refrescarAggg();
    }
});
requestAnimationFrame(dibujar);
// idInterval = setInterval(loop, 600);