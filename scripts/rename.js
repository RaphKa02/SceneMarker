import { copyFileSync, existsSync, mkdirSync, renameSync } from 'fs';
import json from '../package.json' with { type: 'json' };

const version = json.version;

if (!existsSync('./src-tauri/target/release/upload')) {
  mkdirSync('./src-tauri/target/release/upload');
}

try {
  copyFileSync(
    `./src-tauri/target/release/bundle/msi/SceneMarker_${version}_x64_de-DE.msi`,
    `./src-tauri/target/release/upload/SceneMarker-latest-windows-DE-x64.msi`
  );
  renameSync(
    `./src-tauri/target/release/bundle/msi/SceneMarker_${version}_x64_de-DE.msi`,
    `./src-tauri/target/release/upload/SceneMarker-${version}-windows-DE-x64.msi`
  );
  copyFileSync(
    `./src-tauri/target/release/bundle/msi/SceneMarker_${version}_x64_en-US.msi`,
    `./src-tauri/target/release/upload/SceneMarker-latest-windows-US-x64.msi`
  );
  renameSync(
    `./src-tauri/target/release/bundle/msi/SceneMarker_${version}_x64_en-US.msi`,
    `./src-tauri/target/release/upload/SceneMarker-${version}-windows-US-x64.msi`
  );
} catch (err) {
  console.log('File not found');
}
