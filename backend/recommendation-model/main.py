from fastapi import FastAPI

app = FastAPI()

# Workflow: generate/store tokenized data points, convert to tensors, shuffle & batch them, then for each batch:
# find embeddings for each course/user, find similarity, compute loss, train via backpropagation, export towers to use

@app.get("/run-model")
async def root():
    return {"message": "Here is where the model weights will be retrieved to be used in the recommendation system"}
