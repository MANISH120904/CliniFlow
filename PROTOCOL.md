# AI Smart Triage Assistant: Clinical Protocol & Logic

## 1. Overview
This system utilizes a **Multi-Stage Clinical Consensus** model to assist in hospital triage. It is designed as a Decision Support Tool and not a diagnostic engine.

## 2. Decision Hierarchy
The system follows a three-tier priority hierarchy:
1.  **Tier 1: Deterministic Safety (NEWS2)** - High-priority vital sign thresholds.
2.  **Tier 2: Semantic Risk (LLM)** - Symptom-based emergency detection.
3.  **Tier 3: Statistical Risk (ML)** - Weighted analysis of vitals, history, and age.

## 3. Vital Sign Thresholds (NEWS2 Based)
The system calculates a NEWS2 score based on:
-   **Heart Rate:** (Normal: 51-90 bpm)
-   **Systolic BP:** (Normal: 111-219 mmHg)
-   **Temperature:** (Normal: 36.1-38.0°C)

**Override Logic:**
-   **NEWS2 ≥ 5:** Forced **HIGH RISK**. This aligns with international standards for "Urgent Clinical Review."
-   **NEWS2 3-4:** Forced **MEDIUM RISK** minimum.

## 4. Machine Learning Weights (Random Forest)
The ML model identifies patterns using the following feature importance:
-   **Comorbidity Count (24%)**: Quantifies reduced physiological reserve.
-   **Symptom Severity (18%)**: LLM-derived score of clinical complaints.
-   **Clinical Vitals (50% combined)**: Statistical correlation of HR, BP, and Temp.
-   **Demographics (8%)**: Age and gender-based risk adjustment.

## 5. Responsible AI & Safety
-   **Fairness:** Audited for consistency across Gender and Age groups.
-   **Uncertainty:** Confidence scores < 60% are flagged for human review.
-   **Transparency:** Every decision is accompanied by a Natural Language Explanation citing the specific vital signs or history that drove the result.

## 6. Standards Compliance
-   **Vitals:** National Early Warning Score 2 (NEWS2)
-   **Triage:** Inspired by Emergency Severity Index (ESI)
-   **Architecture:** Hybrid Multimodal AI (LLM + Gradient Boosted Trees)
