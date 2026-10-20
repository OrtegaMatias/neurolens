"""NeuroLens · API del clasificador educativo de tumores cerebrales en RM.

Flujo: imagen → YOLO-cls nano (clase + confianza + Grad-CAM) → Gemini → recomendación.
Se ejecuta con:  uvicorn app:app --port 7860
El frontend (Next.js, carpeta web/) consume estos endpoints.
"""

import base64
import hashlib
import hmac
import io
import json
import os
import re
import time
from collections import defaultdict, deque
from pathlib import Path

import numpy as np
import torch
from torchvision import transforms
from ultralytics import YOLO
from fastapi import Depends, FastAPI, File, HTTPException, Request, Response, UploadFile
from fastapi.responses import StreamingResponse
from matplotlib import colormaps
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel

RAIZ = Path(__file__).parent / "modelo"

# ---------------------------------------------------------------------------
# 1. Cargar modelo, clases y métricas (generados por notebooks/entrenamiento.ipynb)
# ---------------------------------------------------------------------------
INFO = json.loads((RAIZ / "clases.json").read_text(encoding="utf-8"))
METRICAS = json.loads((RAIZ / "metricas.json").read_text(encoding="utf-8"))
CLASES = [c["id"] for c in INFO["clases"]]          # mismo orden que la salida del modelo
NOMBRE = {c["id"]: c["nombre"] for c in INFO["clases"]}
UMBRAL = METRICAS["umbral"]                          # confianza mínima calibrada en validación

# Red de clasificación de YOLO (PyTorch puro: 10 bloques convolucionales + cabeza "Classify")
red = YOLO(RAIZ / "yolo_cls.pt").model.float().eval()
assert list(red.names.values()) == CLASES, "El orden de clases del modelo no coincide con clases.json"
# Mismo preprocesamiento que usa YOLO al clasificar: lado corto a 224, recorte central, valores 0-1
recorte = transforms.Compose([transforms.Resize(224), transforms.CenterCrop(224)])
a_tensor = transforms.ToTensor()


# ---------------------------------------------------------------------------
# 2. Clasificación + Grad-CAM: ¿qué zonas de la imagen empujaron la decisión?
#    Recorremos la red capa por capa para quedarnos con las activaciones de la
#    última capa convolucional (1280 mapas de 7x7). Sus gradientes respecto del
#    puntaje (logit) de la clase ganadora indican cuánto importa cada mapa.
# ---------------------------------------------------------------------------
def clasificar(img: Image.Image) -> tuple[np.ndarray, np.ndarray]:
    """Devuelve (probabilidades de las 4 clases, mapa Grad-CAM 7x7 normalizado 0-1)."""
    x = a_tensor(recorte(img)).unsqueeze(0).requires_grad_()   # pide gradientes desde la entrada
    for capa in red.model[:-1]:                   # bloques 0..9: extraen características
        x = capa(x)
    cabeza = red.model[-1]
    act = cabeza.conv(x)                          # última capa convolucional
    act.retain_grad()
    logits = cabeza.linear(cabeza.pool(act).flatten(1))
    probs = logits.softmax(1)[0]
    logits[0, probs.argmax()].backward()          # gradiente de la clase ganadora
    pesos = act.grad.mean(dim=(2, 3), keepdim=True)
    cam = torch.relu((pesos * act).sum(1))[0]
    cam = cam / (cam.max() + 1e-8)
    return probs.detach().numpy(), cam.detach().numpy()


def superponer(img: Image.Image, cam: np.ndarray) -> str:
    """Pinta el mapa de calor sobre la misma zona que vio el modelo y lo devuelve como data URL PNG."""
    base = recorte(img).resize((320, 320))
    calor = Image.fromarray(np.uint8(cam * 255)).resize(base.size, Image.BILINEAR)
    color = colormaps["jet"](np.asarray(calor) / 255.0)[..., :3]
    mezcla = np.uint8(0.55 * np.asarray(base) + 0.45 * color * 255)
    buf = io.BytesIO()
    Image.fromarray(mezcla).save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


# ---------------------------------------------------------------------------
# 3. Acceso en dos niveles
#    - Invitado (sin clave): clasificar, Grad-CAM, métricas y juego.
#    - Con clave: además, la IA generativa (Claude), que es lo que tiene costo.
#    La clave vive en un archivo del servidor (solo legible por SSH) y la cambia
#    un cron diario (scripts/rotar-clave.sh). Quien la ingresa recibe una cookie
#    firmada con HMAC usando la clave vigente: al rotar, las sesiones con IA
#    dejan de ser válidas. Sin archivo de clave, nadie usa la IA generativa.
# ---------------------------------------------------------------------------
ARCHIVO_CLAVE = Path(os.getenv("ARCHIVO_CLAVE", Path(__file__).parent / "acceso" / "clave"))
COOKIE = "neurolens_sesion"
DURACION_SESION = 12 * 3600                  # segundos
MAX_FALLOS, VENTANA_FALLOS = 5, 600          # 5 intentos fallidos cada 10 min por IP
_fallos: dict[str, deque] = defaultdict(deque)


