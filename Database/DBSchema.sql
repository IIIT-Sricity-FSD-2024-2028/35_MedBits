CREATE DATABASE MedBitsDB;
USE MedBitsDB;

CREATE TABLE Department (
    Dept_ID VARCHAR(8) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL
);

CREATE TABLE Doctor (
    Doctor_ID VARCHAR(8) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Date_Of_Birth DATE NOT NULL,
    Gender VARCHAR(10) NOT NULL,
    Phone_No VARCHAR(15) UNIQUE NOT NULL,
    EMail VARCHAR(100) UNIQUE NOT NULL,
    Speciality VARCHAR(100) NOT NULL,
    Years_of_Exp INT CHECK (Years_of_Exp >= 0),
    Qualification VARCHAR(100) NOT NULL,
    Dept_ID VARCHAR(8) NOT NULL,
    FOREIGN KEY (Dept_ID) REFERENCES Department(Dept_ID)
);

CREATE TABLE FrontDesk (
    Staff_ID VARCHAR(8) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Age INT CHECK (Age >= 18),
    Gender VARCHAR(10) NOT NULL,
    Phone_No VARCHAR(15) UNIQUE NOT NULL,
    EMail VARCHAR(100) UNIQUE NOT NULL,
    Date_Of_Joining DATE NOT NULL,
    Languages VARCHAR(100),
    Lobby_No INT NOT NULL
);

CREATE TABLE Patient (
    Patient_ID VARCHAR(8) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Date_Of_Birth DATE NOT NULL,
    Gender VARCHAR(10) NOT NULL,
    Phone_No VARCHAR(15) UNIQUE NOT NULL,
    EMail VARCHAR(100) UNIQUE NOT NULL,
    Blood_Group VARCHAR(5),
    Guardian_Name VARCHAR(100),
    Password VARCHAR(255) NOT NULL
);

CREATE TABLE Slot_Management (
    Slot_ID VARCHAR(8) PRIMARY KEY,
    Doctor_ID VARCHAR(8) NOT NULL,
    Day VARCHAR(20) NOT NULL,
    Start_Time TIME NOT NULL,
    End_Time TIME NOT NULL,
    Slot_Duration TIME NOT NULL,
    FOREIGN KEY (Doctor_ID) REFERENCES Doctor(Doctor_ID),
    CHECK (Start_Time < End_Time)
);

CREATE TABLE Appointment (
    Appoint_ID VARCHAR(8) PRIMARY KEY,
    Patient_ID VARCHAR(8) NOT NULL,
    Doctor_ID VARCHAR(8) NOT NULL,
    Slot_ID VARCHAR(8) NOT NULL,
    Date DATE NOT NULL,
    Time TIME NOT NULL,
    Type VARCHAR(20) NOT NULL CHECK (Type IN ('Online', 'WalkIn')),
    Status VARCHAR(20) NOT NULL,
    Created_by_staff_id VARCHAR(8),
    FOREIGN KEY (Patient_ID) REFERENCES Patient(Patient_ID),
    FOREIGN KEY (Doctor_ID) REFERENCES Doctor(Doctor_ID),
    FOREIGN KEY (Slot_ID) REFERENCES Slot_Management(Slot_ID),
    FOREIGN KEY (Created_by_staff_id) REFERENCES FrontDesk(Staff_ID)
);

CREATE TABLE Queue (
    Token VARCHAR(8),
    Date DATE,
    Appoint_ID VARCHAR(8) NOT NULL,
    Dept_ID VARCHAR(8) NOT NULL,
    Status VARCHAR(20) NOT NULL,
    Check_In_Time TIME NOT NULL,
    PRIMARY KEY (Token, Date),
    FOREIGN KEY (Appoint_ID) REFERENCES Appointment(Appoint_ID),
    FOREIGN KEY (Dept_ID) REFERENCES Department(Dept_ID)
);

CREATE TABLE ConsultationNote (
    Note_ID VARCHAR(8) PRIMARY KEY,
    Appoint_ID VARCHAR(8) UNIQUE NOT NULL,
    Date DATE NOT NULL,
    Prescription TEXT,
    FollowUp_Needed BOOLEAN NOT NULL,
    LabTest_Desc TEXT,
    FOREIGN KEY (Appoint_ID) REFERENCES Appointment(Appoint_ID)
);

CREATE TABLE FollowUp (
    FollowUp_ID VARCHAR(8) PRIMARY KEY,
    Prev_App_ID VARCHAR(8) NOT NULL,
    FollowUp_Date DATE NOT NULL,
    FOREIGN KEY (Prev_App_ID) REFERENCES Appointment(Appoint_ID)
);

