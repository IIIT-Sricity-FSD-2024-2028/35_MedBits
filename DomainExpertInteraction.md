# Summary of the interaction
## Basic information
- **Domain:** Healthcare Administration (Non - Clinical)  
- **Problem Statement:** Patient Appointment and Registration Management System  
- **Date of interaction:** 29th January, 2026  
- **Mode of interaction:** Video Conference  
- **Duration (in-minutes):** 28 minutes
- **Publicly accessible Video link:**  
## Domain Expert Details
- **Role / designation:** Unit Head & COO, Apollo Karnataka Region
- **Experience in the domain:** Healthcare leader with **25+ years** at Apollo Hospitals overseeing medical operations, patient safety and quality compliance. Drives clinical governance, doctor performance and continuous improvement in patient care.
- **Nature of work:** Managerial
## Domain Context and Terminology
- **How would you describe the overall purpose of this problem statement in your daily work?**  
  - In daily work, this system helps us manage patient flow seamlessly - from registration and appointment booking to consultation and follow-up.
  - Ensures proper tracking of appointments, avoids scheduling conflicts and maintains accurate patient records.
  - Improves coordination between front desk staff and doctors and reduces manual paperwork at the front desk.
    
- **What are the primary goals or outcomes of this problem statement?**
  - To design and implement a centralized patient registration system.
  - To develop an efficient appointment scheduling and management system.
  - To maintain a complete and accurate history of patient visits.
    
- **List key terms used by the domain expert and their meanings**
    | Term | Meaning |
  |---|---|
  | Registration | The process of collecting and recording patient information to create an official patient identity within the system. |
  | Appointment | A scheduled arrangement between a patient and a doctor for medical consultation at a specific time. |
  | Consultation | The interaction between a doctor and a patient for diagnosis, advice or treatment. |
  | Prescription | Medical instructions provided by a doctor followed by a consultation.  |
  
## Actors and Responsibilities
- Identify the different roles involved and what they do in practice.  

    | Actor / Role | Responsibilities |
  |---|---|
  | Patient | Provide accurate personal and medical information.<br>Register before booking appointment or walk-in consultation.<br>Communicate symptoms and medical history clearly to the doctor. |
  | Doctor | Conduct consultation and record clinical notes.<br>Generate accurate digital prescriptions.<br>Recommend follow-up or referral when necessary. |
  | Front-Desk | Verify and register patient details.<br>Check doctor availability before booking.<br>Schedule, reschedule, or cancel appointments. |
## Core workflows
### Workflow 1 - Online Patient Registration
  - **Trigger/start condition**
    - A patient accesses the registration portal.
  - **Steps involved**  
    - Patient opens the online registration form. 
    - Patient enters basic personal and contact details.  
    - System validates the entered information.  
    - Patient submits the registration form.  
    - System creates the patient record and confirms registration.
  - **Outcome / End condition**
    - Patient is successfully registered in the system.
### Workflow 2 - Online Appointment Booking
  - **Trigger/start condition**
    - Patient logs into the online portal  and clicks on "Book Appointment".
  - **Steps involved**  
    - Patient selects the required doctor or speciality.  
    - System displays available dates and time slots.  
    - Patient selects a preferred slot and confirms the appointment.  
    - System books the appointment and sends confirmation.
  - **Outcome / End condition**
    - Appointment is successfully booked and patient details are stored in the system.
### Workflow 3 - Walk-in Appointment
  - **Trigger/start condition**
    - Patient arrives at the front desk without a prior appointment.
  - **Steps involved**
    - Front desk verifies or completes patient registration.  
    - Front desk selects the doctor or speciality.  
    - System checks real-time doctor availability.  
    - System creates a walk-in appointment and generates a token.
  - **Outcome / End condition**
    - Appointment and token are created and patient is queued.
 ### Workflow 4 - Patient Consultation
  - **Trigger/start condition**
    - Patient arrives for consultation.
  - **Steps involved**
    - Doctor opens the patient record from the appointment.  
    - System displays patient history and previous visits.  
    - Doctor examines the patient and records symptoms and observations.  
    - Doctor provides diagnosis, creates the prescription and advises follow-up if required.  
  - **Outcome / End condition**
    - Consultation completed, medical record updated and prescription generated.
## Rules, Constraints, and Exceptions
Document rules that govern how the domain operates.
  - Mandatory rules or policies: 
  - Constraints or limitations:
  - Common exceptions or edge cases:
  - Situations where things usually go wrong:
## Current challenges and pain points
- What parts of this process are most difficult or inefficient? 
- Where do delays, errors, or misunderstandings usually occur?
- What information is hardest to track or manage today?
 ## Assumptions & Clarifications
- What assumptions made by the team that were confirmed
- What assumptions that were corrected 
- Open questions that need follow-up 
      
    

