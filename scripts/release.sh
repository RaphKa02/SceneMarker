#!/usr/bin/env bash
set -euo pipefail

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

# --- Update version in package.json ---
sed -i.bak -E "s/\"version\": *\"[0-9]+\.[0-9]+\.[0-9]+\"/\"version\": \"${new_version}\"/" package.json
rm -f package.json.bak

# --- Update version in src-tauri/Cargo.toml ---
sed -i.bak -E "s/^version *= *\"[0-9]+\.[0-9]+\.[0-9]+\"/version = \"${new_version}\"/" src-tauri/Cargo.toml
rm -f src-tauri/Cargo.toml.bak

# --- Update version in README.md badge ---
sed -i.bak -E "s|(version-)[0-9]+\.[0-9]+\.[0-9]+(-blue)|\1${new_version}\2|" README.md
rm -f README.md.bak

# --- Build & Commit & Upload ---
export TAURI_SIGNING_PRIVATE_KEY="/c/Users/Raphael Karl/.tauri/scene-marker.key"

echo "Building Tauri app..."
pnpm tauri build --ci

# --- Commit changes ---
git add package.json src-tauri/Cargo.toml src-tauri/Cargo.lock README.md CHANGELOG.md
git commit -m "chore: Bump version to ${new_version}"
git tag -a v${new_version} -m "Release v${new_version}"

echo "Renaming build artifacts..."
pnpm rename

echo "Uploading MSI files..."
scp src-tauri/target/release/upload/SceneMarker-latest-windows-{DE,US}-x64.msi nlinux:~/docker/compose/scene-marker/web/downloads

echo
echo "Signature file contents:"
cat src-tauri/target/release/upload/SceneMarker-latest-windows-DE-x64.msi.sig

echo
echo "✅ Release complete for version ${new_version}!"
