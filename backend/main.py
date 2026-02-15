import os
import pickle
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini with the new SDK
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
GEMINI_MODEL = 'gemini-3-pro-preview'

app = FastAPI(title="AI Triage Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load ML Model
MODEL_PATH = "model.pkl"
if not os.path.exists(MODEL_PATH):
    # This is a fallback in case the model hasn't been trained yet
    # In a real scenario, you'd run the training script first.
    print("Warning: model.pkl not found. Running training script...")
    from ml_model import train_model
    train_model()

with open(MODEL_PATH, "rb") as f:
    ml_model = pickle.load(f)

class PatientData(BaseModel):
    patient_id: Optional[str] = ""
    age: Optional[int] = None
    gender: Optional[str] = ""
    symptoms: str
    heart_rate: Optional[int] = None
    temp: Optional[float] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    pre_existing: Optional[str] = ""

class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None

def calculate_news2_score(data: PatientData):
    """Simplified NEWS2 (excluding respiratory parameters)."""
    score = 0
    
    # Temp
    temp = data.temp or 37.0
    if temp <= 35.0 or temp >= 39.1: score += 3
    elif temp >= 38.1: score += 1
    
    # Systolic BP
    sbp = data.systolic_bp or 120
    if sbp <= 90 or sbp >= 220: score += 3
    elif 91 <= sbp <= 100: score += 2
    elif 101 <= sbp <= 110: score += 1
    
    # Heart Rate
    hr = data.heart_rate or 75
    if hr <= 40 or hr >= 131: score += 3
    elif 111 <= hr <= 130: score += 2
    elif 41 <= hr <= 50 or 91 <= hr <= 110: score += 1
    
    return score

@app.post("/extract-from-document")
async def extract_from_document(file: UploadFile = File(...)):
    """Extracts patient metadata from uploaded EHR or EMR documents."""
    content = await file.read()
    
    mime_type = file.content_type
    if mime_type == "application/octet-stream":
        if file.filename.endswith('.pdf'): mime_type = 'application/pdf'
        elif file.filename.endswith('.png'): mime_type = 'image/png'
        elif file.filename.endswith(('.jpg', '.jpeg')): mime_type = 'image/jpeg'
        else: mime_type = 'text/plain'

    prompt = """
    You are a medical data extraction expert. Analyze the provided file (EHR/EMR document).
    Identify risk signals, medical history, diagnoses, medications, and abnormal vitals.
    
    Extract the following fields into a structured JSON format:
    - patient_id (string)
    - age (integer)
    - gender (Male/Female/Other)
    - symptoms (Concise summary of current complaints)
    - heart_rate (integer, bpm)
    - temp (float, Celsius)
    - systolic_bp (integer)
    - diastolic_bp (integer)
    - pre_existing (string, comma-separated list of historical diagnoses/medications)
    
    CRITICAL: If the document is an EMR/EHR, prioritize 'Abnormal Values' and 'Recent Observations'.
    Return ONLY the valid JSON object. If a value is missing or unidentifiable, return null for that field.
    """
    
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                prompt,
                types.Part.from_bytes(data=content, mime_type=mime_type)
            ]
        )
        import json
        import re
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        else:
            raise HTTPException(status_code=500, detail="Could not parse JSON from Gemini response")
    except Exception as e:
        print(f"Extraction Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-voice")
