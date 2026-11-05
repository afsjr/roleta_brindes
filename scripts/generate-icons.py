#!/usr/bin/env python3
import math
from PIL import Image, ImageDraw

BASE = 1536
CENTER = BASE // 2
RADIUS = int(BASE * 0.37)
COLORS = ["#4f46e5", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316"]


def gradient(size):
    img = Image.new("RGB", (size, size))
    draw = ImageDraw.Draw(img)
    top = (79, 70, 229)
    bottom = (124, 58, 237)
    for y in range(size):
        t = y / max(1, size - 1)
        color = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        draw.line([(0, y), (size, y)], fill=color)
    return img


def build():
    img = gradient(BASE).convert("RGBA")
    draw = ImageDraw.Draw(img)
    slices = len(COLORS)
    step = 360 / slices

    for i, color in enumerate(COLORS):
        start = -90 + i * step
        end = start + step
        bbox = [CENTER - RADIUS, CENTER - RADIUS, CENTER + RADIUS, CENTER + RADIUS]
        draw.pieslice(bbox, start=start, end=end, fill=color)

    line_width = max(2, int(BASE * 0.006))
    for i in range(slices):
        angle = math.radians(-90 + i * step)
        x = CENTER + math.cos(angle) * RADIUS
        y = CENTER + math.sin(angle) * RADIUS
        draw.line([(CENTER, CENTER), (x, y)], fill="#ffffff", width=line_width)

    ring = max(2, int(BASE * 0.012))
    draw.ellipse(
        [CENTER - RADIUS, CENTER - RADIUS, CENTER + RADIUS, CENTER + RADIUS],
        outline="#ffffff",
        width=ring,
    )

    hub = int(BASE * 0.11)
    draw.ellipse([CENTER - hub, CENTER - hub, CENTER + hub, CENTER + hub], fill="#ffffff")
    inner = int(BASE * 0.045)
    draw.ellipse([CENTER - inner, CENTER - inner, CENTER + inner, CENTER + inner], fill="#4f46e5")

    return img


def main():
    icon = build()
    targets = {
        "icon-512.png": 512,
        "icon-192.png": 192,
        "apple-touch-icon.png": 180,
        "favicon-32.png": 32,
    }
    for name, size in targets.items():
        icon.resize((size, size), Image.LANCZOS).save("assets/icons/" + name, optimize=True)


if __name__ == "__main__":
    main()
