from __future__ import annotations

import os
import signal
import socket
import subprocess
import sys
import time
from urllib.error import URLError
from urllib.request import urlopen
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"


def start_process(cmd: list[str], cwd: Path) -> subprocess.Popen[str]:
    env = os.environ.copy()
    return subprocess.Popen(
        cmd,
        cwd=str(cwd),
        env=env,
        stdin=sys.stdin,
        stdout=sys.stdout,
        stderr=sys.stderr,
        text=True,
    )


def health_check(port: int) -> bool:
    try:
        with urlopen(f"http://127.0.0.1:{port}/api/health", timeout=1) as response:
            return response.status == 200
    except (OSError, URLError):
        return False


def port_is_available(port: int) -> bool:
    with socket.socket() as listener:
        try:
            listener.bind(("127.0.0.1", port))
        except OSError:
            return False
        return True


def find_free_port() -> int:
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        return listener.getsockname()[1]


def main() -> int:
    frontend_cmd = ["node", "node_modules/vite/bin/vite.js"]
    processes: list[subprocess.Popen[str]] = []
    stop_requested = False
    backend: subprocess.Popen[str] | None = None

    def shutdown(*_args) -> None:
        nonlocal stop_requested
        stop_requested = True

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        backend_port = 8000
        if health_check(backend_port):
            print("Using the existing CrimeVista backend on port 8000.")
        else:
            if not port_is_available(backend_port):
                backend_port = find_free_port()
                print(f"Port 8000 is occupied; starting the backend on port {backend_port}.")

            backend_cmd = [
                sys.executable,
                "-m",
                "uvicorn",
                "app.main:app",
                "--host",
                "127.0.0.1",
                "--port",
                str(backend_port),
            ]
            backend = start_process(backend_cmd, BACKEND_DIR)
            processes.append(backend)

            for _ in range(40):
                if backend.poll() is not None:
                    print("Backend exited before it became ready.", file=sys.stderr)
                    return backend.returncode or 1
                if health_check(backend_port):
                    break
                time.sleep(0.25)
            else:
                print("Backend did not become ready in time.", file=sys.stderr)
                return 1

        frontend_env = os.environ.copy()
        frontend_env["VITE_API_PROXY_TARGET"] = f"http://127.0.0.1:{backend_port}"
        frontend = subprocess.Popen(
            frontend_cmd,
            cwd=str(FRONTEND_DIR),
            env=frontend_env,
            stdin=sys.stdin,
            stdout=sys.stdout,
            stderr=sys.stderr,
            text=True,
        )
        processes.append(frontend)
        print(f"Frontend API proxy targets backend port {backend_port}.")

        while True:
            if stop_requested:
                print("\nStopping dev servers...", file=sys.stderr)
                return 0
            if backend is not None and backend.poll() is not None:
                print("\nBackend exited early. Stopping frontend...", file=sys.stderr)
                if frontend.poll() is None:
                    frontend.terminate()
                return backend.returncode
            if frontend.poll() is not None:
                print("\nFrontend exited. Stopping backend...", file=sys.stderr)
                if backend is not None and backend.poll() is None:
                    backend.terminate()
                return frontend.returncode
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\nStopping dev servers...", file=sys.stderr)
        return 0
    except OSError as error:
        print(f"Could not start a dev server: {error}", file=sys.stderr)
        return 1
    finally:
        for proc in processes:
            try:
                if proc.poll() is None:
                    proc.terminate()
                    proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait(timeout=5)


if __name__ == "__main__":
    raise SystemExit(main())
