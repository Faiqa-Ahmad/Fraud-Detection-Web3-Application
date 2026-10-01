import uvicorn
import gradio as gr
from main import app as fastapi_app

# Create a simple placeholder UI to satisfy Hugging Face's Gradio requirement
demo = gr.Interface(
    fn=lambda: "Web3 Fraud Detection API is running!", 
    inputs=None, 
    outputs="text",
    title="Sentinel3 AI API"
)

# Mount the Gradio UI at the root, but our FastAPI routes like /analyze will still work!
app = gr.mount_gradio_app(fastapi_app, demo, path="/")


