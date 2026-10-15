#!/bin/sh
set -e

echo "[MinIO Init] Waiting for MinIO service to become available..."
until /usr/bin/mc alias set local http://minio:9000 "${MINIO_ROOT_USER:-clikgett_minio_admin}" "${MINIO_ROOT_PASSWORD:-clikgett_minio_pass123}"; do
  echo "[MinIO Init] MinIO not ready yet, retrying in 2 seconds..."
  sleep 2
done

echo "[MinIO Init] MinIO connected. Creating required buckets..."

# Create buckets idempotently
/usr/bin/mc mb --ignore-existing local/clikgett-media
/usr/bin/mc mb --ignore-existing local/clikgett-uploads

# Set public read access on media bucket so local frontend can display images
/usr/bin/mc anonymous set download local/clikgett-media
/usr/bin/mc anonymous set download local/clikgett-uploads

echo "[MinIO Init] Buckets verified:"
/usr/bin/mc ls local

echo "[MinIO Init] Complete."
exit 0
