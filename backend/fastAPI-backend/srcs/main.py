from fastapi import FastAPI

app = FastAPI();

@app.get("/")
async def home():
	return {"home": "sweet HOME"};

@app.get("/friends")
async def peers():
	return {"friends": "you got none :("};

@app.get("/somewhere")
async def somewhere():
	return {"somewhere": "a place in the world"};