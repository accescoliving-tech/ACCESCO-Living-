from fastapi import FastAPI
from fastapi.responses import PlainTextResponse
from app.routers.webhook import router as webhook_router

app = FastAPI()

@app.get("/")
@app.post("/")
def root():
    return PlainTextResponse("Webhook server online", status_code=200)

app.include_router(webhook_router)