def normalizar(clave: str) -> str:
    """Ignora guiones, espacios y mayúsculas para que sea fácil de tipear."""
    return re.sub(r"[^A-Z0-9]", "", clave.upper())


def clave_actual() -> str | None:
    try:
        return normalizar(ARCHIVO_CLAVE.read_text()) or None
    except OSError:
        return None


def firmar(clave: str, vence: str) -> str:
    return hmac.new(clave.encode(), f"sesion|{vence}".encode(), hashlib.sha256).hexdigest()


def sesion_con_ia(request: Request) -> bool:
    """True si la cookie es válida para la clave vigente y no ha vencido."""
    clave = clave_actual()
    vence, _, firma = request.cookies.get(COOKIE, "").partition(".")
    return bool(clave and vence.isdigit() and int(vence) > time.time()
                and hmac.compare_digest(firma, firmar(clave, vence)))


def exigir_ia(request: Request) -> None:
    """Dependencia de FastAPI para los endpoints del LLM: 401 sin sesión con IA."""
    if not sesion_con_ia(request):
        raise HTTPException(401, "La IA generativa requiere la clave de acceso vigente.")


def ip_cliente(request: Request) -> str:
    # Detrás de Cloudflare la IP real llega en CF-Connecting-IP
    reenviada = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    return request.headers.get("cf-connecting-ip") or reenviada or (request.client.host if request.client else "?")


# ---------------------------------------------------------------------------
# 4. API
# ---------------------------------------------------------------------------
app = FastAPI(title="NeuroLens API", docs_url=None, redoc_url=None, openapi_url=None)
con_ia = [Depends(exigir_ia)]


@app.get("/")
def raiz():
    return {"estado": "ok"}


class Acceso(BaseModel):
    clave: str


@app.post("/api/acceso")
def acceso(datos: Acceso, request: Request, response: Response):
    ahora, fallos = time.time(), _fallos[ip_cliente(request)]
    while fallos and fallos[0] < ahora - VENTANA_FALLOS:
        fallos.popleft()
    if len(fallos) >= MAX_FALLOS:
        raise HTTPException(429, "Demasiados intentos. Espera unos minutos.")
    clave = clave_actual()
    if not clave or not hmac.compare_digest(normalizar(datos.clave).encode(), clave.encode()):
        fallos.append(ahora)
        raise HTTPException(401, "Clave incorrecta.")
    vence = str(int(ahora) + DURACION_SESION)
    response.set_cookie(COOKIE, f"{vence}.{firmar(clave, vence)}", max_age=DURACION_SESION,
                        httponly=True, secure=True, samesite="strict", path="/")
    return {"ok": True}


@app.get("/api/sesion")
def ver_sesion(request: Request):
    return {"ia": sesion_con_ia(request)}


@app.post("/api/salir")
def salir(response: Response):
    response.delete_cookie(COOKIE, path="/")
    return {"ok": True}


@app.get("/api/info")
def info():
    return {"clases": INFO["clases"], "umbral": UMBRAL, "metricas": METRICAS}


@app.post("/api/predict")
async def predict(file: UploadFile = File(...)):
    try:
        img = Image.open(io.BytesIO(await file.read())).convert("RGB")
    except UnidentifiedImageError:
        raise HTTPException(400, "El archivo no es una imagen válida.")
    probs, cam = clasificar(img)
    i = int(probs.argmax())
    return {
        "clase": CLASES[i],
        "nombre": NOMBRE[CLASES[i]],
        "confianza": float(probs[i]),
        "probabilidades": {c: float(p) for c, p in zip(CLASES, probs)},
        "baja_confianza": bool(probs[i] < UMBRAL),
        "umbral": UMBRAL,
        "gradcam": superponer(img, cam),
    }


# ---------------------------------------------------------------------------
# 5. Recomendación con IA generativa (Claude Haiku). Solo se envía TEXTO, nunca la imagen.
# ---------------------------------------------------------------------------
class Resultado(BaseModel):
    clase: str
    confianza: float
    probabilidades: dict[str, float]


INSTRUCCIONES = """Eres NeuroLens, un asistente EDUCATIVO que explica resultados de un modelo de \
clasificación de resonancias magnéticas cerebrales a estudiantes y público general en Chile.
Reglas obligatorias:
- NO eres médico y esto NO es un diagnóstico. Dilo explícitamente al inicio en una frase.
- Habla solo del resultado entregado, de la condición clasificada (qué es, en lenguaje simple) y \
de próximos pasos generales (consultar a neurología/neurocirugía, llevar las imágenes y el informe \
del radiólogo). Si te piden otra cosa, declina amablemente.
- Nunca indiques tratamientos, fármacos, dosis ni pronósticos.
- Si la confianza es menor al umbral, o la segunda clase está cerca, dilo claramente y pide \
revisión humana por un especialista.
- Recuerda que un falso "sin tumor" es el error más grave: si el resultado es "sin tumor" y hay \
síntomas, igualmente se debe consultar.
- Español de Chile, tono cálido y claro, máximo 180 palabras, formato markdown con 3 secciones: \
**Qué significa**, **Qué tan confiable es**, **Próximos pasos**."""


