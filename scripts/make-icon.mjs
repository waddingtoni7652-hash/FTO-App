// Rasterizes public/icon.svg to build/icon.png (512x512), the source
// electron-builder converts into the Windows .ico. Rerun after editing the SVG,
// then commit the regenerated PNG.
import { mkdirSync } from 'node:fs'
import sharp from 'sharp'

mkdirSync('build', { recursive: true })
await sharp('public/icon.svg', { density: 300 })
  .resize(512, 512)
  .png()
  .toFile('build/icon.png')
console.log('Wrote build/icon.png (512x512)')
