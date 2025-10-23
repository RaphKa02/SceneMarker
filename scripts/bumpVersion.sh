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

# --- Update version in package.json ---
sed -i.bak -E "s/\"version\": *\"[0-9]+\.[0-9]+\.[0-9]+\"/\"version\": \"${new_version}\"/" package.json
rm -f package.json.bak

# --- Update version in src-tauri/Cargo.toml ---
sed -i.bak -E "s/^version *= *\"[0-9]+\.[0-9]+\.[0-9]+\"/version = \"${new_version}\"/" src-tauri/Cargo.toml
rm -f src-tauri/Cargo.toml.bak

# --- Update version in README.md badge ---
sed -i.bak -E "s|(version-)[0-9]+\.[0-9]+\.[0-9]+(-blue)|\1${new_version}\2|" README.md
rm -f README.md.bak

sleep 5

# --- Commit changes ---
git add package.json src-tauri/Cargo.toml src-tauri/Cargo.lock README.md CHANGELOG.md
git commit -m "chore: Bump version to ${new_version}"