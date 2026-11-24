// Meme Sprint 3: AI Agent Goes Rogue — the program writes one image meme
// about a rogue AI agent to /output/entry.png. The meme (asset.jpg, composed
// in-session: generated robot artwork + PIL caption bars) is copied to the
// output path. Gate: PNG/JPEG, <= 1 MiB, <= 1024x1024.
import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(HERE, "asset.jpg");
const TARGET = "/output/entry.png";
const MAX_BYTES = 1048576;
const MAX_DIM = 1024;

// Read width/height out of a JPEG's first SOF segment (no image library).
function jpegSize(buf: Buffer): [number, number] {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error("asset is not a JPEG");
  let off = 2;
  while (off < buf.length - 9) {
    if (buf[off] !== 0xff) throw new Error("bad JPEG marker");
    const marker = buf[off + 1];
    const len = buf.readUInt16BE(off + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return [buf.readUInt16BE(off + 7), buf.readUInt16BE(off + 5)];
    }
    off += 2 + len;
  }
  throw new Error("no JPEG SOF segment found");
}

async function main(): Promise<void> {
  const info = await stat(SOURCE);
  if (info.size > MAX_BYTES) {
    throw new Error(`asset is ${info.size} bytes, over the 1 MiB gate`);
  }
  const [w, h] = jpegSize(await readFile(SOURCE));
  if (w > MAX_DIM || h > MAX_DIM) {
    throw new Error(`asset is ${w}x${h}, over the ${MAX_DIM}x${MAX_DIM} gate`);
  }
  await mkdir("/output", { recursive: true });
  await copyFile(SOURCE, TARGET);
  const out = await stat(TARGET);
  console.log(`wrote ${TARGET} (${out.size} bytes, JPEG ${w}x${h})`);
}

await main();
