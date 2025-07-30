from fastapi import FastAPI

app = FastAPI()

@app.get("/run-model")
async def root():
    return {"message": "Here is where the model weights will be retrieved to be used in the recommendation system"}
