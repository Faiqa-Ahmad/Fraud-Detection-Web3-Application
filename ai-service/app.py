import gradio as gr
import json
import time
import spaces
from features import extract_features, build_feature_vector
from model import get_or_train_model, compute_anomaly_score, anomaly_to_risk_score, get_risk_level, compute_confidence

model, scaler = get_or_train_model()

@spaces.GPU
def trick_huggingface_parser():
    return "This exists only to prevent ZeroGPU from crashing."

def gradio_analyze(wallet: str, transactions_json: str):
    try:
        txs = json.loads(transactions_json)
        features = extract_features(txs, wallet)
        vector = build_feature_vector(features)
        anomaly = compute_anomaly_score(vector, model, scaler)
        score, factors = anomaly_to_risk_score(anomaly, features)
        
        result = {
            "wallet_address": wallet,
            "fraud_score": {
                "risk_score": score,
                "anomaly_score": round(anomaly, 6),
                "risk_level": get_risk_level(score),
                "risk_factors": factors,
                "confidence": compute_confidence(len(txs))
            },
            "features": features,
            "analyzed_at": time.time()
        }
        return json.dumps(result)
    except Exception as e:
        return json.dumps({"error": str(e)})

demo = gr.Interface(
    fn=gradio_analyze,
    inputs=[gr.Textbox(label="Wallet"), gr.Textbox(label="Transactions JSON")],
    outputs=gr.Textbox(label="Result JSON"),
    title="Sentinel3 AI API"
)

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860, ssr_mode=False)
