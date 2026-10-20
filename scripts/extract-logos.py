# Extrai apenas o escudo (bitmap) de cada página dos PDFs oficiais,
# descartando o nome da atlética e o selo "Olimpíada UFU" abaixo dele.
# Uso: python scripts/extract-logos.py <pdf1> <pdf2> ...
import io
import os
import sys
import unicodedata

import pymupdf
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'logos')
NAME_TO_ID = {
    'AGRARIAS': 'agrarias', 'APLICADA': 'aplicada', 'ARTES': 'artes', 'BIOLOGICAS': 'biologicas',
    'COMPUTACAO': 'computacao', 'DIREITO': 'direito', 'EDUCA': 'educa', 'ENGENHARIA': 'engenharia',
    'FISIOTERAPIA': 'fisioterapia', 'HUMANAS': 'humanas', 'MEDICINA': 'medicina', 'MOCA': 'moca',
    'MONETARIA': 'monetaria', 'ODONTO': 'odonto', 'PSICOLOGIA': 'psicologia', 'INFERNAL': 'infernal',
}
SIZE = 192


def norm(s: str) -> str:
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().upper()
    return s.strip().split('\n')[0].split(' ')[0]


def remove_white_bg(im: Image.Image) -> Image.Image:
    """Torna transparente o fundo branco conectado às bordas (flood fill)."""
    im = im.convert('RGBA')
    w, h = im.size
    px = im.load()
    seen = bytearray(w * h)
    stack = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]
    white = lambda p: p[0] > 235 and p[1] > 235 and p[2] > 235
    while stack:
        x, y = stack.pop()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        p = px[x, y]
        if not white(p):
            continue
        px[x, y] = (255, 255, 255, 0)
        if x > 0: stack.append((x - 1, y))
        if x < w - 1: stack.append((x + 1, y))
        if y > 0: stack.append((x, y - 1))
        if y < h - 1: stack.append((x, y + 1))
    return im


def drop_edge_fragments(im: Image.Image) -> Image.Image:
    """Remove pequenos fragmentos opacos encostados na borda (cantos do fundo da página, linhas soltas)."""
    import numpy as np
    from scipy import ndimage

    a = np.array(im)
    mask = a[..., 3] > 0
    lab, n = ndimage.label(mask)
    if n == 0:
        return im
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    biggest = sizes.max()
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    for k in edge:
        if sizes[k - 1] < biggest * 0.15:
            a[lab == k, 3] = 0
    return Image.fromarray(a)


def square(im: Image.Image) -> Image.Image:
    im = drop_edge_fragments(im)
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    s = max(im.size)
    canvas = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    canvas.paste(im, ((s - im.width) // 2, (s - im.height) // 2))
    return canvas.resize((SIZE, SIZE), Image.LANCZOS)


def main(paths):
    os.makedirs(OUT, exist_ok=True)
    for path in paths:
        doc = pymupdf.open(path)
        for page in doc:
            key = norm(page.get_text())
            aid = NAME_TO_ID.get(key)
            if not aid:
                print('ignorado:', key)
                continue
            rects = [pymupdf.Rect(info['bbox']) for info in page.get_image_info()]
            if not rects:
                continue
            clip = rects[0]
            for r in rects[1:]:
                clip |= r
            # Corta a região do escudo e descarta qualquer texto vetorial abaixo
            text_top = min((b[1] for b in page.get_text('blocks')), default=clip.y1)
            clip.y1 = min(clip.y1, text_top - 2)
            pix = page.get_pixmap(clip=clip, dpi=200, alpha=False)
            im = Image.open(io.BytesIO(pix.tobytes('png')))
            out = square(remove_white_bg(im))
            out.save(os.path.join(OUT, f'{aid}.png'), optimize=True)
            print('ok:', aid, clip)


if __name__ == '__main__':
    main(sys.argv[1:])
