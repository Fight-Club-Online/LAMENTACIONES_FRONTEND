import { Jimp } from 'jimp';

const FRAME_W = 84;
const FRAME_H = 84;
const FRAMES = 8;
const THRESHOLD = 20;

const INPUT = './public/FighterAssets/caballero/caballero_IDLE.png';
const OUTPUT = './public/FighterAssets/caballero/caballero_IDLE_fixed.png';

function intToRGBA(intColor) {
  const c = intColor >>> 0;
  return {
    r: (c >>> 24) & 255,
    g: (c >>> 16) & 255,
    b: (c >>> 8) & 255,
    a: c & 255,
  };
}

async function run() {
  const sheet = await Jimp.read(INPUT);
  console.log(`Hoja: ${sheet.bitmap.width}x${sheet.bitmap.height}`);

  const bgInt = sheet.getPixelColor(0, 0);
  const bg = intToRGBA(bgInt);
  console.log(`Fondo detectado: rgba(${bg.r},${bg.g},${bg.b},${bg.a})`);

  const result = new Jimp({
    width: FRAME_W * FRAMES,
    height: FRAME_H,
    color: bgInt,
  });

  for (let f = 0; f < FRAMES; f++) {
    const x0 = f * FRAME_W;

    const frame = sheet.clone().crop({
      x: x0,
      y: 0,
      w: FRAME_W,
      h: FRAME_H,
    });

    let minX = FRAME_W;
    let maxX = -1;
    let minY = FRAME_H;
    let maxY = -1;

    frame.scan(0, 0, FRAME_W, FRAME_H, function (x, y, idx) {
      const r = this.bitmap.data[idx];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      const a = this.bitmap.data[idx + 3];

      const isBackground =
        bg.a < 10
          ? a < 10
          : Math.abs(r - bg.r) + Math.abs(g - bg.g) + Math.abs(b - bg.b) < THRESHOLD;

      if (!isBackground) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    });

    if (maxX < 0) {
      console.log(`Frame ${f}: vacío`);
      continue;
    }

    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    console.log(`Frame ${f}: sprite en (${minX},${minY}) tamaño ${w}x${h}`);

    const content = frame.clone().crop({
      x: minX,
      y: minY,
      w,
      h,
    });

    const dx = f * FRAME_W + Math.floor((FRAME_W - w) / 2);
    const dy = Math.floor((FRAME_H - h) / 2);

    result.composite(content, dx, dy);
  }

  await result.write(OUTPUT);
  console.log(`✓ Guardado: ${OUTPUT}`);
}

run().catch((err) => {
  console.error('Error ejecutando fix-sprite:', err);
  process.exitCode = 1;
});