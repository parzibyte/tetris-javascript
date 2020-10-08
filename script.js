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
    puedeMoverIzquierda() {
        return this.x > 0;
    }
    puedeMoverDerecha() {
        return this.x < this.limiteX;
    }
    puedeMoverAbajo() {
        return this.y < this.limiteY;
    }
    colapsaConOtroPuntoAbajo() {
        if (juego[this.y + 1][this.x].ocupado) {
            return {
                x: this.x,
                y: this.y + 1,
            }
        } else {
            return false;
        }
    }
    rotar() {
        let x = this.x, y = this.y;
        this.x = 1 - (y - (4 - 2));
        this.y = x;

    }
}
class Figura {
    constructor(puntos) {
        this.puntos = puntos;
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
    puedeMoverDerecha() {
        return this.puedeMoverAbajo() && this.puntos.every((p) => p.puedeMoverDerecha());
    }
    puedeMoverIzquierda() {
        return this.puedeMoverAbajo() && this.puntos.every((p) => p.puedeMoverIzquierda());
    }
    rotar() {
        for(const punto of this.puntos){
            punto.rotar();
        }
        // const puntoRotacion = this.obtenerOrigen();
        // const puntoIzquierda = this.obtenerPuntoConXMenor();
        // // const puntoIzquierda = this.obtenerPuntoConXMenor();

        // for (let punto of this.puntos) {
        //     // Lo pasamos al origen
        //     punto.x = punto.x - puntoIzquierda.x;
        //     // if (punto.x === puntoRotacion.x && punto.y === puntoRotacion.y) continue;
        //     // Lo rotamos ._.
        //     let { x, y } = punto;
        //     // let sb_x =
        //     punto.x = 1 - (y - (2 / 2));
        //     punto.y = x;
        //     // Le agregamos a x lo que le quitamos
        //     punto.y -= puntoIzquierda.x;
        // }
    }
    obtenerOrigen() {
        for (const punto of this.puntos) {
            if (punto.rotacion) return punto;
        }
        return {};
    }
    puedeMoverAbajo() {
        if (this.colapsaConSuelo()) {
            return false;
        }
        return !this.puntos.some(punto => {
            const coordenadas = punto.colapsaConOtroPuntoAbajo();
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
    colapsaConSuelo() {
        return !this.puntos.every((p) => p.puedeMoverAbajo());
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
    console.log("OK");
    for (const punto of figura.getPuntos()) {
        juego[punto.y][punto.x] = {
            color: COLOR_LLENO,
            ocupado: true,
        }
    }
}
let miX=0, miY = 0;
const colocarFiguraEnArreglo2 = (figura) => {
    for (const punto of figura.getPuntos()) {
        juego[punto.y+miY][punto.x+miX] = {
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
// Tomado de: https://www.joe.co.uk/gaming/tetris-block-names-221127
// xd
let SMASHBOY = new Figura([new Punto(1, 1), new Punto(2, 1), new Punto(2, 2), new Punto(1, 2)]); // El cuadrado
let HERO = new Figura([new Punto(0, 0), new Punto(0, 1), new Punto(0, 2), new Punto(0, 3)]); // Línea
let ORANGE_RICKY = new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(2, 1), new Punto(2, 0)]); // L
let BLUE_RICKY = new Figura([new Punto(0, 0), new Punto(0, 1), new Punto(1, 1), new Punto(2, 1),]);// Otra L
let CLEVELAND_Z = new Figura([new Punto(0, 0), new Punto(1, 0), new Punto(1, 1), new Punto(2, 1)]); // Z
let RHODE_ISLAND_Z = new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(1, 0), new Punto(2, 0)]); // Z
let TEEWEE = new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(2, 1), new Punto(1, 0)]); // Z
let figuras = [SMASHBOY, HERO, ORANGE_RICKY, BLUE_RICKY, CLEVELAND_Z, RHODE_ISLAND_Z, TEEWEE];
const obtenerNumeroAleatorioEnRango = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
const elegirAleatoria = () => {
    return new Figura([new Punto(0, 0), new Punto(0, 1), new Punto(0, 2), new Punto(0, 3)]); // Línea
    // return new Figura([new Punto(0, 1), new Punto(1, 1, true), new Punto(2, 1), new Punto(2, 0)]); // L 
    // return new Figura([new Punto(1, 1), new Punto(2, 1), new Punto(2, 2, true), new Punto(1, 2)]);
    switch (obtenerNumeroAleatorioEnRango(1, 7)) {
        case 1:
            return new Figura([new Punto(1, 1), new Punto(2, 1), new Punto(2, 2), new Punto(1, 2)])
        case 2:
            return new Figura([new Punto(0, 0), new Punto(0, 1), new Punto(0, 2), new Punto(0, 3)]);
        case 3:
            return new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(2, 1), new Punto(2, 0)]);
        case 4:
            return new Figura([new Punto(0, 0), new Punto(0, 1), new Punto(1, 1), new Punto(2, 1),]);
        case 5:
            return new Figura([new Punto(0, 0), new Punto(1, 0), new Punto(1, 1), new Punto(2, 1)]);
        case 6:
            return new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(1, 0), new Punto(2, 0)]);
        case 7:
        default:
            return new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(2, 1), new Punto(1, 0)]);
    };
}

let j = elegirAleatoria();
colocarFiguraEnArreglo2(j);
dibujar();
document.addEventListener("keyup", (e) => {

    const { code } = e;
    switch (code) {
        case "ArrowRight":
            miX++;
            // j.derecha();
            break;
        case "ArrowLeft":
            miX--;
            // j.izquierda();
            break;
        case "ArrowDown":
            miY++;
            // j.bajar();
            break;
        case "Space":
            j.rotar();
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
        console.log({ j });
        return;
    }
});
const loop = () => {
    if (!j.puedeMoverAbajo()) {
        agregarFiguraATablero(j);
        console.log("Es hora de cambiar la pieza!");
        j = null;
        j = elegirAleatoria();
        console.log({ j });
        return;
    }
    j.bajar();
    llenar();
    superponerTablero();
    colocarFiguraEnArreglo(j);
    dibujar();
};
// setInterval(loop, 200);