CREATE TABLE Treatment_Plan (
    Treatment_ID VARCHAR(8) PRIMARY KEY,
    Patient_ID VARCHAR(8) NOT NULL,
    Doctor_ID VARCHAR(8) NOT NULL,
    Created_Date DATE NOT NULL,
    Tests TEXT,
    Medicines TEXT,
    Lifestyle TEXT,
    Diet TEXT,
    FOREIGN KEY (Patient_ID) REFERENCES Patient(Patient_ID),
    FOREIGN KEY (Doctor_ID) REFERENCES Doctor(Doctor_ID)
);

CREATE TABLE Feedback (
    Feed_ID VARCHAR(8) PRIMARY KEY,
    Patient_ID VARCHAR(8) NOT NULL,
    Doctor_ID VARCHAR(8) NOT NULL,
    Rating INT CHECK (Rating BETWEEN 1 AND 5),
    Comments TEXT,
    Date DATE NOT NULL,
    FOREIGN KEY (Patient_ID) REFERENCES Patient(Patient_ID),
    FOREIGN KEY (Doctor_ID) REFERENCES Doctor(Doctor_ID)
);

CREATE TABLE Referrals (
    Referral_ID VARCHAR(8) PRIMARY KEY,
    Patient_ID VARCHAR(8) NOT NULL,
    Referring_Doctor_ID VARCHAR(8) NOT NULL,
    Referred_Doctor_ID VARCHAR(8) NOT NULL,
    Date DATE NOT NULL,
    Reason TEXT,
    FOREIGN KEY (Patient_ID) REFERENCES Patient(Patient_ID),
    FOREIGN KEY (Referring_Doctor_ID) REFERENCES Doctor(Doctor_ID),
    FOREIGN KEY (Referred_Doctor_ID) REFERENCES Doctor(Doctor_ID)
);

CREATE TABLE LabTests (
    Test_ID VARCHAR(8) PRIMARY KEY,
    Test_Name VARCHAR(100) NOT NULL,
    Category VARCHAR(100) NOT NULL,
    Price DECIMAL(10,2) CHECK (Price >= 0)
);

CREATE TABLE LabTests_Order (
    Order_ID VARCHAR(8) PRIMARY KEY,
    Test_ID VARCHAR(8) NOT NULL,
    Patient_ID VARCHAR(8) NOT NULL,
    Order_Date DATE NOT NULL,
    Status VARCHAR(20) NOT NULL,
    FOREIGN KEY (Test_ID) REFERENCES LabTests(Test_ID),
    FOREIGN KEY (Patient_ID) REFERENCES Patient(Patient_ID)
);

CREATE TABLE LabTestPackage (
    Pack_ID VARCHAR(8) PRIMARY KEY,
    Patient_ID VARCHAR(8) NOT NULL,
    Doctor_ID VARCHAR(8) NOT NULL,
    Pack_Name VARCHAR(100) NOT NULL,
    Price DECIMAL(10,2) CHECK (Price >= 0),
    Date DATE NOT NULL,
    Tests_Count INT CHECK (Tests_Count >= 0),
    FOREIGN KEY (Patient_ID) REFERENCES Patient(Patient_ID),
    FOREIGN KEY (Doctor_ID) REFERENCES Doctor(Doctor_ID)
);

CREATE TABLE Package_Tests (
    PT_ID VARCHAR(8) PRIMARY KEY,
    Test_ID VARCHAR(8) NOT NULL,
    Pack_ID VARCHAR(8) NOT NULL,
    FOREIGN KEY (Test_ID) REFERENCES LabTests(Test_ID),
    FOREIGN KEY (Pack_ID) REFERENCES LabTestPackage(Pack_ID)
);

CREATE TABLE Medicine (
    Med_ID VARCHAR(8) PRIMARY KEY,
    Med_Name VARCHAR(100) NOT NULL,
    Price DECIMAL(10,2) CHECK (Price >= 0),
    Stock INT CHECK (Stock >= 0),
    Quantity INT CHECK (Quantity >= 0),
    Expiry_Date DATE NOT NULL
);

CREATE TABLE Medicine_Order (
    Order_ID VARCHAR(8) PRIMARY KEY,
    Patient_ID VARCHAR(8) NOT NULL,
    Date DATE NOT NULL,
    Total_Amt DECIMAL(10,2) CHECK (Total_Amt >= 0),
    Address TEXT NOT NULL,
    Delivery_Date DATE,
    FOREIGN KEY (Patient_ID) REFERENCES Patient(Patient_ID)
);

CREATE TABLE Medicine_OrderItems (
    Order_Item_ID VARCHAR(8) PRIMARY KEY,
    Order_ID VARCHAR(8) NOT NULL,
    Med_ID VARCHAR(8) NOT NULL,
    Quantity INT CHECK (Quantity > 0),
    Price DECIMAL(10,2) CHECK (Price >= 0),
    FOREIGN KEY (Order_ID) REFERENCES Medicine_Order(Order_ID),
    FOREIGN KEY (Med_ID) REFERENCES Medicine(Med_ID)
);