def armar_prompt(r: Resultado) -> str:
    ranking = sorted(r.probabilidades.items(), key=lambda kv: -kv[1])
    detalle = ", ".join(f"{NOMBRE.get(c, c)} {p:.0%}" for c, p in ranking)
    return (
        f"Resultado del modelo: {NOMBRE.get(r.clase, r.clase)} con confianza {r.confianza:.0%}.\n"
        f"Probabilidades: {detalle}.\n"
        f"Umbral de confianza calibrado: {UMBRAL:.0%} "
        f"({'BAJO el umbral: requiere revisión humana' if r.confianza < UMBRAL else 'sobre el umbral'}).\n"
        f"Desempeño del modelo en prueba: accuracy balanceada {METRICAS['balanced_accuracy']:.1%}."
    )


def responder_con_claude(prompt: str, instrucciones: str) -> StreamingResponse:
    """Envía el prompt a Claude y devuelve la respuesta por trozos (streaming)."""
    clave = os.getenv("ANTHROPIC_API_KEY")    # secreto de HF Spaces / archivo .env local
    if not clave:
        raise HTTPException(503, "Falta configurar ANTHROPIC_API_KEY en el servidor.")
    import anthropic

    cliente = anthropic.Anthropic(api_key=clave)

    def flujo():
        try:
            with cliente.messages.stream(
                model=os.getenv("LLM_MODEL", "claude-haiku-5-5"),
                max_tokens=800,
                thinking={"type": "disabled"},   # respuesta directa, sin razonamiento interno
                system=instrucciones,
                messages=[{"role": "user", "content": prompt}],
            ) as respuesta:
                yield from respuesta.text_stream
        except Exception as e:  # error del proveedor: se muestra dentro del texto
            yield f"\n\n_No se pudo generar la respuesta ({type(e).__name__})._"

    return StreamingResponse(flujo(), media_type="text/plain; charset=utf-8")


@app.post("/api/recomendar", dependencies=con_ia)
def recomendar(r: Resultado):
    return responder_con_claude(armar_prompt(r), INSTRUCCIONES)


# ---------------------------------------------------------------------------
# 6. Mini juego "Humano vs IA": explicar por qué falló cada uno
# ---------------------------------------------------------------------------
class Ronda(BaseModel):
    clase_real: str
    eleccion: str          # lo que eligió la persona
    prediccion: str        # lo que predijo el modelo
    confianza: float
    probabilidades: dict[str, float]


INSTRUCCIONES_JUEGO = """Eres el tutor del mini juego educativo "Humano vs IA" de NeuroLens, donde una \
persona sin formación médica y una red neuronal (YOLO-cls nano) clasifican la misma resonancia \
magnética cerebral (T1 con contraste) en: glioma, meningioma, tumor pituitario o sin tumor.
Reglas:
- Explica en español de Chile, tono cercano y motivador, máximo 150 palabras, markdown.
- Si la persona falló: explica qué rasgos visuales típicos distinguen la clase correcta de la que \
eligió (ubicación, bordes, forma, relación con el cráneo o la línea media).
- Si la IA falló: explica causas plausibles a partir de los datos entregados (probabilidades \
repartidas, confianza bajo el umbral, clases que se parecen visualmente, sesgos del dataset). No \
inventes lo que "vio" la red; habla en términos de probabilidad y de qué suele confundirla.
- Si ambos acertaron, refuerza el rasgo clave en 2 frases.
- Es un juego educativo: no des diagnósticos ni consejos médicos."""


def armar_prompt_juego(r: Ronda) -> str:
    nombre = lambda c: NOMBRE.get(c, c)
    clases = list(NOMBRE)
    real, pred = clases.index(r.clase_real), clases.index(r.prediccion)
    fila = METRICAS["matriz_confusion"][real]
    ranking = ", ".join(f"{nombre(c)} {p:.0%}" for c, p in sorted(r.probabilidades.items(), key=lambda kv: -kv[1]))
    return (
        f"Clase correcta: {nombre(r.clase_real)}.\n"
        f"La persona eligió: {nombre(r.eleccion)} ({'ACIERTO' if r.eleccion == r.clase_real else 'ERROR'}).\n"
        f"La IA predijo: {nombre(r.prediccion)} con {r.confianza:.0%} de confianza "
        f"({'ACIERTO' if r.prediccion == r.clase_real else 'ERROR'}). Probabilidades: {ranking}.\n"
        f"Umbral de confianza calibrado: {UMBRAL:.0%}.\n"
        f"En el conjunto de prueba, de {sum(fila)} imágenes de {nombre(r.clase_real)} la IA predijo "
        f"{nombre(r.prediccion)} {fila[pred]} veces."
    )


@app.post("/api/explicar-desafio", dependencies=con_ia)
def explicar_desafio(r: Ronda):
    if not {r.clase_real, r.eleccion, r.prediccion} <= set(NOMBRE):
        raise HTTPException(400, "Clase desconocida.")
    return responder_con_claude(armar_prompt_juego(r), INSTRUCCIONES_JUEGO)
