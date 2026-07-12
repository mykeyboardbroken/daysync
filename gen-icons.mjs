import sharp from 'sharp'

// Full-bleed icon (accent fills the whole square + a white check) so iOS's own
// corner-rounding looks clean.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#6366f1"/>
  <path d="M150 262 l68 68 l146 -150" fill="none" stroke="#ffffff" stroke-width="46"
    stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
const buf = Buffer.from(svg)

const out = { 'icon-192.png': 192, 'icon-512.png': 512, 'apple-touch-icon.png': 180 }
for (const [name, size] of Object.entries(out)) {
  await sharp(buf).resize(size, size).png().toFile(`public/${name}`)
  console.log('wrote public/' + name)
}
