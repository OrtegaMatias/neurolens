# Imagen para Hugging Face Spaces (SDK Docker, puerto 7860)
FROM python:3.12-slim
# librerías de sistema que necesita OpenCV (dependencia de ultralytics)
RUN apt-get update && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH" YOLO_OFFLINE=1 YOLO_CONFIG_DIR=/tmp/Ultralytics
WORKDIR /app
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY --chown=user app.py .
COPY --chown=user modelo/ modelo/
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
