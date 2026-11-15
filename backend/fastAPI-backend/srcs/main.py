from fastapi import FastAPI
from routers import friends_router

app = FastAPI(title="ft_transcendence FastAPI Backend")

app.include_router(friends_router.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
