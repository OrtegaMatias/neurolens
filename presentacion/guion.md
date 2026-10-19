# Guion · NeuroLens (10 minutos)

**Reparto:** Matías ≈ 5 min (problema, demo, cierre) · Gaspar ≈ 5 min (datos, modelo, código).
**Antes de empezar:** rotar la clave (`ssh firma-mc-lab '~/neurolens/scripts/rotar-clave.sh'`), entrar a https://neurolens.cvdi.cl, dejar la sesión abierta y una pestaña con el notebook. Respaldo: video de la demo + slides 7–8.

| # | Bloque | Quién | Tiempo | Slide |
|---|---|---|---|---|
| 1 | Problema y motivación | Matías | 1:30 | 1–2 |
| 2 | Datos | Gaspar | 1:30 | 3 |
| 3 | Modelo y métricas | Gaspar | 2:00 | 4–7 |
| 4 | Demo en vivo | Matías | 3:00 | 8 + app |
| 5 | Código | Gaspar | 1:30 | 9 + `app.py` |
| 6 | Cierre | Matías | 0:30 | 10 |

---

## 1 · Problema (Matías, 1:30)

> "Los tumores cerebrales necesitan un diagnóstico rápido, y leer una resonancia depende de especialistas que son escasos. Nos preguntamos: ¿puede una IA ayudar a **priorizar** qué estudios revisar primero?
> NeuroLens recibe un corte de resonancia y lo clasifica en glioma, meningioma, tumor pituitario o sin tumor. Muestra qué tan seguro está, dónde miró, y un modelo de lenguaje lo explica en palabras simples.
> Es un **prototipo educativo**: no diagnostica, y la app lo dice en todo momento."

Mostrar el flujo de la slide 2: imagen → YOLO → probabilidades + Grad-CAM → Claude → recomendación.

## 2 · Datos (Gaspar, 1:30)

> "Usamos el *Brain Tumor MRI Dataset* de Kaggle, licencia CC0, que combina tres fuentes públicas: Figshare, SARTAJ y Br35H.
> Lo primero que hicimos fue buscar duplicados con un hash MD5: encontramos **187 imágenes repetidas** y las eliminamos, porque si una copia queda en entrenamiento y otra en prueba, la métrica se infla.
> Quedan 7.013 imágenes, divididas de forma **estratificada 70/15/15**. El desbalance es leve, igual usamos accuracy balanceada.
> Limitaciones: no hay ID de paciente, así que cortes del mismo paciente pueden quedar en train y test; y las imágenes 'sin tumor' vienen sobre todo de otra fuente, lo que podría introducir sesgo."

## 3 · Modelo (Gaspar, 2:00)

> "Comparamos tres enfoques de clase con la **misma métrica en el mismo conjunto de prueba**.
> **CLIP sin entrenar** queda en 24,6 %: el azar. Un modelo general entrenado con fotos de internet no sabe leer resonancias.
> **EfficientNet-B0** con transfer learning llega a 97,6 %, y **YOLO-cls nano** a 98,4 %.
> Elegimos YOLO porque gana en todo lo que importa: más accuracy, **menos falsos negativos** (4 vs 5), pesa 3 MB en vez de 16 y es unas 40 veces más rápido en CPU, clave porque el servidor no tiene GPU."

Slide 5:
> "En prueba: 99,5 % de sensibilidad para detectar tumor y 100 % de especificidad. La confusión principal es glioma con meningioma.
> El **umbral de 93 %** lo calibramos en **validación**, no en prueba: bajo él queda el 5 % de las imágenes, y justo ahí el modelo acierta solo 82 %. Por eso la app pide revisión humana."

Slide 6:
> "El error más costoso es decir 'sin tumor' cuando sí hay: pasó 4 veces de 800. Dos de esos errores tenían confianza alta, así que el umbral no basta: la app **nunca descarta**."

Slide 7 (rápido): Grad-CAM muestra que el modelo mira la lesión.

## 4 · Demo (Matías, 3:00)

1. **Analizar** (1:00): subir `ejemplos/glioma.jpg` → mostrar clase, confianza, barras de las 4 clases. Activar **Grad-CAM**. Señalar la diferencia entre "confianza en esta imagen" y "desempeño del modelo 98,4 %".
2. **Recomendación IA** (0:45): botón "Generar recomendación con IA" → texto en streaming con las 3 secciones y el aviso de no-diagnóstico.
3. **Humano vs IA** (1:00): jugar una ronda en vivo; si alguien falla, mostrar la explicación de por qué y "Explícame con IA".
4. **El modelo** (0:15): matriz de confusión y comparación.

Si falla internet: video de respaldo o slides 7–8.

## 5 · Código (Gaspar, 1:30)

Abrir `app.py` y mostrar 3 partes:
1. **`clasificar()`**: preprocesa igual que YOLO (224 px, recorte central), recorre la red capa por capa, guarda la última convolución y calcula Grad-CAM con los gradientes de la clase ganadora.
2. **`armar_prompt()` + `INSTRUCCIONES`**: al LLM solo va texto; el *system prompt* obliga a decir que no es diagnóstico y a pedir revisión humana bajo el umbral.
3. **Acceso**: la clave rota cada día, solo se obtiene por SSH, y la sesión es una cookie firmada; así nadie consume la API sin permiso.

Mencionar que el notebook está ejecutado en el repo con todas las métricas.

## 6 · Cierre (Matías, 0:30)

> "Aprendimos que adaptar un modelo preentrenado lleva de 25 % a 98 % con pocos datos, y que el modelo más grande no siempre es el mejor. El riesgo principal es que la métrica es optimista sin separar por paciente; como mejora, validaríamos con datos de otro hospital. Gracias."

---

## Preguntas probables (ambos deben saber responder)

| Pregunta | Respuesta corta |
|---|---|
| ¿Por qué accuracy balanceada? | Pesa igual cada clase; con desbalance la accuracy normal puede esconder una clase mal detectada. |
| ¿Por qué YOLO y no EfficientNet? | Mejor en accuracy balanceada, menos falsos negativos, 5× más liviano, ~40× más rápido en CPU. |
| ¿Cómo eligieron el umbral? | En validación: el menor umbral con ≥ 99 % de acierto sobre él (93 %). Prueba solo para reportar. |
| ¿Qué es Grad-CAM? | Promedio de gradientes de la clase ganadora por canal × activaciones de la última convolución → mapa de calor. |
| ¿Por qué desconfiar del 98 %? | Sin ID de paciente (fuga posible), sesgo de fuente en "sin tumor", sin validación externa. |
| ¿Qué se envía al LLM? | Solo texto: clase, confianza, probabilidades y umbral. Nunca la imagen. |
| ¿Dónde está la clave API? | En un `.env` del servidor, fuera de GitHub. Los endpoints del LLM exigen sesión. |
| ¿Qué pasa con una foto que no es una RM? | El modelo igual elige una de 4 clases: es una limitación declarada en la app. |
| ¿Qué hace `transfer learning`? | Parte de pesos aprendidos en ImageNet y solo ajusta con nuestras imágenes; necesita muchos menos datos. |
