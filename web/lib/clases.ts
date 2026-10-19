import type { Clase, ClaseId } from "./api";

// Datos base de las 4 clases. Se usan mientras /api/info no responde
// (por ejemplo, si el servidor está despertando). Cuando la API responde,
// sus nombres, descripciones y colores tienen prioridad.
export const CLASES_BASE: Clase[] = [
  {
    id: "glioma",
    nombre: "Glioma",
    descripcion: "Tumor que se origina en las células gliales, que dan soporte a las neuronas.",
    color: "#f472b6",
  },
  {
    id: "meningioma",
    nombre: "Meningioma",
    descripcion: "Tumor que nace en las meninges, las membranas que recubren el cerebro.",
    color: "#a78bfa",
  },
  {
    id: "notumor",
    nombre: "Sin tumor",
    descripcion: "Resonancia sin un tumor visible de las categorías del conjunto de datos.",
    color: "#34d399",
  },
  {
    id: "pituitary",
    nombre: "Tumor pituitario",
    descripcion: "Tumor de la hipófisis, una glándula pequeña ubicada en la base del cráneo.",
    color: "#60a5fa",
  },
];

/** Contenido educativo propio para la pestaña "Aprende" (lenguaje simple). */
export interface ContenidoEducativo {
  enSimple: string;
  puntosClave: string[];
  enLaResonancia: string;
}

export const CONTENIDO_EDUCATIVO: Record<ClaseId, ContenidoEducativo> = {
  glioma: {
    enSimple:
      "El cerebro no solo tiene neuronas: también tiene células de soporte llamadas glía. Cuando estas células crecen de forma descontrolada se forma un glioma.",
    puntosClave: [
      "Es uno de los tipos de tumor cerebral primario más frecuentes en adultos.",
      "Existen gliomas de bajo y de alto grado; el grado lo define un estudio de tejido (biopsia), no una imagen.",
      "El tratamiento depende del tipo, la ubicación y el grado, y lo decide un equipo médico.",
    ],
    enLaResonancia:
      "Suele verse dentro del tejido cerebral, a veces con bordes irregulares e hinchazón (edema) alrededor.",
  },
  meningioma: {
    enSimple:
      "El cerebro está envuelto por membranas protectoras llamadas meninges. Un meningioma es un tumor que crece en esas membranas, por fuera del tejido cerebral.",
    puntosClave: [
      "La mayoría son benignos (no cancerosos) y de crecimiento lento.",
      "Pueden no dar síntomas por años; a veces se descubren por casualidad.",
      "Aun siendo benignos, pueden presionar estructuras cercanas y requerir seguimiento o tratamiento.",
    ],
    enLaResonancia:
      "Suele verse como una masa bien delimitada, pegada a la superficie interna del cráneo.",
  },
  notumor: {
    enSimple:
      "Son resonancias en las que no se observa ninguno de los tres tipos de tumor que el modelo aprendió a reconocer.",
    puntosClave: [
      "Que el modelo diga 'Sin tumor' NO descarta otras enfermedades: solo conoce estas 4 categorías.",
      "Es la clase donde un error es más costoso: un tumor clasificado como 'Sin tumor' es un falso negativo.",
      "Siempre debe ser un profesional quien interprete un examen real.",
    ],
    enLaResonancia: "Estructuras cerebrales simétricas y sin masas que alteren la forma normal del tejido.",
  },
  pituitary: {
    enSimple:
      "La hipófisis (o glándula pituitaria) es una glándula del tamaño de una arveja en la base del cráneo que regula muchas hormonas. Los tumores ahí suelen ser adenomas.",
    puntosClave: [
      "La gran mayoría son benignos.",
      "Pueden alterar la producción de hormonas o, si crecen, presionar los nervios de la visión.",
      "Su manejo suele involucrar a especialistas en neurocirugía y endocrinología.",
    ],
    enLaResonancia: "Se ubica en la zona central e inferior del cerebro, en una cavidad ósea llamada silla turca.",
  },
};

/**
 * Combina las clases de la API con los datos base: así siempre tenemos
 * las 4 clases en un orden fijo, aunque la API aún no haya respondido.
 */
export function combinarClases(desdeApi?: Clase[]): Clase[] {
  if (!desdeApi?.length) return CLASES_BASE;
  return desdeApi.map((c) => ({ ...CLASES_BASE.find((b) => b.id === c.id), ...c }));
}
