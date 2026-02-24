"""
MongoDB-based Fraud Classification Module

Fetches claim data from fraud_classification_db and uses LightGBM model
to generate fraud probability score.
"""

import os
from pathlib import Path
import joblib
import pandas as pd
import numpy as np
from app.database.mongo import fraud_classification_collection


def _get_model_path():
    """Get path to the LightGBM model file."""
    model_path = Path(__file__).resolve().parent.parent.parent.parent / "fraud_lightgbm.pkl"
    return model_path


def _get_features_path():
    """Get path to the features file."""
    features_path = Path(__file__).resolve().parent.parent.parent.parent / "fraud_features.pkl"
    return features_path


def _load_lightgbm_model():
    """Load the LightGBM model."""
    model_path = _get_model_path()
    if not model_path.exists():
        return None
    try:
        return joblib.load(str(model_path))
    except Exception as e:
        print(f"Error loading LightGBM model: {e}")
        return None


def _load_features_list():
    """Load the list of expected features."""
    features_path = _get_features_path()
    if not features_path.exists():
        return None
    try:
        return joblib.load(str(features_path))
    except Exception as e:
        print(f"Error loading features list: {e}")
        return None


def _fetch_fraud_data_by_policy(policy_number):
    """
    Fetch fraud classification data by policy number from MongoDB.
    
    Args:
        policy_number (str): The policy number to search for
        
    Returns:
        dict: The fraud classification record or None
    """
    try:
        result = fraud_classification_collection.find_one(
            {"policy_number": policy_number}
        )
        return result
    except Exception as e:
        print(f"Error fetching fraud data by policy: {e}")
        return None


def _fetch_fraud_data_by_claimer(claimer_name):
    """
    Fetch fraud classification data by claimer name from MongoDB.
    
    Args:
        claimer_name (str): The claimer name to search for
        
    Returns:
        dict: The fraud classification record or None
    """
    try:
        result = fraud_classification_collection.find_one(
            {"claimer_name": claimer_name}
        )
        return result
    except Exception as e:
        print(f"Error fetching fraud data by claimer: {e}")
        return None


