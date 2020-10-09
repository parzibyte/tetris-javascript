const LONGITUD_CUADRADO = 30;
const COLUMNAS = 10;
const FILAS = 10;
const ANCHO = LONGITUD_CUADRADO * COLUMNAS;
const ALTO = LONGITUD_CUADRADO * FILAS;
const COLOR_LLENO = d3.color("#000000");
const COLOR_VACIO = d3.color("#eaeaea");
const COLOR_BORDE = d3.color("#ffffff");
let tablero = [];
let juego = [];

class Punto {
    constructor(x, y, rotacion) {
        this.x = x;
        this.y = y;
        this.limiteX = COLUMNAS - 1;
        this.limiteY = FILAS - 1;
        this.rotacion = rotacion || false;
    }


    bajar() {
        this.y++;
    }

    // Subir no existe o no debería
    derecha() {
        this.x++;
    }

    izquierda() {
        this.x--;
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

    puedeRotar(tamanioFigura, posicionX, posicionY) {
        const nuevasCoordenadas = this.obtenerNuevasCoordenadasDespuesDeRotar(tamanioFigura);
        const xRelativa = nuevasCoordenadas.x + posicionX;
        const yRelativa = nuevasCoordenadas.y + posicionY;
        return xRelativa <= this.limiteX && yRelativa <= this.limiteY && xRelativa >= 0 && yRelativa >= 0;
    }

    rotar(tamanioFigura) {
        const nuevasCoordenadas = this.obtenerNuevasCoordenadasDespuesDeRotar(tamanioFigura);
        this.x = nuevasCoordenadas.x;
        this.y = nuevasCoordenadas.y;

    }

    obtenerNuevasCoordenadasDespuesDeRotar(tamanioFigura) {
        let x = this.x, y = this.y;
        const nuevoX = 1 - (y - (tamanioFigura - 2));
        const nuevoY = x;
        return {
            x: nuevoX,
            y: nuevoY,
        }
    }
}

class Figura {
    constructor(puntos, tamanio, cantidadRotaciones) {
        this.puntos = puntos;
        this.tamanio = tamanio;
        this.cantidadRotaciones = cantidadRotaciones;
    }

    getPuntos() {
        return this.puntos;
    }

    bajar() {
        if (!this.puedeMoverAbajo()) return;
        for (const punto of this.puntos) {
            punto.bajar();
        }
    }

    derecha() {
        if (!this.puedeMoverDerecha()) return;
        for (const punto of this.puntos) {
            punto.derecha();
        }
    }

    izquierda() {
        if (!this.puedeMoverIzquierda()) return;
        for (const punto of this.puntos) {
            punto.izquierda();
        }
    }

    puedeMoverDerecha(posicionX, posicionY) {
        return this.puedeMoverAbajo(posicionY, posicionX) && this.puntos.every((p) => p.puedeMoverDerecha(posicionX, posicionY));
    }

    puedeMoverIzquierda(posicionX, posicionY) {
        const puedeAbajo = this.puedeMoverAbajo(posicionY, posicionX);
        const puntosPuedenMoverseALaIzquierda = this.puntos.every((p) => p.puedeMoverIzquierda(posicionX, posicionY));
        return puedeAbajo && puntosPuedenMoverseALaIzquierda;
    }

    puedeRotar(posicionY, posicionX) {
        for (const punto of this.puntos) {
            if (!punto.puedeRotar(this.tamanio, posicionX, posicionY)) return false;
        }
        return true;
    }

    rotar(posicionY, posicionX) {
        if (!this.puedeMoverAbajo(posicionY, posicionX)) {
            console.log("No puede mover hacia abajo. No se rota")
            return;
        }
        if (!this.puedeRotar(posicionY, posicionX)) {
            console.log("No puede rotar porque estaría fuera de los límites. No se rota");
            return;
        }
        for (const punto of this.puntos) {
            punto.rotar(this.tamanio);
        }
    }

    obtenerOrigen() {
        for (const punto of this.puntos) {
            if (punto.rotacion) return punto;
        }
        return {};
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
        for (const punto of this.puntos) {
            // El siguiente comentario es un histórico de algo que me llevó aproximadamente 3 horas en notar
            // La solución es que no debemos regresar false de manera inmediata ._. sino hacer algo como every o some
        }
    }

    puntoPerteneceAEstaFigura(x, y) {
        for (const punto of this.puntos) {
            if (punto.x === x && punto.y === y) {
                return true;
            }
        }
        return false;
    }

    puntoColapsaConOtroPunto(punto) {
        return juego[punto.y + 1][punto.x].ocupado;
    }

    colapsaConSuelo(posicionY) {
        return !this.puntos.every((p) => p.puedeMoverAbajo(posicionY));
    }

    obtenerPuntoConYMayor() {
        let puntoMayor = this.puntos[0];
        for (const punto of this.puntos) {
            if (punto.y > puntoMayor.y) {
                puntoMayor = punto;
            }
        }
        return puntoMayor;
    }

    obtenerPuntoConXMenor() {
        let puntoMenor = this.puntos[0];
        for (const punto of this.puntos) {
            if (punto.x < puntoMenor.x) {
                puntoMenor = punto;
            }
        }
        return puntoMenor;
    }