async def process_voice(file: UploadFile = File(...)):
    """Converts speech to text and extracts structured patient features from audio."""
    content = await file.read()
    
    mime_type = file.content_type
    if mime_type == "application/octet-stream":
        mime_type = "audio/webm"

    prompt = """
    You are a medical scribe. Analyze the audio of a patient intake.
    Extract the following fields into a FLAT JSON object. 
    
    Fields:
    - transcript: The exact words spoken.
    - patient_id: Any numeric or alphanumeric ID mentioned (e.g., "12345", "P-99"). If not found, look for any sequence of numbers that might be an ID.
    - age: integer or null
    - gender: "Male", "Female", or "Other" or null
    - symptoms: ONLY the current physical complaints mentioned. Do not include history here.
    - heart_rate: integer or null (e.g., 80)
    - temp: float or null (e.g., 37.5)
    - systolic_bp: integer or null (e.g., 120)
    - diastolic_bp: integer or null (e.g., 80)
    - pre_existing: ONLY past medical history (e.g., Diabetes, Hypertension).
    
    Rules:
    1. If a value is not mentioned, set it to null.
    2. Do not combine fields. 
    3. Return ONLY valid JSON.
    """
    
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                prompt,
                types.Part.from_bytes(data=content, mime_type=mime_type)
            ]
        )
        import json
        import re
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        else:
            return {"transcript": response.text, "symptoms": response.text}
    except Exception as e:
        print(f"Voice Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def rule_based_check(data: PatientData):
    """Safety layer to detect extreme vitals."""
    reasons = []
    if data.temp is not None and (data.temp > 39.5 or data.temp < 35.0):
        reasons.append("Extreme body temperature detected.")
    if data.heart_rate is not None and (data.heart_rate > 130 or data.heart_rate < 40):
        reasons.append("Critical heart rate detected.")
    if data.systolic_bp is not None and (data.systolic_bp > 180 or data.systolic_bp < 90):
        reasons.append("Dangerous blood pressure level detected.")
    
    if reasons:
        return "High", reasons
    return None, []

def get_department_recommendation(risk_level, symptoms, pre_existing):
    try:
        prompt = f"Given a patient with risk level {risk_level}, symptoms: '{symptoms}', and medical history: '{pre_existing}', recommend the primary and secondary hospital departments they should be routed to. Provide only the names of the departments separated by a comma."
        response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
        depts = response.text.strip().split(',')
        primary = depts[0].strip() if len(depts) > 0 else "General Medicine"
        secondary = depts[1].strip() if len(depts) > 1 else "Emergency"
        return primary, secondary
    except Exception as e:
        print(f"Gemini API Error (Dept Rec): {e}")
        return "General Medicine", "Emergency"

def get_symptom_severity(symptoms, pre_existing):
    try:
        prompt = f"Analyze these patient symptoms: '{symptoms}' and pre-existing conditions: '{pre_existing}'. Rate the clinical severity on a scale of 1 to 10. Consider how the history might aggravate the symptoms. Provide ONLY the integer number."
        response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
        # Extract integer from response
        import re
        match = re.search(r'\d+', response.text)
        return int(match.group()) if match else 5
    except Exception as e:
        print(f"Gemini API Error (Severity): {e}")
        return 5

@app.post("/search-hospitals")
async def search_hospitals(zipcode: str):
    """Uses Gemini to find real hospitals near a specific zipcode."""
    try:
        prompt = f"List 3-4 real hospitals or emergency medical centers near the zipcode {zipcode}. Provide their names and a very brief description of their specialty or location. Return as a clean bulleted list."
        response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
        return {"hospitals": response.text.strip()}
    except Exception as e:
        print(f"Hospital Search Error: {e}")
        return {"hospitals": "Error finding hospitals. Please contact emergency services at 108 if this is an emergency."}

@app.post("/triage")
async def triage_patient(data: PatientData):
    # 1. Standardized Clinical Score
    news2_score = calculate_news2_score(data)
    
    # 2. Rule-based check (Safety Layer)
    risk_level, override_reasons = rule_based_check(data)
    
    # 3. Symptom Severity Scoring (LLM helping ML)
    severity_score = get_symptom_severity(data.symptoms, data.pre_existing)

    # NEW: Calculate Comorbidity Count for ML
    # Simple count of comma-separated values, or 0 if None/Empty
    comorb_text = data.pre_existing.strip() if data.pre_existing else ""
    comorb_count = len([x for x in comorb_text.split(',') if x.strip()]) if comorb_text and comorb_text.lower() != 'none' else 0
    
    # 4. ML Model Prediction (Now with news2_score and comorbidity_count)
    gender_map = {'Male': 0, 'Female': 1, 'Other': 2}
    features = pd.DataFrame([{
        'age': data.age if data.age is not None else 30,
        'gender': gender_map.get(data.gender, 2),
        'heart_rate': data.heart_rate if data.heart_rate is not None else 75,
        'temp': data.temp if data.temp is not None else 37.0,
        'systolic_bp': data.systolic_bp if data.systolic_bp is not None else 120,
        'diastolic_bp': data.diastolic_bp if data.diastolic_bp is not None else 80,
        'symptom_severity': severity_score,
        'comorbidity_count': comorb_count,
        'news2_score': news2_score
    }])
    
    ml_risk = ml_model.predict(features)[0]
    ml_confidence = np.max(ml_model.predict_proba(features))
    
    # 5. Hybrid Consensus Logic
    # NEWS2 score of 5+ or a clinical rule override forces High Risk
    final_risk = ml_risk
    emergency_action = None
    if news2_score >= 5 or risk_level == "High":
        final_risk = "High"
    elif news2_score >= 3 and final_risk == "Low":
        final_risk = "Medium"
        
    # 6. Gemini Peer Review (detecting subtle clinical signals)
    try:
        review_prompt = f"""
        Triage Prediction: {final_risk}
        Symptoms: {data.symptoms}
        History: {data.pre_existing}
        Vitals NEWS2 Score: {news2_score}
        
        If the symptoms suggest an acute emergency (Stroke, MI, Sepsis) that the scores might miss, return 'High'. 
        Otherwise, return 'No Change'.
        Return ONLY one of those two options.
        """
        review_res = client.models.generate_content(model=GEMINI_MODEL, contents=review_prompt).text.strip()
        if "High" in review_res:
            final_risk = "High"
            override_reasons.append("Clinical peer review (Gemini) identified high-risk symptoms.")
    except:
        pass

    if final_risk == "High":
        emergency_action = "IMMEDIATE ACTION REQUIRED: Please call 108 or proceed to the nearest Emergency Department immediately. Do not wait."

    # 7. Department Recommendation & Explanation (LLM Layer)
    primary_dept, secondary_dept = get_department_recommendation(final_risk, data.symptoms, data.pre_existing)
    
    explanation_prompt = f"""
    Explain the triage decision for the following patient:
    Age: {data.age if data.age else 'N/A'}, Gender: {data.gender if data.gender else 'N/A'}
    Symptoms: {data.symptoms}
    History: {data.pre_existing}
    Vitals (NEWS2 Score {news2_score}): HR {data.heart_rate}, BP {data.systolic_bp}/{data.diastolic_bp}
    Assigned Risk Level: {final_risk}
    Recommended Department: {primary_dept}
    
    Provide a concise clinical reasoning. Mention if the risk was driven by vitals (NEWS2), ML prediction, or medical history.
    """
    
    try:
        explanation_response = client.models.generate_content(model=GEMINI_MODEL, contents=explanation_prompt)
        explanation = explanation_response.text.strip()
    except Exception as e:
        explanation = f"Patient assessed as {final_risk} risk. NEWS2: {news2_score}. Routed to {primary_dept}."
    
    # 8. Return results
    combined_score = news2_score + severity_score + comorb_count
    
    return {
        "risk_level": final_risk,
        "confidence_score": float(ml_confidence),
        "primary_department": primary_dept,
        "secondary_department": secondary_dept,
        "explanation": explanation,
        "override": len(override_reasons) > 0,
        "override_reasons": override_reasons,
        "news2_score": news2_score,
        "combined_score": combined_score,
        "emergency_action": emergency_action
    }

@app.post("/send-intake")
async def send_intake(hospital_name: str, data: PatientData):
    """Simulates sending an encrypted HL7/FHIR intake package to a hospital."""
    try:
        # In a real app, this would use an encrypted tunnel to a hospital API
        import uuid
        transmission_id = str(uuid.uuid4())[:8].upper()
        return {
            "success": True,
            "transmission_id": f"TX-{transmission_id}",
            "message": f"Patient data successfully transmitted to {hospital_name} triage queue."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Transmission failed")

@app.post("/chat")
async def clinical_chat(request: ChatRequest):
    """Context-aware clinical sidekick chat."""
    try:
        system_prompt = """
        You are the 'Clinical Sidekick', an AI assistant integrated into a healthcare triage system.
        Your goal is to help clinicians interpret triage results and provide additional clinical context.
        
        Guidelines:
        1. Be professional, concise, and clinically focused.
        2. Use the provided patient data and triage results to give specific answers.
        3. If asked for medical advice, always include a disclaimer that you are an AI assistant and not a replacement for clinical judgment.
        4. If the patient is 'High' risk, prioritize urgency in your tone.
        """
        
        context_str = ""
        if request.context:
            context_str = f"\n\nContext:\n{request.context}"
        
        full_prompt = f"{system_prompt}{context_str}\n\nUser Message: {request.message}\n\nAssistant Response:"
        
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=full_prompt
        )
        
        return {"response": response.text.strip()}
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)