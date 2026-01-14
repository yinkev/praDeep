import subprocess
from pathlib import Path
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[2]
PYTHON = PROJECT_ROOT / ".venv" / "bin" / "python"


def _run_command(path: Path, *args: str) -> subprocess.CompletedProcess[str]:
    cmd = [str(path), *args]
    return subprocess.run(cmd, check=False, capture_output=True, text=True)


def test_start_dry_run_uses_start_web():
    script = PROJECT_ROOT / "scripts" / "start"
    result = _run_command(script, "--dry-run")
    assert result.returncode == 0
    output = (result.stdout + result.stderr).strip()
    assert "scripts/start_web.py" in output


def test_stop_dry_run_lists_ports():
    script = PROJECT_ROOT / "scripts" / "stop"
    result = _run_command(script, "--dry-run")
    assert result.returncode == 0
    output = (result.stdout + result.stderr).strip()
    assert "8783" in output
    assert "3783" in output
