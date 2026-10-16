# FDFED

# Hospital Management and Appointment Booking System
The Hospital Management System is a web-based application that streamlines hospital operations, including patient management, appointments, doctor consultations and laboratory services.
It provides role-based access for patients, doctors, front-desk staff, lab technicians, branch admins and super admins to efficiently manage hospital activities across multiple branches.

## User Roles and Responsibilities
1. **Patient**
   - Book and manage appointments
   - Book laboratory tests and medicines
   - View Medical Record
   - Submit feedback for completed appointments
2. **Doctor**
   - View upcoming appointments
   - Prepare consultation notes and treatment plans
   - Create internal referrals for patients
3. **Front Desk**
   - Manage new registrations
   - Manage appointments and patient queues
4. **Super Admin**
   - Maintains and handles all the hospital branches
   - Creates branch admins for respective branch
   - Views the statistics for all branches
5. **Branch Admin**
   - Add and manage staff within their respective branch
   - Views and maintains statistics for their respective branch
6. **Lab Technician**
   - Accept and process laboratory test requests
   - Prepare and share laboratory reports with patients and doctors

## Workflows
  - Patient registers with the hospital or is registered by front-desk staff.
  - The patient books an appointment.
  - The doctor reviews the appointment and consults the patient.
  - If doctor requests laboratory tests, the lab technician processes the request and records the results.
  - Patients can access their medical records and submit feedback for completed appointments.

## Technology Stack
  - Frontend: React.js
  - Backend: Nest.js (JavaScript)

  ## Clone the Repository
    git clone https://github.com/IIIT-Sricity-FSD-2024-2028/35_MedBits.git
    cd 35_MedBits
## Backend Setup and to run server
    cd back-end
    npm install
    npm run start:dev
## Frontend Setup
    cd react-frontend
    npm install
    npm run dev
