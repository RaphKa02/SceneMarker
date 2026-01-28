#!/usr/bin/env bash
set -euo pipefail

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# --- Konfiguration ---
# Ersetze den Token oder setze ihn als Umgebungsvariable
GITLAB_TOKEN="${GITLAB_TOKEN:-DEIN_PERSONAL_ACCESS_TOKEN}"
GITLAB_URL="https://gitlab.karl-raphael.de"
SNIPPET_ID="1"

# --- Helper: Extract current version from package.json ---
current_version=$(grep '"version"' package.json | head -1 | sed -E 's/.*"([0-9]+\.[0-9]+\.[0-9]+)".*/\1/')
IFS='.' read -r major minor patch <<< "$current_version"
next_version="${major}.${minor}.$((patch + 1))"

echo "Current version: $current_version"
read -p "Enter next version [${next_version}]: " input_version
new_version="${input_version:-$next_version}"

echo "Bumping version to $new_version ..."
echo
echo "Please update CHANGELOG.md with the release notes for version ${new_version}."
read -p "Press any key to continue after updating CHANGELOG.md..."

# --- Update version in files ---
sed -i.bak -E "s/\"version\": *\"[0-9]+\.[0-9]+\.[0-9]+\"/\"version\": \"${new_version}\"/" package.json
rm -f package.json.bak

sed -i.bak -E "s/^version *= *\"[0-9]+\.[0-9]+\.[0-9]+\"/version = \"${new_version}\"/" src-tauri/Cargo.toml
rm -f src-tauri/Cargo.toml.bak

sed -i.bak -E "s|(version-)[0-9]+\.[0-9]+\.[0-9]+(-blue)|\1${new_version}\2|" README.md
rm -f README.md.bak

# --- Build ---
export TAURI_SIGNING_PRIVATE_KEY="/c/Users/Raphael Karl/.tauri/scene-marker.key"

echo "Building Tauri app..."
pnpm tauri build --ci

# --- Commit & Tag ---
git add package.json src-tauri/Cargo.toml src-tauri/Cargo.lock README.md CHANGELOG.md
git commit -m "chore: Bump version to ${new_version}"
git tag -a v${new_version} -m "Release v${new_version}"

echo "Renaming build artifacts..."
pnpm rename

echo "Uploading MSI files..."
scp src-tauri/target/release/upload/SceneMarker-latest-windows-{DE,US}-x64.msi nlinux:~/docker/compose/scene-marker/web/downloads

# --- Update GitLab Snippet (Update Server) ---
SIG_FILE="src-tauri/target/release/upload/SceneMarker-latest-windows-DE-x64.msi.sig"
CURRENT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if [ -f "$SIG_FILE" ]; then
    SIGNATURE=$(cat "$SIG_FILE")
    echo "Updating GitLab Snippet at $GITLAB_URL..."

    # JSON Content zusammenbauen
    SNIPPET_CONTENT="{
  \"version\": \"${new_version}\",
  \"notes\": \"${new_version} update\",
  \"pub_date\": \"${CURRENT_DATE}\",
  \"platforms\": {
    \"windows-x86_64\": {
      \"signature\": \"${SIGNATURE}\",
      \"url\": \"https://scenemarker.karl-raphael.de/downloads/SceneMarker-latest-windows-DE-x64.msi\"
    }
  }
}"

    # API Call an deine Instanz
    curl --request PUT "${GITLAB_URL}/api/v4/projects/8/snippets/${SNIPPET_ID}" \
         --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
         --form "content=${SNIPPET_CONTENT}"

    echo "✅ GitLab Snippet #$SNIPPET_ID updated!"
else
    echo "⚠️ Warning: Signature file not found. Snippet update skipped."
fi

echo
echo "✅ Release complete for version ${new_version}!"
