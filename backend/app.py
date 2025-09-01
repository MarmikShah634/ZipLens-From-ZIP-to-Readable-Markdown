from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from zipfile import ZipFile
from io import BytesIO
import tempfile
from pydantic import BaseModel

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    files: list[str]  # display paths from frontend

uploaded_zips = {}

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

@app.post("/list-files")
async def list_files_endpoint(zipfile: UploadFile = File(...)):
    try:
        zip_bytes = await zipfile.read()
        files = list_files_from_zip(zip_bytes)
        
        session_id = "current"
        uploaded_zips[session_id] = {
            "zip_bytes": zip_bytes,
            "files_map": {f["path"]: f["zip_path"] for f in files}
        }
        
        return JSONResponse({
            "files": [{"path": f["path"]} for f in files],
            "session_id": session_id
        })
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/generate-md")
async def generate_md(request: GenerateRequest):
    """
    Generate Markdown from selected files inside uploaded ZIP.
    """
    try:
        selected_files = request.files
        if not selected_files:
            return JSONResponse({"error": "No files selected"}, status_code=400)
        
        session_id = "current"
        if session_id not in uploaded_zips:
            return JSONResponse({"error": "No ZIP file uploaded"}, status_code=400)
        
        zip_bytes = uploaded_zips[session_id]["zip_bytes"]
        files_map = uploaded_zips[session_id]["files_map"]
        
        with ZipFile(BytesIO(zip_bytes)) as zf:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".md") as tmp_md:
                for display_path in selected_files:
                    if display_path not in files_map:
                        continue
                    real_path = files_map[display_path]

                    tmp_md.write(f"\n\n# {display_path}\n\n".encode("utf-8"))
                    
                    file_content = zf.read(real_path)
                    try:
                        text_content = file_content.decode('utf-8')
                        tmp_md.write(f"```\n{text_content}\n```\n".encode('utf-8'))
                    except UnicodeDecodeError:
                        tmp_md.write(f"[Binary file - {len(file_content)} bytes]\n".encode('utf-8'))
                
                tmp_md_path = tmp_md.name
        
        return FileResponse(
            tmp_md_path, 
            media_type="text/markdown", 
            filename="output.md",
            background=None
        )
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
