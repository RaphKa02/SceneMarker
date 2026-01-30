#!/usr/bin/env bash
set -euo pipefail

# --- Pre-flight Checks ---
command -v jq >/dev/null 2>&1 || { echo >&2 "I require jq but it's not installed. Aborting."; exit 1; }
command -v curl >/dev/null 2>&1 || { echo >&2 "I require curl but it's not installed. Aborting."; exit 1; }

if [ -f .env ]; then
  # Automatically export variables from .env
  export $(grep -v '^#' .env | xargs)
fi

# ==============================================================================
# CONFIGURATION
# ==============================================================================

GITLAB_URL="https://gitlab.karl-raphael.de"
GITLAB_TOKEN="${GITLAB_TOKEN:-}" # Ensure this is in your .env file
# !! IMPORTANT: The ID of the project (Repository) where the snippet lives !!
PROJECT_ID="8" 
SNIPPET_ID="1"
SNIPPET_FILENAME="updates.json"

# Base URL where the files are hosted (for the Tauri JSON)
DOWNLOAD_BASE_URL="https://scenemarker.karl-raphael.de/downloads" 

# ==============================================================================
# VERSION BUMPING
# ==============================================================================

# Extract current version from package.json
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

# Update files
sed -i.bak -E "s/\"version\": *\"[0-9]+\.[0-9]+\.[0-9]+\"/\"version\": \"${new_version}\"/" package.json
rm -f package.json.bak

sed -i.bak -E "s/^version *= *\"[0-9]+\.[0-9]+\.[0-9]+\"/version = \"${new_version}\"/" src-tauri/Cargo.toml
rm -f src-tauri/Cargo.toml.bak

sed -i.bak -E "s|(version-)[0-9]+\.[0-9]+\.[0-9]+(-blue)|\1${new_version}\2|" README.md
rm -f README.md.bak

# ==============================================================================
# BUILD
# ==============================================================================

export TAURI_SIGNING_PRIVATE_KEY="$HOME/.tauri/scene-marker.key"

echo "Building Tauri app..."
pnpm tauri build --ci

# ==============================================================================
# COMMIT & TAG
# ==============================================================================

git add package.json src-tauri/Cargo.toml src-tauri/Cargo.lock README.md CHANGELOG.md
git commit -m "chore: Bump version to ${new_version}"
git tag -a v${new_version} -m "Release v${new_version}"

echo "Renaming build artifacts..."
pnpm rename

echo "Uploading MSI files..."
scp src-tauri/target/release/upload/SceneMarker-latest-windows-{DE,US}-x64.msi nlinux:~/docker/compose/scene-marker/web/downloads

# ==============================================================================
# UPDATE GITLAB SNIPPET
# ==============================================================================

# Path to the German signature file (Used as the main update signature)
SIG_FILE="src-tauri/target/release/upload/SceneMarker-latest-windows-DE-x64.msi.sig"
# The specific MSI filename for the update URL
MSI_FILENAME="SceneMarker-latest-windows-DE-x64.msi"

CURRENT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# TODO: Optionally parse CHANGELOG.md here to get real notes. 
# For now, we use a generic note.
RELEASE_NOTES="Update to version ${new_version}. See CHANGELOG for details."

if [ -f "$SIG_FILE" ]; then
    SIGNATURE=$(cat "$SIG_FILE")
    FULL_DOWNLOAD_URL="${DOWNLOAD_BASE_URL}/${MSI_FILENAME}"
    
    echo "--------------------------------------------------"
    echo "Preparing GitLab Snippet Update..."
    echo "Target: ${GITLAB_URL} (Project: ${PROJECT_ID}, Snippet: ${SNIPPET_ID})"
    
    # 1. Generate Tauri JSON content using jq
    TAURI_JSON_CONTENT=$(jq -n \
      --arg ver "$new_version" \
      --arg notes "$RELEASE_NOTES" \
      --arg date "$CURRENT_DATE" \
      --arg sig "$SIGNATURE" \
      --arg url "$FULL_DOWNLOAD_URL" \
      '{
        version: $ver,
        notes: $notes,
        pub_date: $date,
        platforms: {
          "windows-x86_64": {
            signature: $sig,
            url: $url
          }
        }
      }')

    # 2. Wrap it in GitLab API structure
    API_PAYLOAD=$(jq -n \
      --arg title "Tauri Update Manifest" \
      --arg filename "$SNIPPET_FILENAME" \
      --arg content "$TAURI_JSON_CONTENT" \
      '{
        title: $title,
        visibility: "public",
        files: [
          {
            action: "update",
            file_path: $filename,
            content: $content
          }
        ]
      }')

    # 3. Send to GitLab
    RESPONSE=$(curl --silent --show-error --request PUT "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/snippets/${SNIPPET_ID}" \
         --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
         --header "Content-Type: application/json" \
         --data "$API_PAYLOAD")

    # 4. Verification
    WEB_URL=$(echo "$RESPONSE" | jq -r '.web_url // empty')
    
    if [ ! -z "$WEB_URL" ]; then
        echo "✅ GitLab Snippet updated successfully!"
        echo "   URL: $WEB_URL"
    else
        echo "❌ Error: Snippet update failed."
        echo "   Response: $RESPONSE"
        # Optional: exit 1 here if you want the script to fail on API error
    fi

else
    echo "⚠️ Warning: Signature file ($SIG_FILE) not found. Snippet update skipped."
fi

echo
echo "✅ Release complete for version ${new_version}!"
