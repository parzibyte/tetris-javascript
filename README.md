# tetris-javascript
 Tetris en JavaScript con SVG. No sé si lo vaya a terminar o si me quede al final xd
 

# Documentación del estilo de código
Preferimos algo legible a algo "optimizado". Por ejemplo, en lugar de:
```javascript
return !tablero[y][x].ocupado;
```
Se prefiere:
```javascript
if (tablero[y][x].ocupado){
    return false
}else {
    return true;
}
```

# Docs

**Absolute point**: A point with x and y that is absolute to the game board

**Relative point**: A point with inner x and y; for example, a point that conforms a figure