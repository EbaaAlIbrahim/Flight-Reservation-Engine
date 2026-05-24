from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel 
from typing import Optional 
import os
import joblib
import psycopg2
import requests

MODEL_PATH = os.path.join("data", "time_predictor.pkl")
AI_MODEL = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global AI_MODEL
    if os.path.exists(MODEL_PATH):
        AI_MODEL = joblib.load(MODEL_PATH)
        print("Inference model loaded into memory successfully.")
    else:
        print("Warning: Model binary missing. Run python app/train.py first.")
    yield
    print("Shutting down AI engine application assets.")

app = FastAPI(title="Flight Time Prediction Matrix", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PARAMS = {
    "dbname": "postgres",
    "user": "postgres",
    "password": "12345",
    "host": "localhost",
    "port": "5432"
}

from typing import Optional # Add this import near the top of main.py

class PredictionRequest(BaseModel):
    flight_number: Optional[str] = None
    flightNumber: Optional[str] = None # Accepts camelCase parameter variants safely

@app.post("/predict-delay")
def calculate_prediction(payload: PredictionRequest):
    if AI_MODEL is None:
        raise HTTPException(status_code=503, detail="AI engine is currently offline.")
        
    target_flight = payload.flight_number or payload.flightNumber
    if not target_flight:
        raise HTTPException(status_code=400, detail="Missing parameter: flight_number")
        
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        cursor = conn.cursor()
        
        # Pull the TRUE changing parameters saved by your live data stream
        query = """
            SELECT dep_delay, carrier_id, weather_risk, congestion_index, weather_risk_score 
            FROM flights 
            WHERE flight_number = %s;
        """
        cursor.execute(query, [target_flight])
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail=f"Flight {target_flight} not found. Run your Dubai stream script first.")

        # Unpack the distinct features
        db_dep_delay, db_carrier, db_weather, db_nas, db_late = row

        # Feed the dynamically mined dataset values into your unpickled estimator array
        input_features = [[
            float(db_dep_delay), 
            float(db_carrier), 
            float(db_weather), 
            float(db_nas), 
            float(db_late)
        ]]
        
        # Run unique model inference
        prediction_result = AI_MODEL.predict(input_features)
        predicted_minutes = float(prediction_result[0]) # Read index coordinate element
        predicted_minutes = max(0.0, predicted_minutes)
        
        calculated_probability = min(0.99, float(predicted_minutes / 120.0))
        
        # Fire Webhook back to Node.js backend
        node_webhook_url = "http://localhost:3000/api/admin/ai/sync-prediction"
        sync_payload = {
            "flightNumber": target_flight,
            "delayMinutes": int(predicted_minutes),
            "probabilityRisk": round(calculated_probability, 2)
        }
        requests.post(node_webhook_url, json=sync_payload)
        
        return {
            "status": "SUCCESS",
            "flight_number": target_flight,
            "predicted_delay_duration_minutes": int(predicted_minutes),
            "calculated_cancellation_probability": f"{int(calculated_probability * 100)}%"
        }
    except Exception as e:
        print(f" Python Inference Crash Diagnostic: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Inference failure modeling: {str(e)}")
