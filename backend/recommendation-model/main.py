from fastapi import FastAPI
import tensorflow as tf
from constants import MODEL_FILE_PATH

app = FastAPI()

# Workflow: generate/store tokenized data points, convert to tensors, shuffle & batch them, then for each batch:
# find embeddings for each course/user, find similarity, compute overall loss, train via backpropagation using Adam optimizer, export two-tower model to use

@app.get("/run-model")
async def root():
    model = tf.keras.models.load_model("my_model.keras")
    return {"message": "Here is where the model weights will be retrieved to be used in the recommendation system"}