def _preprocess_fraud_data(data, features_list):
    """
    Preprocess MongoDB fraud data to match LightGBM model features.
    
    Args:
        data (dict): Raw fraud classification data from MongoDB
        features_list (list): Expected feature names for the model
        
    Returns:
        pd.DataFrame: Preprocessed data with required features
    """
    if data is None or features_list is None:
        return None
    
    # Create DataFrame from the single record
    df = pd.DataFrame([data])
    
    # ========================================
    # 1. HANDLE MISSING FIELDS
    # ========================================
    # Initialize all features with 0
    processed_data = {feature: [0] for feature in features_list}
    
    # ========================================
    # 2. NUMERIC FIELDS (DIRECT COPY)
    # ========================================
    numeric_fields = [
        'months_as_customer', 'age', 'policy_deductable', 'policy_annual_premium',
        'umbrella_limit', 'incident_hour_of_the_day', 'bodily_injuries', 'witnesses',
        'total_claim_amount', 'days_since_policy'
    ]
    
    for field in numeric_fields:
        if field in features_list and field in df.columns:
            try:
                val = df[field].iloc[0]
                if pd.notna(val):
                    processed_data[field] = [float(val)]
            except (TypeError, ValueError):
                pass
    
    # ========================================
    # 3. BINARY FIELDS (0/1 ENCODING)
    # ========================================
    binary_mappings = {
        'property_damage': {'No': 0, 'Yes': 1, 'NO': 0, 'YES': 1},
        'police_report_available': {'No': 0, 'Yes': 1, 'NO': 0, 'YES': 1}
    }
    
    for field, mapping in binary_mappings.items():
        if field in features_list and field in df.columns:
            try:
                val = df[field].iloc[0]
                if isinstance(val, str):
                    processed_data[field] = [mapping.get(val, 0)]
                elif isinstance(val, (int, float)):
                    processed_data[field] = [int(val)]
            except (TypeError, ValueError):
                pass
    
    # ========================================
    # 4. CATEGORICAL FIELDS (ONE-HOT ENCODING)
    # ========================================
    
    # Policy State
    if 'policy_state' in df.columns:
        state = str(df['policy_state'].iloc[0]).strip().upper() if df['policy_state'].iloc[0] else ''
        for state_feature in ['policy_state_IN', 'policy_state_OH']:
            if state_feature in features_list:
                state_code = state_feature.replace('policy_state_', '')
                processed_data[state_feature] = [1 if state == state_code else 0]
    
    # Policy CSL
    if 'policy_csl' in df.columns:
        csl = str(df['policy_csl'].iloc[0]).strip() if df['policy_csl'].iloc[0] else ''
        # Remove commas and whitespace
        csl_clean = csl.replace(',', '').strip()
        for csl_feature in ['policy_csl_250/500', 'policy_csl_500/1000']:
            if csl_feature in features_list:
                csl_code = csl_feature.replace('policy_csl_', '')
                # Convert feature code format for comparison
                csl_code_clean = csl_code.replace('/', ',')
                processed_data[csl_feature] = [1 if csl_clean.endswith(csl_code_clean) else 0]
    
    # Insured Sex
    if 'insured_sex' in df.columns:
        sex = str(df['insured_sex'].iloc[0]).strip().upper() if df['insured_sex'].iloc[0] else ''
        if 'insured_sex_MALE' in features_list:
            processed_data['insured_sex_MALE'] = [1 if sex == 'MALE' or sex == 'M' else 0]
    
    # Insured Education Level
    if 'insured_education_level' in df.columns:
        edu = str(df['insured_education_level'].iloc[0]).strip() if df['insured_education_level'].iloc[0] else ''
        edu_features = [
            'insured_education_level_College', 'insured_education_level_High School',
            'insured_education_level_JD', 'insured_education_level_MD',
            'insured_education_level_Masters', 'insured_education_level_PhD'
        ]
        for edu_feature in edu_features:
            if edu_feature in features_list:
                edu_code = edu_feature.replace('insured_education_level_', '')
                processed_data[edu_feature] = [1 if edu == edu_code else 0]
    
    # Insured Occupation (multi-valued in database, handle as comma-separated)
    if 'insured_occupation' in df.columns:
        occ = str(df['insured_occupation'].iloc[0]).strip().lower() if df['insured_occupation'].iloc[0] else ''
        occ_features = [
            'insured_occupation_armed-forces', 'insured_occupation_craft-repair',
            'insured_occupation_exec-managerial', 'insured_occupation_farming-fishing',
            'insured_occupation_handlers-cleaners', 'insured_occupation_machine-op-inspct',
            'insured_occupation_other-service', 'insured_occupation_priv-house-serv',
            'insured_occupation_prof-specialty', 'insured_occupation_protective-serv',
            'insured_occupation_sales', 'insured_occupation_tech-support',
            'insured_occupation_transport-moving'
        ]
        for occ_feature in occ_features:
            if occ_feature in features_list:
                occ_code = occ_feature.replace('insured_occupation_', '')
                processed_data[occ_feature] = [1 if occ == occ_code else 0]
    
    # Insured Hobbies (comma-separated, check for matches)
    if 'insured_hobbies' in df.columns:
        hobbies_str = str(df['insured_hobbies'].iloc[0]).lower() if df['insured_hobbies'].iloc[0] else ''
        hobbies_list = [h.strip() for h in hobbies_str.split(',')]
        
        hobbies_features = [
            'insured_hobbies_basketball', 'insured_hobbies_board-games', 'insured_hobbies_bungie-jumping',
            'insured_hobbies_camping', 'insured_hobbies_chess', 'insured_hobbies_cross-fit',
            'insured_hobbies_dancing', 'insured_hobbies_exercise', 'insured_hobbies_golf',
            'insured_hobbies_hiking', 'insured_hobbies_kayaking', 'insured_hobbies_movies',
            'insured_hobbies_paintball', 'insured_hobbies_polo', 'insured_hobbies_reading',
            'insured_hobbies_skydiving', 'insured_hobbies_sleeping', 'insured_hobbies_video-games',
            'insured_hobbies_yachting'
        ]
        for hobby_feature in hobbies_features:
            if hobby_feature in features_list:
                hobby_code = hobby_feature.replace('insured_hobbies_', '')
                processed_data[hobby_feature] = [1 if hobby_code in hobbies_list else 0]
    
    # Insured Relationship
    if 'insured_relationship' in df.columns:
        rel = str(df['insured_relationship'].iloc[0]).strip().lower() if df['insured_relationship'].iloc[0] else ''
        # Convert to lowercase with hyphen
        rel = rel.replace(' ', '-')
        
        rel_features = [
            'insured_relationship_not-in-family', 'insured_relationship_other-relative',
            'insured_relationship_own-child', 'insured_relationship_unmarried',
            'insured_relationship_wife'
        ]
        for rel_feature in rel_features:
            if rel_feature in features_list:
                rel_code = rel_feature.replace('insured_relationship_', '')
                processed_data[rel_feature] = [1 if rel == rel_code else 0]
    
    # Incident Severity
    if 'incident_severity' in df.columns:
        severity = str(df['incident_severity'].iloc[0]).strip() if df['incident_severity'].iloc[0] else ''
        severity_features = [
            'incident_severity_Minor Damage', 'incident_severity_Total Loss',
            'incident_severity_Trivial Damage'
        ]
        for sev_feature in severity_features:
            if sev_feature in features_list:
                sev_code = sev_feature.replace('incident_severity_', '')
                processed_data[sev_feature] = [1 if severity == sev_code else 0]
    
    # Authorities Contacted
    if 'authorities_contacted' in df.columns:
        auth = str(df['authorities_contacted'].iloc[0]).strip() if df['authorities_contacted'].iloc[0] else ''
        auth_features = [
            'authorities_contacted_Fire', 'authorities_contacted_Other',
            'authorities_contacted_Police'
        ]
        for auth_feature in auth_features:
            if auth_feature in features_list:
                auth_code = auth_feature.replace('authorities_contacted_', '')
                processed_data[auth_feature] = [1 if auth == auth_code else 0]
    
    # Incident State
    if 'incident_state' in df.columns:
        inc_state = str(df['incident_state'].iloc[0]).strip().upper() if df['incident_state'].iloc[0] else ''
        state_features = [
            'incident_state_NY', 'incident_state_OH', 'incident_state_PA',
            'incident_state_SC', 'incident_state_VA', 'incident_state_WV'
        ]
        for state_feature in state_features:
            if state_feature in features_list:
                state_code = state_feature.replace('incident_state_', '')
                processed_data[state_feature] = [1 if inc_state == state_code else 0]
    
    # Incident City
    if 'incident_city' in df.columns:
        city = str(df['incident_city'].iloc[0]).strip() if df['incident_city'].iloc[0] else ''
        city_features = [
            'incident_city_Columbus', 'incident_city_Hillsdale', 'incident_city_Northbend',
            'incident_city_Northbrook', 'incident_city_Riverwood', 'incident_city_Springfield'
        ]
        for city_feature in city_features:
            if city_feature in features_list:
                city_code = city_feature.replace('incident_city_', '')
                processed_data[city_feature] = [1 if city == city_code else 0]
    
    # ========================================
    # 5. CONVERT TO DATAFRAME
    # ========================================
    result_df = pd.DataFrame(processed_data)
    
    # Ensure column order matches features_list
    result_df = result_df[[feature for feature in features_list if feature in result_df.columns]]
    
    # Fill any remaining missing features with 0
    for feature in features_list:
        if feature not in result_df.columns:
            result_df[feature] = 0
    
    return result_df


