from pathlib import Path


def test_nextjs_uses_proxy_file_convention():
    project_root = Path(__file__).resolve().parents[2]
    middleware = project_root / "web" / "middleware.ts"
    proxy = project_root / "web" / "proxy.ts"

    assert not middleware.exists(), "Next.js 16 deprecates middleware.ts; use proxy.ts instead."
    assert proxy.exists(), "Expected web/proxy.ts to exist."

    content = proxy.read_text(encoding="utf-8")
    assert "export function proxy" in content

