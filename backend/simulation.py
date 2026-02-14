import pickle
import pandas as pd
import numpy as np
from ml_model import generate_synthetic_data

def run_triage_simulation(incoming_count=50):
    with open('model.pkl', 'rb') as f:
        model = pickle.load(f)

    # 1. Simulate incoming flow
    df = generate_synthetic_data(n_samples=incoming_count)
    gender_map = {'Male': 0, 'Female': 1, 'Other': 2}
    X = df.drop('risk', axis=1)
    X['gender'] = X['gender'].map(gender_map)
    
    # 2. Predict Load
    df['pred_risk'] = model.predict(X)
    
    # 3. Department Load Estimation
    depts = ['General Medicine', 'Cardiology', 'Pulmonology', 'Neurology', 'Emergency']
    df['assigned_dept'] = np.random.choice(depts, size=incoming_count)

    print("========================================")
    print(" HOSPITAL TRIAGE SIMULATION (Next 4hrs) ")
    print("========================================")
    
    print("\nProjected Incoming Patients:", incoming_count)
    
    print("\n[1] Predicted Risk Distribution:")
    risk_counts = df['pred_risk'].value_counts()
    for risk, count in risk_counts.items():
        print("-", risk, ":", count, "patients", f"({(count/incoming_count):.1%})")

    print("\n[2] Department Load Estimation:")
    dept_counts = df['assigned_dept'].value_counts()
    for dept, count in dept_counts.items():
        wait_time = count * 15 
        print("-", dept, ":", count, "patients", f"(Est. wait: {wait_time} mins)")

    print("\n[3] Prioritization Order (Top 5 Critical):")
    critical = df[df['pred_risk'] == 'High'].sort_values(by=['temp', 'age'], ascending=False).head(5)
    for i, row in critical.iterrows():
        print("- Index:", i, "| Age:", row['age'], "| Temp:", row['temp'], "| Status: URGENT")

if __name__ == "__main__":
    run_triage_simulation()