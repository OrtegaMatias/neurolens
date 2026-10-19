# 🧠 NeuroLens — Clasificador educativo de tumores cerebrales en RM

> **Prototipo educativo. No es un diagnóstico médico.** Ningún resultado de esta app reemplaza la evaluación de un profesional de salud.

**UDD · IA para la Gestión Industrial · Certamen 1 (proyecto grupal)**

| | |
|---|---|
| 🌐 App | `[URL de Vercel]` |
| ⚙️ API (modelo) | `[URL del Space de Hugging Face]` |
| 👥 Integrantes | Matías Ortega · Gaspar Lammel |

NeuroLens recibe un corte de resonancia magnética cerebral, lo clasifica en **glioma, meningioma, tumor pituitario o sin tumor**, muestra la confianza, las probabilidades de las 4 clases y un mapa **Grad-CAM** de dónde miró el modelo, y pide a un LLM (**Claude Haiku 5.5**, de Anthropic) una recomendación educativa en lenguaje simple. Incluye un mini juego **Humano vs IA** que explica por qué falló cada uno.

```
📷 Imagen → 🧠 YOLO-cls nano (clase + confianza + Grad-CAM) → 📊 Resultado visual → 💬 Claude Haiku → ✅ Recomendación
```

## 1. Problema y motivación

Los tumores cerebrales requieren diagnóstico rápido, y la lectura de RM depende de especialistas escasos. Un clasificador automático podría apoyar el **triaje** (priorizar qué estudios revisar primero). Este proyecto es un prototipo **educativo** que muestra ese flujo de punta a punta, sus métricas y, sobre todo, sus **límites**.

## 2. Datos (ficha)

| Aspecto | Detalle |
|---|---|
| Dataset | *Brain Tumor MRI Dataset* — Masoud Nickparvar (2021) |
| Enlace | https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset |
| Licencia | CC0 1.0 (dominio público) |
| Origen | Combinación de Figshare (Cheng et al., 2015), SARTAJ y Br35H |
| Formato | JPG en escala de grises, RM T1 con contraste, cortes axiales/coronales/sagitales |
| Original | 7.200 imágenes (1.800 por clase) |
| Limpieza | Se eliminaron **187 duplicados exactos** (hash MD5) → **7.013 imágenes únicas** |

**Imágenes por clase y división estratificada 70/15/15 (semilla 42):**

| Clase | Total | Train | Val | Test |
|---|---|---|---|---|
| Glioma | 1.786 | 1.250 | 268 | 268 |
| Meningioma | 1.784 | 1.249 | 267 | 268 |
| Sin tumor | 1.681 | 1.177 | 252 | 252 |
| Tumor pituitario | 1.762 | 1.233 | 265 | 264 |
| **Total** | **7.013** | **4.909** | **1.052** | **1.052** |

Desbalance leve (la clase *sin tumor* perdió más imágenes en la limpieza); por eso la métrica principal es la **accuracy balanceada**.

**Limitaciones:** varios cortes por paciente sin identificador (la métrica es optimista); *sin tumor* proviene mayoritariamente de otra fuente (Br35H), lo que puede introducir un sesgo de fuente; solo 3 tipos de tumor y una secuencia de RM; no se conoce la población ni los equipos de origen.

El dataset **no se sube** al repositorio: el notebook lo descarga con `kagglehub`.

## 3. Modelo y comparación

Los tres enfoques se evaluaron con **la misma métrica sobre el mismo conjunto de prueba (1.052 imágenes)**:

| Enfoque | Accuracy balanceada | Falsos negativos* | Tamaño | ms/imagen (CPU) |
|---|---|---|---|---|
| CLIP ViT-B/32 zero-shot (línea base) | 24,6 % | — | 605 MB | 45 |
| EfficientNet-B0 (`timm`, transfer learning) | 97,6 % | 5 | 16,3 MB | 240 |
| **YOLO-cls nano (`ultralytics`) — elegido** | **98,4 %** | **4** | **3,2 MB** | **6** |

\* tumor clasificado como "sin tumor", de 800 imágenes con tumor.

**Elección:** YOLO-cls nano supera a EfficientNet en accuracy balanceada, en el error más costoso y en costo de operación (5× más liviano y mucho más rápido en CPU, clave porque la app corre en un servidor gratuito sin GPU). CLIP sin entrenar queda en el azar: un modelo general no sabe leer resonancias.

**Métricas del modelo elegido en prueba:** accuracy 98,4 % · accuracy balanceada 98,4 % · sensibilidad "hay tumor" 99,5 % · especificidad 100 %.

