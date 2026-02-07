# 🌌 Sol-Ark: Geomagnetic Storm Forecasting & Impact Visualization

## 📌 Project Background

### Problem Statement  
Geomagnetic storms, caused by solar activity, can significantly disrupt **satellite operations, GPS navigation, radio communication, and power infrastructure**. These disturbances originate from interactions between the solar wind and Earth’s magnetosphere and are commonly measured using the **Kp index**.

Existing solutions often provide delayed insights or lack interpretability and visualization for broader audiences. There is a need for a **real-time, lightweight, and interpretable system** that can:
- Monitor live solar-wind conditions  
- Forecast geomagnetic activity  
- Explain operational impacts  
- Visually demonstrate how solar storms occur  

**Sol-Ark** addresses this challenge by combining **real-time NOAA data**, **machine learning forecasting**, and **interactive visualization**.

🚀 **Live Demo:**  [LIVE HOSTING](https://kaust22.github.io/Sol-Ark/)

📡 **Live Forecast Backend:**  [LIVE BACKEND](https://sol-ark.onrender.com/forecast-kp)


---

### 🔄 Basic Workflow


---

## 📊 Data Structure and Initial Checks

### Data Source  
The dataset used for training is derived from historical space-weather observations provided by **NOAA Space Weather Prediction Center (SWPC)**.

📎 **Dataset link:** [LINK](https://github.com/Arvi55/Sol-Ark/tree/main/DATA)


---

### Data Description  
The dataset consists of time-series measurements representing near-Earth solar wind and magnetic field conditions. Key attributes include:

- Solar wind speed (V)
- Proton density (Np)
- Interplanetary Magnetic Field components (Bz, Bt)
- Derived physical parameters (e.g., electric field)
- Corresponding geomagnetic activity index (Kp)

### Initial Checks Performed
- Handling missing and invalid values  
- Type conversion and normalization  
- Temporal alignment of plasma and magnetic datasets  
- Verification of physical consistency (e.g., Bz behavior)

These steps ensure the dataset is **clean, consistent, and physically meaningful** for training machine-learning models.

---

## 🧠 Solution Overview

Sol-Ark provides a **four-layer solution** to geomagnetic storm forecasting:

---

### 1️⃣ Observatory: Live Space-Weather Monitoring  
The system fetches **live solar-wind and magnetic-field data** from NOAA APIs, including:
- IMF Bz
- Solar wind speed
- Proton density
- Magnetic field strength  

These parameters represent the **current space environment** and act as direct inputs to the ML models.

---

### 2️⃣ ML-Based Kp Forecasting  
The processed live data is passed into trained machine-learning models to generate:
- **Live Kp index**
- **Short-term Kp forecast (next few hours)**  

The models learn nonlinear relationships between solar-wind conditions and geomagnetic response.

---

### 3️⃣ Impact on Communication & Satellites  
The predicted Kp index is translated into **impact levels**, highlighting potential effects on:
- Satellite drag and orbital decay
- GPS and navigation accuracy
- Radio and communication systems  

This converts scientific outputs into **actionable insights**.

---

### 4️⃣ 3D Solar Storm Visualization  
The platform includes a **3D simulation** that visually demonstrates:
- Solar wind propagation from the Sun  
- Interaction with Earth’s magnetosphere  
- Formation of geomagnetic storms  

This improves understanding for both technical and non-technical users.

---

## 📈 Results and Model Performance

### Models Used
- **Random Forest Regressor**
- **XGBoost Regressor**

### Performance Metrics

| Model         | MAE    | RMSE   | R² Score |
|--------------|--------|--------|----------|
| Random Forest | 0.5208 | 0.6865 | 0.7385   |
| XGBoost       | 0.5112 | 0.6724 | 0.7491   |

---

### Model Selection Rationale

**Why Random Forest & XGBoost?**
- Excellent performance on structured, tabular data
- Capture nonlinear relationships effectively
- Robust to noise and outliers
- Lightweight and fast for real-time deployment
- High interpretability compared to deep learning models

**Why not Deep Learning or LLMs?**
- The problem is numerical and physics-driven, not language-based
- Deep models require larger datasets and heavier computation
- Classical models achieve strong accuracy with lower complexity
- Lightweight models are better suited for real-time systems

---

## 🔮 Future Scope

1️⃣ **Extended Forecast Horizons**  
Train models to directly predict **Kp +3h, +6h, and +12h ahead** for improved forecasting accuracy.

2️⃣ **Solar Event Integration**  
Incorporate solar flare and CME alerts to enable **early geomagnetic storm warnings**.

3️⃣ **Expanded Space-Weather Indices**  
Extend the system to predict additional indices such as **Dst and AE**, along with region-specific impact assessments.

---

## ✅ Conclusion

Sol-Ark demonstrates that **real-time geomagnetic storm forecasting** can be achieved using:
- Public NOAA space-weather data  
- Physics-aligned feature engineering  
- Lightweight, interpretable machine-learning models  

The project lays a strong foundation for a future **space-weather intelligence and decision-support platform**.
