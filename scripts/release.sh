#!/bin/bash
# Dialogue Atlas — release builder
# Usage: bash scripts/release.sh
#
# Builds a signed .dmg + updater bundle, copies them to a Desktop release folder,
# and generates latest.json. Then drag those into a new GitHub release.

set -euo pipefail

KEY_PATH="$HOME/.dialogue-atlas-keys/updater.key"
if [[ ! -f "$KEY_PATH" ]]; then
  echo "ERROR: Updater private key not found at $KEY_PATH" >&2
  echo "Generate one with: npm run tauri signer generate -- -w $KEY_PATH --ci -p ''" >&2
  exit 1
fi

# Pick up the version from package.json
VERSION=$(node -p "require('./package.json').version")
RELEASE_DIR="$HOME/Desktop/Dialogue Atlas - Release v${VERSION}"

echo "Building Dialogue Atlas v${VERSION}…"
export TAURI_SIGNING_PRIVATE_KEY="$(cat "$KEY_PATH")"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""

npm run tauri build

BUNDLE_DIR="src-tauri/target/release/bundle"
DMG_FILE="${BUNDLE_DIR}/dmg/Dialogue Atlas_${VERSION}_aarch64.dmg"
APP_TGZ="${BUNDLE_DIR}/macos/Dialogue Atlas.app.tar.gz"
SIG_FILE="${BUNDLE_DIR}/macos/Dialogue Atlas.app.tar.gz.sig"

if [[ ! -f "$DMG_FILE" ]]; then
  echo "ERROR: .dmg not found at $DMG_FILE" >&2
  exit 1
fi

mkdir -p "$RELEASE_DIR"
cp "$DMG_FILE" "$RELEASE_DIR/"
cp "$APP_TGZ" "$RELEASE_DIR/"
cp "$SIG_FILE" "$RELEASE_DIR/"

SIG_CONTENT=$(cat "$SIG_FILE")
PUB_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)

cat > "$RELEASE_DIR/latest.json" <<JSON
{
  "version": "${VERSION}",
  "notes": "Update Dialogue Atlas to v${VERSION}.",
  "pub_date": "${PUB_DATE}",
  "platforms": {
    "darwin-aarch64": {
      "signature": "${SIG_CONTENT}",
      "url": "https://github.com/Bumble-Dialogue/dialogue-atlas-releases/releases/download/v${VERSION}/Dialogue.Atlas.app.tar.gz"
    }
  }
}
JSON

echo ""
echo "✅ Release built. Files at:"
echo "   $RELEASE_DIR"
echo ""
echo "Next steps:"
echo "  1. Go to https://github.com/Bumble-Dialogue/dialogue-atlas-releases/releases/new"
echo "  2. Tag: v${VERSION}    Title: Dialogue Atlas v${VERSION}"
echo "  3. Upload: Dialogue Atlas.app.tar.gz, Dialogue Atlas.app.tar.gz.sig, latest.json"
echo "  4. Optionally upload the .dmg for first-install users."
echo "  5. Publish. Bojan's app will detect the update next launch."
