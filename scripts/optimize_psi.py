"""Generate PSI-friendly image variants."""
from pathlib import Path
from PIL import Image

try:
    from pillow_heif import register_heif_opener

    register_heif_opener()
except ImportError:
    pass

ROOT = Path(__file__).resolve().parent.parent


def save_webp(img, path, quality=76):
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "WEBP", quality=quality, method=6)
    print(f"  {path.name}: {path.stat().st_size // 1024} KB ({img.size[0]}x{img.size[1]})")


def resize_w(img, w):
    if img.size[0] <= w:
        return img.copy()
    h = int(img.size[1] * (w / img.size[0]))
    return img.resize((w, h), Image.Resampling.LANCZOS)


def thumb_square(img, size):
    img = img.copy()
    img.thumbnail((size, size), Image.Resampling.LANCZOS)
    return img


def main():
    banner = Image.open(ROOT / "banner.webp").convert("RGB")
    for w in (640, 960, 1920):
        q = 68 if w == 640 else (72 if w == 960 else 78)
        save_webp(resize_w(banner, w), ROOT / f"banner-{w}.webp", quality=q)

    night = Image.open(ROOT / "night.webp").convert("RGB")
    for w in (640, 960):
        save_webp(resize_w(night, w), ROOT / f"night-{w}.webp", quality=68 if w == 640 else 72)

    logo = Image.open(ROOT / "logo.png").convert("RGBA")
    save_webp(resize_w(logo, 160), ROOT / "logo-160.webp", quality=82)
    save_webp(resize_w(logo, 320), ROOT / "logo-320.webp", quality=82)

    rapid_src = ROOT / "images" / "rapid-300.webp"
    if not rapid_src.exists():
        rapid_src = ROOT / "images" / "rapid.avif"
    if rapid_src.exists():
        rapid = Image.open(rapid_src).convert("RGB")
        save_webp(thumb_square(rapid, 150), ROOT / "images" / "rapid-150.webp", quality=80)
        save_webp(thumb_square(rapid, 300), ROOT / "images" / "rapid-300.webp", quality=82)

    print("done")


if __name__ == "__main__":
    main()
