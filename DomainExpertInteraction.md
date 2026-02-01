# Summary of the interaction
## Basic information
- **Domain:** Healthcare Administration (Non-Clinical)  
- **Problem Statement:** Patient Appointment and Registration Management System  
- **Date of interaction:** 29th January, 2026  
- **Mode of interaction:** Video Conference  
- **Duration (in-minutes):** 28 minutes
- **Publicly accessible Video link:** [Domain Expert Interaction](https://drive.google.com/file/d/1-tvYqG9HeO1LotektU92hLiGT_QJY6kP/view?usp=sharing)
***
## Domain Expert Details
- **Role / designation:** Unit Head & COO, Apollo Karnataka Region
- **Experience in the domain:** Healthcare leader with **25+ years** at Apollo Hospitals overseeing medical operations, patient safety and quality compliance. Drives clinical governance, doctor performance and continuous improvement in patient care.
- **Nature of work:** Managerial
***
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
***
## Actors and Responsibilities
- Identify the different roles involved and what they do in practice.  

    | Actor / Role | Responsibilities |
  |---|---|
  | Patient | Provide accurate personal and medical information.<br>Register before booking appointment or walk-in consultation.<br>Communicate symptoms and medical history clearly to the doctor. |
  | Doctor | Conduct consultation and record clinical notes.<br>Generate accurate digital prescriptions.<br>Recommend follow-up or referral when necessary. |
  | Front-Desk | Verify and register patient details.<br>Check doctor availability before booking.<br>Schedule, reschedule, or cancel appointments. |
***
## Core workflows
### Workflow 1 - Online Patient Registration
  - **Trigger/Start condition**
    - A patient accesses the registration portal.
  - **Steps involved**  
    - Patient opens the online registration form. 
    - Patient enters basic personal and contact details.  
    - System validates the entered information.  
    - Patient submits the registration form.  
    - System creates the patient record and confirms registration.
  - **Outcome/End condition**
    - Patient is successfully registered in the system.
### Workflow 2 - Online Appointment Booking
  - **Trigger/Start condition**
    - Patient logs into the online portal  and clicks on "Book Appointment".
  - **Steps involved**  
    - Patient selects the required doctor or speciality.  
    - System displays available dates and time slots.  
    - Patient selects a preferred slot and confirms the appointment.  
    - System books the appointment and sends confirmation.
  - **Outcome/End condition**
    - Appointment is successfully booked and patient details are stored in the system.
### Workflow 3 - Walk-in Appointment
  - **Trigger/Start condition**
    - Patient arrives at the front desk without a prior appointment.
  - **Steps involved**
    - Front desk verifies or completes patient registration.  
    - Front desk selects the doctor or speciality.  
    - System checks real-time doctor availability.  
    - System creates a walk-in appointment and generates a token.
  - **Outcome/End condition**
    - Appointment and token are created and patient is queued.
 ### Workflow 4 - Patient Consultation
  - **Trigger/Start condition**
    - Patient arrives for consultation.
  - **Steps involved**
    - Doctor opens the patient record from the appointment list.  
    - System displays patient history and previous visits.  
    - Doctor examines the patient and record symptoms and observations.  
    - Doctor provides diagnosis, creates the prescription and advises follow-up if required.  
  - **Outcome/End condition**
    - Consultation completed, medical record updated and prescription generated.
  ***
## Rules, Constraints, and Exceptions
Document rules that govern how the domain operates.
  - **Mandatory rules or policies**
    - Every patient must be registered before booking an appointment or generating a walk-in token.
    - Appointments must use available slots, prevent double booking and be recorded in the system.
    - Front desk must register new patients before generating tokens or booking appointments.
    - Doctor must access patient records before adding consultation notes.
  - **Constraints or limitations**
    - Doctor availability is limited to predefined working hours.
    - Data access is role based (Patient/Doctor/Front-Desk).
    - System access is restricted to authenticated and authorized users only.
  - **Common exceptions or edge cases**
    - Doctor unavailabe due to emergency.
    - Emergency patient bypasses normal queue.
    - Registration cannot proceed until mandatory fields are filled.
  - **Situations where things usually go wrong**
    - Two bookings made simultaneously due to poor slot locking.
    - Consultation notes are not saved leading to data loss.
    - Front desk enters incorrect patient profile leading prescription to be saved under wrong ID.
***
## Current challenges and pain points
- **What parts of this process are most difficult or inefficient?**
  - Doctors may get delayed, pulled into emergencies or extend consultations.
  - Follow-up and referrals often fail due to poor record linkage.
- **Where do delays, errors, or misunderstandings usually occur?**
  - During peak hours (10AM - 1PM), simultaneous walk-in and a 3-minute registration time per patient causes queue buildup and delays.
  - Limited digital literacy and poor understanding of specialities can lead to booking errors.
  - Lack of clarity during doctor selection may cause patients to book the wrong consultation. 
- **What information is hardest to track or manage today?**
  - Walk-in queue management is difficult due to unpredictable patient flow and emergency interruptions.
  - Consultation time variability makes it difficult to accurately predict waiting times. 
***
 ## Assumptions & Clarifications
- **What assumptions made by the team that were confirmed**
  - The domain expert confirmed that patient struggle with selecting the right speciality, so we added condition based doctor filtering.
  - The domain expert confirmed follow up visits should be linked to previous consultations to ensure continuity of care.
- **What assumptions that were corrected**
  - Domain expert corrected our assumption that doctors strictly follow scheduled hours stating that there might be emergencies or meetings.
  - Domain expert corrected our assumption that registration is always quick, noting that peak hours significantly slow the process.
- **Open questions that need follow-up**
  - How are emergency cases prioritized?
  - Can patients book multiple appointments at once?
  - How are referrals between specialities tracked?
***
