import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, GridSearchCV
import pickle
import os

def generate_synthetic_data(n_samples=5000, noise_level=0.1):
    # ... previous setup ...
    symptom_pool = {
        'Severe': ['Chest pain', 'Shortness of breath', 'Seizure', 'Unconscious', 'Severe bleeding', 'Stroke symptoms'],
        'Moderate': ['High fever', 'Severe abdominal pain', 'Persistent vomiting', 'Moderate injury', 'Confusion'],
        'Mild': ['Sore throat', 'Cough', 'Minor cut', 'Mild headache', 'Fatigue', 'Itchy skin']
    }
    
    data = []
    for _ in range(n_samples):
        category = np.random.choice(['Severe', 'Moderate', 'Mild'], p=[0.2, 0.3, 0.5])
        symptom = np.random.choice(symptom_pool[category])
        
        if category == 'Severe': base_severity = np.random.randint(8, 11)
        elif category == 'Moderate': base_severity = np.random.randint(4, 8)
        else: base_severity = np.random.randint(1, 4)
        
        age = np.random.randint(0, 100)
        gender = np.random.choice(['Male', 'Female', 'Other'])
        heart_rate = np.random.randint(50, 150)
        temp = np.random.uniform(36.0, 40.0)
        systolic_bp = np.random.randint(90, 180)
        diastolic_bp = np.random.randint(60, 110)
        comorbidity_count = np.random.choice([0, 1, 2, 3], p=[0.4, 0.3, 0.2, 0.1])

        # CALCULATE NEWS2 FOR TRAINING
        news2 = 0
        if heart_rate <= 40 or heart_rate >= 131: news2 += 3
        elif 111 <= heart_rate <= 130: news2 += 2
        if temp <= 35.0 or temp >= 39.1: news2 += 3
        if systolic_bp <= 90 or systolic_bp >= 220: news2 += 3
        
        # Risk heuristic using news2
        risk_score = (news2 * 0.8) + (base_severity * 0.3) + (comorbidity_count * 0.5)
        
        if risk_score >= 4.0: risk = 'High'
        elif risk_score >= 1.5: risk = 'Medium'
        else: risk = 'Low'
            
        if np.random.random() < noise_level:
            risk = np.random.choice(['Low', 'Medium', 'High'])
            
        data.append({
            'age': age,
            'gender': gender,
            'heart_rate': heart_rate,
            'temp': temp,
            'systolic_bp': systolic_bp,
            'diastolic_bp': diastolic_bp,
            'symptom_severity': base_severity,
            'comorbidity_count': comorbidity_count,
            'news2_score': news2, # New Feature
            'risk': risk
        })
    
    return pd.DataFrame(data)

def train_model():
    DATA_PATH = os.path.join('data', 'real_data.csv')
    
    if os.path.exists(DATA_PATH):
        print(f"Loading REAL data from {DATA_PATH}...")
        df = pd.read_csv(DATA_PATH)
        # Ensure your CSV has columns: age, gender, heart_rate, temp, systolic_bp, diastolic_bp, symptom_severity, comorbidity_count, risk
    else:
        print("Real data not found. Generating SYNTHETIC data with NOISE (Simulating real world)...")
        df = generate_synthetic_data(n_samples=5000, noise_level=0.1)
    
    # Preprocessing
    gender_map = {'Male': 0, 'Female': 1, 'Other': 2}
    df['gender'] = df['gender'].map(gender_map)
    X = df.drop('risk', axis=1)
    y = df['risk']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Hyperparameter Tuning using GridSearchCV
    print("Tuning hyperparameters (GridSearch)...")
    param_grid = {
        'n_estimators': [100, 200],
        'max_depth': [10, 20, None],
        'min_samples_split': [2, 5],
        'class_weight': ['balanced', 'balanced_subsample'] # Addresses imbalance
    }
    
    rf = RandomForestClassifier(random_state=42)
    grid_search = GridSearchCV(estimator=rf, param_grid=param_grid, cv=3, n_jobs=-1, verbose=1)
    grid_search.fit(X_train, y_train)
    
    best_model = grid_search.best_estimator_
    print(f"Best Parameters: {grid_search.best_params_}")
    
    # Save best model
    with open('model.pkl', 'wb') as f:
        pickle.dump(best_model, f)
    
    print("Model trained with optimization and saved.")

if __name__ == "__main__":
    train_model()