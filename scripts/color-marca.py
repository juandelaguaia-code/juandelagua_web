#!/usr/bin/env python3
"""
Ajusta imágenes y videos generados (Higgsfield) a la paleta de la marca: Marino, Corriente y Perla.

Cómo funciona: la luminancia de cada píxel se lleva a una rampa de colores de la marca
(de #08192a a #f5f3ec) y el resultado se mezcla con el original. Mezcla 0.8 para el mar de
la portada y las olas del frente, 0.7 para la gran ola (conserva un poco más del original).

Uso:
  # LUT para videos (ffmpeg la aplica con el filtro lut3d)
  python3 scripts/color-marca.py lut marca-80.cube 0.8

  # Imagen (conserva la transparencia de un PNG)
  python3 scripts/color-marca.py imagen entrada.webp salida.jpg 0.7

Requiere numpy y Pillow (pip install numpy pillow). Los pasos completos están en
docs/continuar-en-otra-sesion.md.
"""
import sys

import numpy as np

STOPS = [
    (0.00, '#08192a'), (0.07, '#0b2338'), (0.13, '#0e2a43'), (0.20, '#123553'),
    (0.28, '#174761'), (0.38, '#1b6470'), (0.50, '#1e8a83'), (0.62, '#3fb3a8'),
    (0.74, '#8fd3ca'), (0.86, '#d6ece6'), (1.00, '#f5f3ec'),
]


def _hex(c):
    c = c.lstrip('#')
    return np.array([int(c[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255


XS = np.array([s for s, _ in STOPS])
COLS = np.stack([_hex(c) for _, c in STOPS])


def grade(rgb, mix):
    """rgb: arreglo float 0..1 (..., 3). Devuelve el color de marca mezclado con el original."""
    lum = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    mapped = np.stack([np.interp(lum, XS, COLS[:, k]) for k in range(3)], -1)
    return np.clip(mapped * mix + rgb * (1 - mix), 0, 1)


def write_cube(path, mix, n=33):
    g = np.linspace(0, 1, n, dtype=np.float32)
    b, gg, r = np.meshgrid(g, g, g, indexing='ij')  # en .cube el rojo varía más rápido
    rgb = np.stack([r, gg, b], -1).reshape(-1, 3)
    out = grade(rgb, mix)
    with open(path, 'w') as f:
        f.write(f'TITLE "marca"\nLUT_3D_SIZE {n}\n')
        for v in out:
            f.write(f'{v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n')


def grade_image(src, dst, mix):
    from PIL import Image
    im = Image.open(src)
    if im.mode in ('RGBA', 'LA', 'P'):
        a = np.asarray(im.convert('RGBA')).astype(np.float32) / 255
        out = np.dstack([grade(a[..., :3], mix), a[..., 3:]])
        Image.fromarray((out * 255 + 0.5).astype(np.uint8), 'RGBA').save(dst, optimize=True)
    else:
        a = np.asarray(im.convert('RGB')).astype(np.float32) / 255
        res = Image.fromarray((grade(a, mix) * 255 + 0.5).astype(np.uint8))
        if dst.lower().endswith(('.jpg', '.jpeg')):
            res.save(dst, quality=90, optimize=True, progressive=True, subsampling=0)
        else:
            res.save(dst, optimize=True)


if __name__ == '__main__':
    if len(sys.argv) == 4 and sys.argv[1] == 'lut':
        write_cube(sys.argv[2], float(sys.argv[3]))
    elif len(sys.argv) == 5 and sys.argv[1] == 'imagen':
        grade_image(sys.argv[2], sys.argv[3], float(sys.argv[4]))
    else:
        print(__doc__)
        sys.exit(1)