    obtenerPuntosQueEstanAbajo(y) {
        const puntosCompatibles = [];
        for (const punto of this.puntos) {
            if (punto.y === y) puntosCompatibles.push(punto);
        }
        return puntosCompatibles;

    }
}

const llenar = () => {
    juego = [];
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
const agregarFiguraATablero = (figura) => {
    for (const punto of figura.getPuntos()) {
        tablero.push(punto);
    }
}
const superponerTablero = () => {
    for (const punto of tablero) {
        juego[punto.y][punto.x] = {
            color: COLOR_LLENO,
            ocupado: true,
        };
    }
};

const colocarFiguraEnArreglo = (figura) => {
    for (const punto of figura.getPuntos()) {
        juego[punto.y][punto.x] = {
            color: COLOR_LLENO,
            ocupado: true,
        }
    }
}
let miX = 0, miY = 0;
const colocarFiguraEnArreglo2 = (figura) => {
    for (const punto of figura.getPuntos()) {
        juego[punto.y + miY][punto.x + miX] = {
            color: COLOR_LLENO,
            ocupado: true,
        }
    }
}

const $svg = d3.select("#contenedor")
    .append("svg")
    .attr('width', ANCHO)
    .attr('height', ALTO);

llenar(juego);
const dibujar = () => {
    // $svg.selectAll("*").remove();
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
            $svg.append("rect")
                .attr("x", x)
                .attr("y", y)
                .attr("width", LONGITUD_CUADRADO)
                .attr("height", LONGITUD_CUADRADO)
                .attr("stroke", COLOR_BORDE)
                .attr("fill", colorRelleno);
            x += LONGITUD_CUADRADO;
        }
        y += LONGITUD_CUADRADO;
    }
}
dibujar();
const obtenerNumeroAleatorioEnRango = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
const elegirAleatoria = () => {
    /*
    * Nombres de los tetrominós tomados de: https://www.joe.co.uk/gaming/tetris-block-names-221127
    * Regresamos una nueva instancia en cada ocasión, pues si definiéramos las figuras en constantes o variables, se tomaría la misma
    * referencia en algunas ocasiones
    * */
    switch (obtenerNumeroAleatorioEnRango(1, 7)) {
        case 1:
            /*
            El cuadrado (smashboy)

            **
            **
            */
            return new Figura([new Punto(0, 0), new Punto(1, 0), new Punto(0, 1), new Punto(1, 1)], 2, 4);
        case 2:

            /*
            La línea (hero)

            ****
            */
            return new Figura([new Punto(0, 0), new Punto(0, 1), new Punto(0, 2), new Punto(0, 3)], 4, 2);
        case 3:

            /*
            La L (orange ricky)
            *
            ***

            */
            return new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(2, 1), new Punto(2, 0)], 3, 4);
        case 4:

            /*
            La J (blue ricky)
              *
            ***

            */
            return new Figura([new Punto(0, 0), new Punto(0, 1), new Punto(1, 1), new Punto(2, 1),], 3, 4);
        case 5:
            /*
           La Z (Cleveland Z)
           **
            **
           */
            return new Figura([new Punto(0, 0), new Punto(1, 0), new Punto(1, 1), new Punto(2, 1)], 3, 2);
        case 6:

            /*
           La otra Z (Rhode island Z)
            **
           **
           */
            return new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(1, 0), new Punto(2, 0)], 3, 2);
        case 7:
        default:

            /*
           La T (Teewee)

            *
           ***
           */
            return new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(2, 1), new Punto(1, 0)], 3, 4);
    }
}

let j = elegirAleatoria();
colocarFiguraEnArreglo2(j);
dibujar();
document.addEventListener("keyup", (e) => {

    const {code} = e;
    switch (code) {
        case "ArrowRight":
            if (j.puedeMoverDerecha(miX, miY)) {
                miX++;
            }
            // j.derecha();
            break;
        case "ArrowLeft":
            if (j.puedeMoverIzquierda(miX, miY)) {
                miX--
            }
            // j.izquierda();
            break;
        case "ArrowDown":
            if (j.puedeMoverAbajo(miY, miX)) {
                miY++;
            }
            // j.bajar();
            break;
        case "Space":
            j.rotar(miY, miX);
            break;
    }
    llenar();
    superponerTablero();
    colocarFiguraEnArreglo2(j);
    dibujar();
    if (!j.puedeMoverAbajo() && false) {
        agregarFiguraATablero(j);
        console.log("Es hora de cambiar la pieza!");
        j = elegirAleatoria();
        llenar();
        superponerTablero();
        colocarFiguraEnArreglo2(j);

        dibujar();

        return;
    }
});
// const loop = () => {
//     if (!j.puedeMoverAbajo()) {
//         agregarFiguraATablero(j);
//         console.log("Es hora de cambiar la pieza!");
//         j = null;
//         j = elegirAleatoria();
//         console.log({ j });
//         return;
//     }
//     j.bajar();
//     llenar();
//     superponerTablero();
//     colocarFiguraEnArreglo(j);
//     dibujar();
// };
// setInterval(loop, 200);