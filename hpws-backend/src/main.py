from fastapi import FastAPI

app = FastAPI(title="HPWS Backend API")

@app.get("/")
def read_root():
    return {"message": "Welcome to HPWS Backend Service"}

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "hpws-backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
