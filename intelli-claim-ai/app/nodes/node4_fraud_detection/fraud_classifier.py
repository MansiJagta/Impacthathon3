import pandas as pd
import numpy as np
import joblib
from lightgbm import LGBMClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score

# =========================
# 1. LOAD DATA
# =========================
df = pd.read_csv("insurance_fraud.csv")

# =========================
# 2. BASIC CLEANING
# =========================

# Replace '?' with NaN
df.replace("?", np.nan, inplace=True)

# Convert fraud label
df["fraud_reported"] = df["fraud_reported"].map({"Y": 1, "N": 0})

# Convert YES/NO columns
binary_cols = ["property_damage", "police_report_available"]
for col in binary_cols:
    df[col] = df[col].map({"YES": 1, "NO": 0})

# Fill missing binary as 0 (safe choice)
df[binary_cols] = df[binary_cols].fillna(0)

# =========================
# 3. FEATURE ENGINEERING
# =========================

# Convert dates
df["policy_bind_date"] = pd.to_datetime(df["policy_bind_date"])
df["incident_date"] = pd.to_datetime(df["incident_date"])

# Days since policy start
df["days_since_policy"] = (
    df["incident_date"] - df["policy_bind_date"]
).dt.days

# Drop raw date columns
df.drop(columns=["policy_bind_date", "incident_date"], inplace=True)

# # Claim ratios
# df["injury_claim_ratio"] = df["injury_claim"] / df["total_claim_amount"]
# df["property_claim_ratio"] = df["property_claim"] / df["total_claim_amount"]
# df["vehicle_claim_ratio"] = df["vehicle_claim"] / df["total_claim_amount"]

# df[[
#     "injury_claim_ratio",
#     "property_claim_ratio",
#     "vehicle_claim_ratio"
# ]] = df[[
#     "injury_claim_ratio",
#     "property_claim_ratio",
#     "vehicle_claim_ratio"
# ]].fillna(0)

# =========================
# 4. DROP HIGH-CARDINALITY / NON-GENERAL COLUMNS
# =========================

drop_cols = [
    "incident_location",   # too specific
    "insured_zip"          # high cardinality
]

df.drop(columns=drop_cols, errors="ignore", inplace=True)

# =========================
# 5. HANDLE CATEGORICALS
# =========================

df = pd.get_dummies(df, drop_first=True)

# =========================
# 6. TRAIN TEST SPLIT
# =========================

X = df.drop("fraud_reported", axis=1)
y = df["fraud_reported"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# =========================
# 7. HANDLE IMBALANCE
# =========================

fraud_ratio = y_train.value_counts()[0] / y_train.value_counts()[1]

# =========================
# 8. TRAIN LIGHTGBM
# =========================

model = LGBMClassifier(
    n_estimators=500,
    learning_rate=0.05,
    max_depth=-1,
    num_leaves=31,
    scale_pos_weight=fraud_ratio,
    random_state=42
)

model.fit(X_train, y_train)

# =========================
# 9. EVALUATION
# =========================

y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

print("ROC-AUC Score:", roc_auc_score(y_test, y_proba))

# =========================
# 10. SAVE MODEL + FEATURES
# =========================

joblib.dump(model, "fraud_lightgbm.pkl")
joblib.dump(X.columns.tolist(), "fraud_features.pkl")

print("\nModel and feature list saved successfully.")