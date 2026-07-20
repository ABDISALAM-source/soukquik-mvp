import Jimp from 'jimp';

// Recherche par image SANS API externe (contrainte "stop avant intégration
// payante"). On calcule une empreinte perceptuelle dHash 64 bits :
//   - image réduite en 9x8 niveaux de gris
//   - pour chaque ligne, on compare chaque pixel à son voisin de droite
//     (8 comparaisons x 8 lignes = 64 bits)
// Deux images visuellement proches ont un hash proche (petite distance de
// Hamming). Limite assumée : reconnaît des visuels proches (même photo,
// recadrage, teintes voisines), pas la sémantique fine d'un modèle de vision.

export async function computeDHash(buffer: Buffer): Promise<string | null> {
  try {
    const image = await Jimp.read(buffer);
    image.resize(9, 8).grayscale();
    let bits = '';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const left = Jimp.intToRGBA(image.getPixelColor(x, y)).r;
        const right = Jimp.intToRGBA(image.getPixelColor(x + 1, y)).r;
        bits += left < right ? '1' : '0';
      }
    }
    // 64 bits -> 16 chiffres hex.
    let hex = '';
    for (let i = 0; i < 64; i += 4) {
      hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    }
    return hex;
  } catch {
    return null;
  }
}

export async function computeDHashFromUrl(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return computeDHash(buf);
  } catch {
    return null;
  }
}

// Distance de Hamming entre deux hash hex (nombre de bits différents, 0..64).
export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return 64;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    let xor = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (xor) {
      dist += xor & 1;
      xor >>= 1;
    }
  }
  return dist;
}
