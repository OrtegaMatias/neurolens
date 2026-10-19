import type { ClaseId } from "./api";

// Pistas visuales estáticas (sin LLM) para el desafío: qué mirar en una resonancia
// T1 con contraste para reconocer cada clase. Lenguaje simple y educativo.

export interface Rasgos {
  /** rasgo más característico, en una línea */
  clave: string;
  /** lista corta de qué buscar en la imagen */
  buscar: string[];
}

export const RASGOS: Record<ClaseId, Rasgos> = {
  glioma: {
    clave: "Nace dentro del tejido cerebral y tiene bordes irregulares o difusos.",
    buscar: [
      "Está dentro del tejido cerebral, no pegado al cráneo.",
      "Bordes irregulares o difusos: se \"mezcla\" con el cerebro.",
      "Aspecto heterogéneo: a veces un centro oscuro (necrosis) con un anillo brillante.",
      "Zona de hinchazón (edema) alrededor.",
      "Puede empujar y desplazar la línea media del cerebro.",
    ],
  },
  meningioma: {
    clave: "Está pegado al borde del cráneo o a la hoz y tiene bordes nítidos.",
    buscar: [
      "Pegado al borde interno del cráneo o a la hoz (la membrana entre ambos hemisferios).",
      "Queda fuera del cerebro: lo \"empuja\" en vez de infiltrarlo.",
      "Forma redondeada con bordes nítidos.",
      "Se ilumina de forma bastante homogénea con el contraste.",
      "A veces muestra una \"cola dural\": una prolongación fina sobre la membrana.",
    ],
  },
  pituitary: {
    clave: "Es una masa redonda en la línea media, abajo, en la base del cráneo (silla turca).",
    buscar: [
      "Ubicado en la línea media, en la base del cráneo (silla turca).",
      "Justo sobre el seno esfenoidal y detrás de los ojos.",
      "Se ve mejor en cortes sagitales (de perfil) o coronales (de frente).",
      "Masa redonda centrada en la parte baja del cerebro.",
    ],
  },
  notumor: {
    clave: "Hemisferios simétricos y sin ninguna mancha brillante focal.",
    buscar: [
      "Ambos hemisferios se ven simétricos.",
      "No hay una masa ni una mancha brillante localizada.",
      "Ventrículos (cavidades oscuras centrales) y línea media de forma y posición normales.",
    ],
  },
};

// Consejos para distinguir cada par de clases (el orden del par no importa)
const DIFERENCIAS: Record<string, string> = {
  "glioma|meningioma":
    "¿Está dentro del cerebro con bordes difusos (glioma) o pegado al borde del cráneo con bordes nítidos (meningioma)?",
  "glioma|pituitary":
    "El glioma crece dentro de los hemisferios con bordes difusos; el tumor pituitario es una masa redonda en la línea media, abajo, en la silla turca.",
  "glioma|notumor":
    "Busca asimetría entre hemisferios, una zona irregular o hinchada, o una línea media desplazada: sugieren glioma. Si todo es simétrico, probablemente no hay tumor.",
  "meningioma|pituitary":
    "Mira la ubicación: el pituitario está en la línea media de la base del cráneo; el meningioma suele estar pegado al borde del cráneo o a la hoz.",
  "meningioma|notumor":
    "Recorre el borde interno del cráneo buscando una masa redondeada y brillante que empuje el cerebro: eso sugiere meningioma.",
  "notumor|pituitary":
    "Fíjate en la base del cráneo, en la línea media: una masa redonda sobre el seno esfenoidal sugiere tumor pituitario; en un corte axial puede pasar desapercibida.",
};

/** Consejo breve para distinguir dos clases (o null si son la misma). */
export function diferencia(a: ClaseId, b: ClaseId): string | null {
  if (a === b) return null;
  const clave = [a, b].sort().join("|");
  return DIFERENCIAS[clave] ?? null;
}
