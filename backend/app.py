import os
import tempfile
import time
from collections import deque
from datetime import datetime, timedelta
from io import BytesIO
from threading import Lock
from uuid import uuid4
from zipfile import BadZipFile, ZipFile

from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Dict, TypedDict

class SessionData(TypedDict):
    zip_bytes: bytes
    files_map: dict[str, str]
    expires_at: datetime

ALLOWED_ORIGINS = [origin for origin in os.getenv("ALLOWED_ORIGINS", "").split(",") if origin]
MAX_ZIP_SIZE_BYTES = int(os.getenv("MAX_ZIP_SIZE_BYTES", str(10 * 1024 * 1024)))
SESSION_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", str(15 * 60)))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", str(60)))
LIST_FILES_RATE_LIMIT = int(os.getenv("LIST_FILES_RATE_LIMIT", str(5)))
GENERATE_MD_RATE_LIMIT = int(os.getenv("GENERATE_MD_RATE_LIMIT", str(3)))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    files: list[str]
    session_id: str

uploaded_zips: Dict[str, SessionData] = {}

class SlidingWindowRateLimiter:
    """
    Thread-safe sliding window limiter using in-memory storage.
    Automatically prunes old entries and removes idle keys.
    """

    def __init__(self, cleanup_interval_seconds: float = 60.0):
        self._requests: Dict[str, deque[float]] = {}
        self._lock = Lock()
        self._last_cleanup = 0.0
        self._cleanup_interval_seconds = cleanup_interval_seconds

    def _cleanup(self, now: float, window_seconds: int):
        if now - self._last_cleanup < self._cleanup_interval_seconds:
            return
        cutoff = now - window_seconds
        stale_keys = [key for key, timestamps in self._requests.items() if timestamps and timestamps[-1] <= cutoff]
        for key in stale_keys:
            self._requests.pop(key, None)
        self._last_cleanup = now

    def allow(self, key: str, max_requests: int, window_seconds: int, now: float | None = None) -> bool:
        current_time = now or time.time()
        window_start = current_time - window_seconds
        with self._lock:
            self._cleanup(current_time, window_seconds)
            timestamps = self._requests.setdefault(key, deque())
            while timestamps and timestamps[0] <= window_start:
                timestamps.popleft()
            if len(timestamps) >= max_requests:
                if not timestamps:
                    self._requests.pop(key, None)
                return False
            timestamps.append(current_time)
            return True

rate_limiter = SlidingWindowRateLimiter()

def _client_identifier(request: Request) -> str:
    mac = request.headers.get("X-Client-MAC")
    if mac:
        return f"{request.client.host if request.client else 'unknown'}-{mac}"
    return request.client.host if request.client else "unknown"


def rate_limit_dependency(max_requests: int, window_seconds: int):
    async def _dependency(request: Request):
        key = _client_identifier(request)
        allowed = rate_limiter.allow(key, max_requests, window_seconds)
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Allowed {max_requests} requests per {window_seconds} seconds."
            )
    return _dependency


def cleanup_expired_sessions(now: datetime | None = None):
    current_time = now or datetime.utcnow()
    expired = [sid for sid, data in uploaded_zips.items() if data["expires_at"] <= current_time]
    for sid in expired:
        uploaded_zips.pop(sid, None)

def list_files_from_zip(zip_bytes: bytes):
    """
    Return a list of all files in the ZIP.
    Preserves folder structure but strips a common root folder.
    Returns both display path (for frontend) and real path (inside zip).
    """
    with ZipFile(BytesIO(zip_bytes)) as zf:
        names = [name for name in zf.namelist() if not name.endswith("/")]

        # Detect common root
        common_root = None
        if all("/" in name for name in names):
            first_parts = [name.split("/", 1)[0] for name in names]
            if len(set(first_parts)) == 1:
                common_root = first_parts[0]

        files = []
        for name in names:
            if common_root and name.startswith(common_root + "/"):
                display = name[len(common_root) + 1:]  # strip root/
            else:
                display = name
            files.append({"path": display, "zip_path": name})

    return files

@app.post("/list-files", dependencies=[Depends(rate_limit_dependency(LIST_FILES_RATE_LIMIT, RATE_LIMIT_WINDOW_SECONDS))])
async def list_files_endpoint(zipfile: UploadFile = File(...)):
    cleanup_expired_sessions()

    zip_bytes = await zipfile.read()
    if not zip_bytes:
        raise HTTPException(status_code=400, detail="Uploaded ZIP is empty")
    if len(zip_bytes) > MAX_ZIP_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"ZIP too large. Max allowed is {MAX_ZIP_SIZE_BYTES} bytes."
        )

    try:
        files = list_files_from_zip(zip_bytes)
    except BadZipFile:
        raise HTTPException(status_code=400, detail="Invalid ZIP file")

    session_id = uuid4().hex
    uploaded_zips[session_id] = {
        "zip_bytes": zip_bytes,
        "files_map": {f["path"]: f["zip_path"] for f in files},
        "expires_at": datetime.utcnow() + timedelta(seconds=SESSION_TTL_SECONDS),
    }

    return JSONResponse({
        "files": [{"path": f["path"]} for f in files],
        "session_id": session_id,
        "expires_at": uploaded_zips[session_id]["expires_at"].isoformat() + "Z",
    })

@app.post("/generate-md", dependencies=[Depends(rate_limit_dependency(GENERATE_MD_RATE_LIMIT, RATE_LIMIT_WINDOW_SECONDS))])
async def generate_md(request: GenerateRequest, background_tasks: BackgroundTasks):
    """
    Generate Markdown from selected files inside uploaded ZIP.
    """
    cleanup_expired_sessions()

    if not request.files:
        raise HTTPException(status_code=400, detail="No files selected")

    session = uploaded_zips.get(request.session_id)
    if not session:
        raise HTTPException(status_code=400, detail="Session not found or expired")

    missing_files = [name for name in request.files if name not in session["files_map"]]
    if missing_files:
        raise HTTPException(status_code=400, detail=f"Unknown files requested: {', '.join(missing_files)}")

    zip_bytes = session["zip_bytes"]
    files_map = session["files_map"]

    with ZipFile(BytesIO(zip_bytes)) as zf:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".md") as tmp_md:
            for display_path in request.files:
                real_path = files_map[display_path]

                tmp_md.write(f"\n\n# {display_path}\n\n".encode("utf-8"))

                file_content = zf.read(real_path)
                try:
                    text_content = file_content.decode("utf-8")
                    tmp_md.write(f"```\n{text_content}\n```\n".encode("utf-8"))
                except UnicodeDecodeError:
                    tmp_md.write(f"[Binary file - {len(file_content)} bytes]\n".encode("utf-8"))

            tmp_md_path = tmp_md.name

    background_tasks.add_task(os.remove, tmp_md_path)

    return FileResponse(
        tmp_md_path,
        media_type="text/markdown",
        filename="output.md",
    )
