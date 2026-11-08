#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${GCP_PROJECT:-andresara}"
SERVICE_NAME="${SERVICE_NAME:-gde-stage-pptx-studio}"
REGION="${REGION:-us-central1}"

echo "Deploying ${SERVICE_NAME} to Google Cloud Run (Project: ${PROJECT_ID}, Region: ${REGION})..."

gcloud run deploy "${SERVICE_NAME}" \
  --quiet \
  --source . \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --timeout 3600 \
  --set-env-vars "GCP_PROJECT=${PROJECT_ID},GEMINI_HEAVY_MODEL=gemini-4-argon,GEMINI_FAST_MODEL=gemini-3.8-flash,GEMINI_LITE_MODEL=gemini-3.5-flash-lite,GEMINI_IMAGE_MODEL=gemini-nano-banana-2.1,GEMINI_VIDEO_MODEL=gemini-omni-1.2-flash,GEMINI_MUSIC_MODEL=lyria-3-pro-preview"

echo "Cloud Run service deployed."
