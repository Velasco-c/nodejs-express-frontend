export function createInventarioService({ inventarioApi }){
  return {
    resumen( minimo = 2, opciones = {} ){
      const numero = Number( minimo );
      const umbral = Number.isInteger( numero ) && numero >= 0 ? numero : 2;
      return inventarioApi.resumen( umbral, opciones );
    }
  };
}
