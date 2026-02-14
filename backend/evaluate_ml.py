import pickle
import pandas as pd
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from ml_model import generate_synthetic_data

def evaluate_system():
    # 1. Load the trained model
    try:
        with open('model.pkl', 'rb') as f:
            model = pickle.load(f)
    except FileNotFoundError:
        print("Error: model.pkl not found. Run ml_model.py first.")
        return

    # 2. Generate unseen test data
    print("Generating 500 fresh test samples...")
    test_df = generate_synthetic_data(n_samples=500)
    
    # 3. Preprocess test data
    gender_map = {'Male': 0, 'Female': 1, 'Other': 2}
    X_test = test_df.drop('risk', axis=1)
    X_test['gender'] = X_test['gender'].map(gender_map)
    # Ensure columns match ml_model.py output
    y_true = test_df['risk']

    # 4. Run predictions
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)

    # 5. Analyze Metrics
    print("\n" + "="*30)
    print(" ML SYSTEM PERFORMANCE REPORT ")
    print("="*30)
    
    print(f"\nOverall Accuracy: {accuracy_score(y_true, y_pred):.2%}")
    
    print("\nDetailed Classification Report:")
    print(classification_report(y_true, y_pred))
    
    print("\nConfusion Matrix:")
    labels = sorted(y_true.unique())
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    cm_df = pd.DataFrame(cm, index=[f"Actual {l}" for l in labels], columns=[f"Pred {l}" for l in labels])
    print(cm_df)

    print(f"\nMean Prediction Confidence: {np.mean(np.max(y_prob, axis=1)):.2%}")
    
    # 6. Feature Importance
    print("\nFeature Importance (What the model looks at most):")
    importances = model.feature_importances_
    features = X_test.columns
    for f, imp in sorted(zip(features, importances), key=lambda x: x[1], reverse=True):
        print(f"- {f}: {imp:.4f}")

if __name__ == "__main__":
    evaluate_system()