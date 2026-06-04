"""Refresh inline critical CSS in index.html from critical.css."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
critical = (ROOT / "critical.css").read_text(encoding="utf-8-sig")
html = (ROOT / "index.html").read_text(encoding="utf-8")
html = re.sub(
    r'<style id="critical-css">.*?</style>',
    f'<style id="critical-css">\n{critical}\n    </style>',
    html,
    count=1,
    flags=re.DOTALL,
)
(ROOT / "index.html").write_text(html, encoding="utf-8")
print("updated inline critical CSS")
