import requests
import pandas as pd
import numpy as np
import joblib
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# -----------------------------
# App setup
# -----------------------------
app = FastAPI(title="Sol-Ark Geomagnetic Storm API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow frontend access
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Load trained model
# -----------------------------
model = joblib.load("kp_model.pkl")

# -----------------------------
# NOAA API endpoints
# -----------------------------
PLASMA_URL = "https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json"
MAG_URL = "https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json"

# -----------------------------
# Fetch NOAA data
# -----------------------------
def fetch_noaa_data():
    plasma = requests.get(PLASMA_URL, timeout=10).json()
    mag = requests.get(MAG_URL, timeout=10).json()

    plasma_df = pd.DataFrame(plasma[1:], columns=plasma[0])
    mag_df = pd.DataFrame(mag[1:], columns=mag[0])

    df = plasma_df.merge(mag_df, on="time_tag")

    df = df.astype({
        "speed": float,
        "density": float,
        "bz_gsm": float,
        "bt": float
    }).dropna()

    return df.tail(10)  # enough rows for lags & rolling stats

# -----------------------------
# Feature engineering
# -----------------------------
def build_features(df):
    df["V"] = df["speed"]
    df["Np"] = df["density"]
    df["Bz"] = df["bz_gsm"]
    df["Bt"] = df["bt"]

    # Solar wind electric field
    df["Ey"] = df["V"] * np.abs(df["Bz"])

    # Lag features
    for lag in [1, 2, 3]:
        df[f"Bz_lag_{lag}"] = df["Bz"].shift(lag)
        df[f"V_lag_{lag}"] = df["V"].shift(lag)
        df[f"Np_lag_{lag}"] = df["Np"].shift(lag)

    # Rolling statistics
    df["Bz_mean_2"] = df["Bz"].rolling(2).mean()
    df["Bz_std_2"] = df["Bz"].rolling(2).std()
    df["V_mean_2"] = df["V"].rolling(2).mean()
    df["Np_mean_2"] = df["Np"].rolling(2).mean()

    df["Bz_mean_3"] = df["Bz"].rolling(3).mean()
    df["Bz_std_3"] = df["Bz"].rolling(3).std()
    df["V_mean_3"] = df["V"].rolling(3).mean()
    df["Np_mean_3"] = df["Np"].rolling(3).mean()

    return df.dropna().iloc[-1]

# -----------------------------
# Feature order (MUST match training)
# -----------------------------
FEATURE_COLUMNS = [
    "V", "Np", "Bz", "Bt",
    "Bz_lag_1", "V_lag_1", "Np_lag_1",
    "Bz_lag_2", "V_lag_2", "Np_lag_2",
    "Bz_lag_3", "V_lag_3", "Np_lag_3",
    "Bz_mean_2", "Bz_std_2",
    "V_mean_2", "Np_mean_2",
    "Bz_mean_3", "Bz_std_3",
    "V_mean_3", "Np_mean_3",
    "Ey"
]

# -----------------------------
# Health check
# -----------------------------
@app.get("/")
def health():
    return {"status": "Sol-Ark backend running"}

# -----------------------------
# Forecast endpoint
# -----------------------------
@app.get("/forecast-kp")
def forecast_kp():
    df = fetch_noaa_data()
    features = build_features(df)

    X = features[FEATURE_COLUMNS].to_frame().T
    kp_now = float(model.predict(X)[0])

    # Simple short-term extrapolation (hackathon-safe)
    hourly_forecast = [round(kp_now * (1 + i * 0.03), 2) for i in range(7)]
    avg_6h = round(sum(hourly_forecast[1:]) / 6, 2)

    return {
        "observatory": {
            "bz": round(features["Bz"], 2),
            "speed": round(features["V"], 1),
            "density": round(features["Np"], 2),
            "bt": round(features["Bt"], 2),
            "ey": round(features["Ey"], 2),
            "time_utc": datetime.utcnow().isoformat()
        },
        "forecast": {
            "live_kp": round(kp_now, 2),
            "hourly_kp": hourly_forecast,
            "avg_6h": avg_6h
        },
        "storm_level": (
            "Severe" if avg_6h >= 7 else
            "Moderate" if avg_6h >= 5 else
            "Quiet"
        )
    }
