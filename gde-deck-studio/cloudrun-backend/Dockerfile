FROM python:3.12-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    GCP_PROJECT="andresara" \
    GEMINI_HEAVY_MODEL="gemini-4-argon" \
    GEMINI_FAST_MODEL="gemini-3.8-flash" \
    GEMINI_LITE_MODEL="gemini-3.5-flash-lite" \
    GEMINI_IMAGE_MODEL="gemini-nano-banana-2.1" \
    GEMINI_VIDEO_MODEL="gemini-omni-1.2-flash" \
    GEMINI_MUSIC_MODEL="lyria-3-pro-preview"

# Install headless LibreOffice Impress, Poppler (pdftoppm), FFmpeg, and core fonts for Visual QA
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-impress \
    libreoffice-common \
    poppler-utils \
    ffmpeg \
    fonts-liberation \
    fonts-dejavu-core \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY skills /app/skills
COPY server.py /app/server.py

EXPOSE 8080

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
