# AI-Based Multimodal Smart Triage and Patient Intake Assistant
## Comprehensive System Documentation

---

### 1. Project Objective
The objective of this system is to function as a hospital triage support tool that analyzes patient data from multiple sources (Structured, Voice, Documents), classifies medical risk, and provides explainable routing recommendations to improve hospital efficiency and patient safety.

---

### 2. Deep Dive: The NEWS2 Logic
**NEWS2 (National Early Warning Score 2)** is the "Safety Floor" of our system. 

#### **2.1 Origin and History**
- **Developed by:** The Royal College of Physicians (RCP), UK.
- **Timeline:** Version 1 (2012), Version 2 (2017).
- **Purpose:** To provide a standardized universal language for clinical deterioration. It is currently the gold standard across the NHS (UK).

#### **2.2 How it Functions (Parameters)**
NEWS2 assigns points based on physiological deviance from "Normal." Our implementation focuses on:
| Parameter | 3 Points (Low) | 0 Points (Normal) | 3 Points (High) |
| :--- | :--- | :--- | :--- |
| **Heart Rate** | ≤ 40 bpm | 51 - 90 bpm | ≥ 131 bpm |
| **Systolic BP** | ≤ 90 mmHg | 111 - 219 mmHg | ≥ 220 mmHg |
| **Temperature** | ≤ 35.0 °C | 36.1 - 38.0 °C | ≥ 39.1 °C |

#### **2.3 Clinical Action Thresholds**
- **Score 0-2 (Low):** Standard observation.
- **Score 3-4 (Medium):** Requires clinician review.
- **Score 5+ (High):** RED ALERT. Requires immediate urgent clinical response.

#### **2.4 Implementation in this Project**
The function `calculate_news2_score` in `backend/main.py` is a custom implementation of the official RCP guidelines. It serves as a deterministic override: if the NEWS2 score hits 5, the system automatically assigns **HIGH RISK**, regardless of machine learning probabilities.

---

### 3. Step-by-Step System Workflow
The system processes data in a sequential "Consensus" pipeline:

1. **Intake Stage:** User provides data via Voice, PDF/Image documents, or the Form.
2. **LLM Extraction (The Scribe):** Gemini parses the multimodal input. It identifies the "semantic meaning" of symptoms and calculates a **Symptom Severity Score (1-10)**.
3. **Logic Integration:**
   - The system runs the **NEWS2 Python function** to get a deterministic clinical score.
   - The system calculates the **Comorbidity Count** (number of pre-existing conditions).
4. **ML Classification (The Engine):** All features (Vitals + Severity + History + NEWS2) are fed into the **Random Forest Model**. 
5. **Final Consensus:** The system compares the ML prediction with the NEWS2 score. If NEWS2 is high, it overrides the ML. 
6. **Output Generation:** Gemini writes a natural-language explanation and recommends a hospital department based on the final consensus.

---

### 4. Hospital Notification: From Mock to Real-World
Currently, the **"Transmit Data to Hospital"** feature is a functional prototype.

#### **How the Mock Works:**
- **Permission:** The app strictly requires a "Permission Granted" toggle (User Consent).
- **Transmission:** When clicked, the backend generates a **Unique Transmission ID (Ref ID)** using a UUID algorithm. 
- **Receipt:** The user receives a digital receipt. This simulates the "handshake" between a patient and a hospital's digital queue.

#### **Real-World Implementation (The Roadmap):**
In a production environment, the "Medium" of transmission would change from a mock to:
- **Medium:** Encrypted HTTPS tunnel using **HL7 FHIR** (Fast Healthcare Interoperability Resources) standards.
- **Destination:** The data would be posted directly to a hospital's **RESTful API** (e.g., Epic’s App Orchard or Cerner’s Ignite APIs).
- **Security:** The transmission would occur over a **VPN or Private Cloud Link**, ensuring HIPAA/GDPR compliance.
- **The Handshake:** Upon arrival, the patient provides their Ref ID. The triage nurse enters this ID into their EMR station, and the pre-filled intake form (with AI risk assessment) instantly appears, saving critical minutes.

---

### 5. Machine Learning & Performance
- **Model:** Random Forest Classifier (Optimized via Hyperparameter Tuning).
- **Training:** 5,000 synthetic samples mapped to clinical ESI (Emergency Severity Index) standards.
- **Realistic Testing:** A **10% Noise Level** was introduced to training data to ensure the model can handle "messy" real-world patient inputs.
- **Accuracy:** ~90-96% across all risk categories.

---

### 6. User Interface Design
- **Theme:** Professional Lavender and White.
- **Accessibility:** Large, clear alerts for High-Risk patients.
- **Integrated Tools:** Zipcode-based hospital locator to ensure "High Risk" patients can find immediate help.

---
*Note: This system is a Decision Support Tool and does not provide medical diagnoses.*