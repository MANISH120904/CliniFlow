import pickle
import pandas as pd
import numpy as np
from ml_model import generate_synthetic_data

def run_fairness_audit():
    with open('model.pkl', 'rb') as f:
        model = pickle.load(f)

    # Generate a large sample for audit
    df = generate_synthetic_data(n_samples=1000)
    gender_map = {'Male': 0, 'Female': 1, 'Other': 2}
    X = df.drop('risk', axis=1)
    X['gender'] = X['gender'].map(gender_map)
    
    # Get predictions and confidence
    df['pred_risk'] = model.predict(X)
    df['confidence'] = np.max(model.predict_proba(X), axis=1)

    print("========================================")
    print(" RESPONSIBLE AI: FAIRNESS AUDIT ")
    print("========================================")

    # 1. Risk Distribution by Gender
    print("\n[1] Risk Distribution by Gender:")
    dist = pd.crosstab(df['gender'], df['pred_risk'], normalize='index')
    print(dist)

    # 2. Average Confidence by Gender
    print("\n[2] Average Prediction Confidence by Gender:")
    conf_gender = df.groupby('gender')['confidence'].mean()
    print(conf_gender)

    # 3. Average Confidence by Age Group
    print("\n[3] Confidence by Age Group:")
    df['age_group'] = pd.cut(df['age'], bins=[0, 18, 65, 100], labels=['Pediatric', 'Adult', 'Geriatric'])
    conf_age = df.groupby('age_group')['confidence'].mean()
    print(conf_age)

    # 4. Flagging Uncertainty (Step 5 Requirement)
    uncertain_cases = df[df['confidence'] < 0.6].shape[0]
    print(f"\n[4] Low Confidence Flags (<60%): {uncertain_cases} cases flagged for human review.")

if __name__ == "__main__":
    run_fairness_audit()