**Error más costoso:** 4 de 800 tumores se clasificaron como "sin tumor" (0,5 %). Un falso negativo podría retrasar un diagnóstico; por eso la app nunca "descarta" y siempre recomienda revisión profesional.

**Umbral de confianza:** calibrado en **validación** (menor umbral con ≥ 99 % de acierto sobre él) → **93 %**. En prueba, el 5,3 % de las imágenes queda bajo el umbral (la app pide revisión humana) y ahí el acierto cae a 82 %, frente a 99,3 % sobre el umbral.

Detalle completo, gráficos, matriz de confusión, errores y Grad-CAM en [`notebooks/entrenamiento.ipynb`](notebooks/entrenamiento.ipynb).

## 4. Arquitectura

```
web/  (Next.js 16 + Tailwind + Framer Motion)  ──HTTP──▶  app.py (FastAPI + YOLO + Grad-CAM)  ──▶  API de Anthropic
      Vercel                                              Hugging Face Spaces (Docker)
```

| Endpoint | Qué hace |
|---|---|
| `GET /api/info` | clases, umbral y métricas de prueba |
| `POST /api/predict` | imagen → clase, confianza, probabilidades, aviso de baja confianza y Grad-CAM |
| `POST /api/recomendar` | resultado → recomendación educativa de Claude (streaming) |
| `POST /api/explicar-desafio` | ronda del juego → explicación de Claude de por qué falló cada uno |

**La app incluye:** carga de imagen (arrastrar, archivo o cámara del celular) e imágenes de ejemplo · clase, confianza y barras de probabilidad · Grad-CAM · desempeño del modelo en prueba claramente separado de la confianza por imagen · recomendación con IA · aviso educativo permanente y alerta de revisión humana bajo el umbral · mini juego Humano vs IA con marcador y explicaciones · pestaña de aprendizaje · historial local.

## 5. IA generativa responsable

- Al LLM se envía **solo texto** (clase, confianza, probabilidades, umbral); nunca la imagen.
- El *system prompt* limita el tema, exige aclarar que **no es un diagnóstico**, prohíbe tratamientos/fármacos/pronósticos, pide **revisión humana si la confianza está bajo el umbral** o si la segunda clase está cerca, y recuerda que un "sin tumor" no descarta nada si hay síntomas.
- La clave `ANTHROPIC_API_KEY` vive como **secreto** del Space de Hugging Face (o en un archivo `.env` local, ignorado por git) y **nunca** se sube al repositorio.

## 6. Estructura del repositorio

```
├── app.py                     ← API FastAPI (modelo + Grad-CAM + Claude)
├── requirements.txt           ← dependencias de la app
├── requirements-notebook.txt  ← extras para el notebook
├── Dockerfile                 ← imagen para Hugging Face Spaces
├── notebooks/entrenamiento.ipynb  ← datos, comparación de modelos y métricas (ejecutado)
├── modelo/                    ← yolo_cls.pt (3 MB), clases.json, metricas.json
├── ejemplos/                  ← 4 imágenes de prueba (una por clase)
└── web/                       ← frontend Next.js
```

## 7. Cómo ejecutar en local

```bash
# Backend (Python 3.12)
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
echo 'ANTHROPIC_API_KEY=tu_clave' > .env   # opcional: sin ella todo funciona menos la IA generativa
uvicorn app:app --port 7860 --env-file .env

# Frontend (Node 20+)
cd web && cp .env.example .env.local && pnpm install && pnpm dev
```

Reentrenar: `pip install -r requirements.txt -r requirements-notebook.txt` y ejecutar `notebooks/entrenamiento.ipynb` (también funciona en Google Colab con GPU).

## 8. Uso de herramientas de IA (declaración)

| Herramienta | Uso |
|---|---|
| Claude (Anthropic), asistente de código | Generar la estructura inicial del notebook, `app.py` y el frontend Next.js a partir de las pautas del curso; redactar borradores de textos; depurar errores. |
| Claude Haiku 5.5 (Anthropic) | Modelo de lenguaje **dentro de la app** que genera las recomendaciones y las explicaciones del juego. |

Todo el código fue revisado, adaptado al problema y ejecutado por el grupo; cualquiera de los integrantes puede explicar el notebook y `app.py`. Las bases del código provienen de las pautas del curso (*Pauta 1 · CNN* y *Pauta 2 · tres modelos preentrenados*).

## 9. Ética

Dataset público con licencia CC0 y sin datos identificables. La app indica de forma visible que es educativa y que no diagnostica. El modelo puede tener sesgos de fuente y población (ver Limitaciones) y siempre elegirá una de sus 4 clases, incluso ante imágenes que no son resonancias.
