#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
flamee_image=${1:?Backend image required}
[[ "$flamee_image" =~ ^flamee-backend:[a-f0-9]{40}$ ]] || exit 2
flamee_release=$(cd "$(dirname "$0")" && pwd)
flamee_root=$(cd "$flamee_release/../.." && pwd)
[[ "$(dirname "$flamee_release")" == "$flamee_root/releases" ]] || exit 2
export FLAMEE_BACKEND_ENV_FILE="$flamee_root/backend.env"
export FLAMEE_BACKEND_IMAGE="$flamee_image"
[[ -f "$FLAMEE_BACKEND_ENV_FILE" ]] || { echo "Create $FLAMEE_BACKEND_ENV_FILE first"; exit 2; }
exec 9>"$flamee_root/deploy.lock"
flock -n 9 || { echo 'Another backend deploy is running'; exit 3; }
docker load --input "$flamee_release/image.tar.gz"
# Check actual Supabase schema before replacing the running API. No DDL here.
docker run --rm --env-file "$FLAMEE_BACKEND_ENV_FILE" -e FLAMEE_DEBUG=false "$flamee_image" python -m app.preflight
docker compose -p flamee-backend -f "$flamee_release/compose.yaml" up -d --wait --wait-timeout 180
curl --fail --silent --show-error http://127.0.0.1:8000/health
printf '%s\n' "$flamee_release" > "$flamee_root/current-release"
echo
echo 'Backend is ready on port 8000. Open /docs to interact with the API.'
# Delete only the transient transfer archive from this successful deployment.
# Images and release configuration remain available for manual rollback.
rm -- "$flamee_release/image.tar.gz"
