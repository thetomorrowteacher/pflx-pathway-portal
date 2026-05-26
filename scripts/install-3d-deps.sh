#!/usr/bin/env bash
# Install the three.js stack for the pathway 3D migration.
# Pinned to versions compatible with React 18 / Next 14.
#
# Usage:
#   chmod +x scripts/install-3d-deps.sh
#   ./scripts/install-3d-deps.sh
#
# Note: package.json already lists these deps. Running `npm install` alone is
# enough — this script just gives you a single command that also handles the
# React peer-dep conflict on the latest @react-three/fiber.

set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Installing three.js + react-three-fiber stack (React 18 compatible pins)"

npm install \
  three@^0.160.0 \
  @react-three/fiber@^8.17.10 \
  @react-three/drei@^9.114.0 \
  @react-three/postprocessing@^2.16.3 \
  @react-three/rapier@^1.5.0 \
  three-stdlib@^2.32.0 \
  --save \
  --legacy-peer-deps

npm install \
  @types/three@^0.160.0 \
  leva@^0.9.35 \
  --save-dev \
  --legacy-peer-deps

echo "==> Done. Verify with:"
echo "    npm ls three @react-three/fiber @react-three/drei"
