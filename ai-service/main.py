from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
import time
import logging

from features import extract_features, build_feature_vector
from model import get_or_train_model, compute_anomaly_score, anomaly_to_risk_score, get_risk_level, compute_confidence

logging.basicConfig(level=logging.INFO)
app = FastAPI(title="Sentinel3 AI", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["GET","POST"], allow_headers=["*"])
model, scaler = get_or_train_model()

class Transaction(BaseModel):
    tx_hash: str = ""; from_address: str = ""; to_address: str = ""; value_eth: float = 0; gas: float = 0; timestamp: int = 0; is_contract_interaction: bool = False; token_symbol: Optional[str] = None; token_value: Optional[str] = None
class AnalysisRequest(BaseModel):
    wallet_address: str = Field(pattern=r"^0x[a-fA-F0-9]{40}$")
    transactions: List[Transaction] = Field(max_length=1000)

@app.get("/health")
def health(): return {"status":"ok","model":"IsolationForest","version":"1.0.0"}
@app.post("/analyze")
def analyze(payload: AnalysisRequest):
    rows=[item.model_dump() for item in payload.transactions]; features=extract_features(rows,payload.wallet_address); vector=build_feature_vector(features)
    try: anomaly=compute_anomaly_score(vector,model,scaler)
    except ValueError as exc: raise HTTPException(status_code=500,detail="Model artifact is incompatible with the feature schema") from exc
    score,factors=anomaly_to_risk_score(anomaly,features)
    return {"wallet_address":payload.wallet_address,"fraud_score":{"risk_score":score,"anomaly_score":round(anomaly,6),"risk_level":get_risk_level(score),"risk_factors":factors,"confidence":compute_confidence(len(rows))},"features":features,"analyzed_at":time.time()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app",host="0.0.0.0",port=8000,reload=False)