def classify_fraud_mongodb(policy_number=None, claimer_name=None):
    """
    Classify fraud using LightGBM model on MongoDB fraud classification data.
    
    Args:
        policy_number (str, optional): Policy number to search for
        claimer_name (str, optional): Claimer name to search for
        
    Returns:
        dict: Classification result with keys:
            - 'prediction': 0 (not fraud) or 1 (fraud)
            - 'probability': Fraud probability score (0.0 to 1.0)
            - 'confidence': Confidence in prediction
            - 'indicators': List of indicators from LightGBM
            - 'source': 'mongodb_lightgbm'
            Or None if data not found or classification failed
    """
    print(f"\n    [MongoDB LightGBM Classifier]")
    
    # Load model and features
    print(f"    → Loading LightGBM model...")
    model = _load_lightgbm_model()
    features_list = _load_features_list()
    
    if model is None or features_list is None:
        print(f"    ✗ Failed to load model or features")
        return None
    
    print(f"    ✓ Model loaded ({type(model).__name__}, {len(features_list)} features)")

    # Fetch fraud data from MongoDB
    fraud_data = None
    search_field_display = None
    search_field_key = None
    
    if policy_number:
        print(f"    → Querying MongoDB: policy_number = '{policy_number}'")
        fraud_data = _fetch_fraud_data_by_policy(policy_number)
        search_field_display = "policy_number"
        search_field_key = "policy_number"
    elif claimer_name:
        print(f"    → Querying MongoDB: claimer_name = '{claimer_name}'")
        fraud_data = _fetch_fraud_data_by_claimer(claimer_name)
        search_field_display = "claimer_name"
        search_field_key = "claimer_name"
    else:
        print(f"    ✗ No search criteria provided")
        return None
    
    if fraud_data is None:
        print(f"    ✗ No matching record found in MongoDB")
        return None
    
    print(f"    ✓ Record found ({search_field_display}: {fraud_data.get(search_field_key, 'N/A')})")

    # Preprocess data
    print(f"    → Preprocessing data for model ({len(features_list)} features)...")
    processed_df = _preprocess_fraud_data(fraud_data, features_list)
    
    if processed_df is None or processed_df.empty:
        print(f"    ✗ Failed to preprocess data")
        return None
    
    print(f"    ✓ Data preprocessed successfully")

    # Make prediction
    try:
        print(f"    → Running LightGBM prediction...")
        prediction = model.predict(processed_df)[0]
        probability = model.predict_proba(processed_df)[0][1]  # Probability of fraud class
        
        prediction_label = ["NOT FRAUD", "FRAUD"][int(prediction)]
        print(f"    ✓ Prediction: {prediction_label} (probability: {probability:.4f})")
        
        return {
            'prediction': int(prediction),
            'probability': float(probability),
            'confidence': min(abs(probability - 0.5) * 2 + 0.5, 1.0),  # Confidence based on distance from 0.5
            'indicators': [f"LightGBM prediction: {['Not Fraud', 'Fraud'][int(prediction)]}"],
            'source': 'mongodb_lightgbm',
            'search_field': search_field_display,
            'matched_record': fraud_data.get('_id')
        }
    except Exception as e:
        print(f"    ✗ Error during LightGBM prediction: {e}")
        return None
