from fastapi import FastAPI, Header, HTTPException
from firebase import verify_token
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/")
async def root():
    return {"its working": "2D to 3D Model Generator - API is live!"}

@app.post("/upload")
async def upload_image(authorization: str = Header(...)):
    user_info = verify_token(authorization)
    if user_info is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Later we'll add file upload and AI model processing here
    return JSONResponse(content={"its woking": f"Upload success for user {user_info['uid']}"})
