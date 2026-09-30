import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os
from typing import Tuple, List, Dict, Any

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
def get_or_train_model() -> Tuple[IsolationForest, StandardScaler]:
    model_path=os.path.join(BASE_DIR,"isolation_forest.pkl"); scaler_path=os.path.join(BASE_DIR,"scaler.pkl")
    if os.path.exists(model_path) and os.path.exists(scaler_path): return joblib.load(model_path), joblib.load(scaler_path)
    rng=np.random.default_rng(42); normal=rng.lognormal(1.0,1.0,(5000,18)); scaler=StandardScaler().fit(normal); model=IsolationForest(n_estimators=200,contamination=.1,random_state=42).fit(scaler.transform(normal)); joblib.dump(model,model_path); joblib.dump(scaler,scaler_path); return model,scaler
def compute_anomaly_score(vector: np.ndarray, model: IsolationForest, scaler: StandardScaler) -> float: return float(model.decision_function(scaler.transform(vector))[0])
def anomaly_to_risk_score(score: float, features: Dict[str,float]) -> Tuple[float,List[str]]:
    risk=float(np.clip((.15-score)*140,0,70)); factors=[]
    checks=[(features["transaction_frequency"]>100,15,"Extremely high transaction frequency"),(features["transaction_count"]>50 and features["unique_wallet_interactions"]<3,20,"Concentrated wallet interactions"),(features["self_transfer_count"]>=20,10,"Suspicious self-transfer activity"),(features["avg_transfer_value"]>50,12,"Abnormally large average transfer value"),(features["time_between_tx_avg"]>0 and features["time_between_tx_avg"]<10,12,"Automated transaction pattern")]
    for triggered,boost,label in checks:
        if triggered: risk+=boost; factors.append(label)
    return round(min(100,risk),2), factors or ["No significant behavioral anomalies detected"]
def get_risk_level(score: float) -> str: return "LOW" if score<25 else "MEDIUM" if score<50 else "HIGH" if score<75 else "CRITICAL"
def compute_confidence(count: int) -> float: return 0 if count==0 else .3 if count<10 else .6 if count<50 else .8 if count<200 else .95

