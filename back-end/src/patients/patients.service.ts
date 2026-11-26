import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type PatientProfile = {
  userId: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  phone: string;
  email: string;
  guardianName: string;
};

// Profiles created during user signup already have a user id; patient creation
// generates one internally via `createPatient`.
export type CreatePatientProfileInput = PatientProfile;
export type CreatePatientInput = Omit<PatientProfile, 'userId'>;
export type UpdatePatientProfileInput = Partial<Omit<PatientProfile, 'userId'>>;

export type PatientIdentityCriteria = {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

const PATIENTS_DATA_FILE = join(
  __dirname,
  '..',
  '..',
  'data',
  'patients.json',
);

const DEFAULT_PATIENTS: PatientProfile[] = [
  { userId: 'PAT001', firstName: 'Ria', lastName: 'Sharma', dob: '1990-10-24', gender: 'Female', bloodGroup: 'A+', phone: '9473487399', email: 'ria@medbits.com', guardianName: 'Ravi Sharma' },
  { userId: 'PAT002', firstName: 'Arun', lastName: 'Menon', dob: '1988-02-28', gender: 'Male', bloodGroup: 'O+', phone: '9123456780', email: 'arun.menon@medbits.com', guardianName: 'Lakshmi Menon' },
  { userId: 'PAT003', firstName: 'Farah', lastName: 'Ali', dob: '2001-11-06', gender: 'Female', bloodGroup: 'A-', phone: '9988776655', email: 'farah.ali@medbits.com', guardianName: 'Imran Ali' },
  { userId: 'PAT004', firstName: 'Dev', lastName: 'Patel', dob: '1992-07-19', gender: 'Male', bloodGroup: 'AB+', phone: '9012345678', email: 'dev.patel@medbits.com', guardianName: 'Kiran Patel' },
];

@Injectable()
export class PatientsService {
  private patients: PatientProfile[] = DEFAULT_PATIENTS.map((patient) => ({ ...patient }));

  constructor() {
    this.loadPersistedPatients();
  }

  getPatientByUserId(userId: string): PatientProfile {
    const cleanId = userId?.trim();
    const patient = this.patients.find((item) => item.userId === cleanId);
    if (!patient) throw new NotFoundException('Patient profile not found');

    return { ...patient };
  }

  getAllPatients(): PatientProfile[] {
    const seen = new Set<string>();
    const unique: PatientProfile[] = [];
    for (const patient of this.patients) {
      if (!patient.userId || seen.has(patient.userId)) continue;
      seen.add(patient.userId);
      unique.push({ ...patient });
    }
    return unique;
  }

  findMatchingPatient(criteria: PatientIdentityCriteria): PatientProfile | null {
    const cleanUserId = criteria.userId?.trim();
    if (cleanUserId) {
      const byId = this.patients.find((item) => item.userId === cleanUserId);
      if (byId) return { ...byId };
    }

    const cleanEmail = criteria.email?.trim().toLowerCase();
    if (cleanEmail) {
      const byEmail = this.patients.find(
        (item) => item.email.trim().toLowerCase() === cleanEmail,
      );
      if (byEmail) return { ...byEmail };
    }

    const normalizedName = `${criteria.firstName ?? ''} ${criteria.lastName ?? ''}`
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
    const normalizedPhone = (criteria.phone ?? '').replace(/\D/g, '');
    if (normalizedName && normalizedPhone) {
      const byNameAndPhone = this.patients.find((item) => {
        const itemName = `${item.firstName} ${item.lastName}`
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' ');
        const itemPhone = (item.phone ?? '').replace(/\D/g, '');
        return itemName === normalizedName && itemPhone === normalizedPhone;
      });
      if (byNameAndPhone) return { ...byNameAndPhone };
    }

    return null;
  }

  async createPatientProfile(profile: CreatePatientProfileInput): Promise<PatientProfile> {
    const cleanUserId = profile.userId?.trim();
    if (!cleanUserId) {
      throw new BadRequestException('userId is required');
    }

    const existing = this.patients.find((item) => item.userId === cleanUserId);
    if (existing) {
      return { ...existing };
    }

    const patient: PatientProfile = {
      userId: cleanUserId,
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      dob: profile.dob.trim(),
      gender: profile.gender.trim(),
      bloodGroup: profile.bloodGroup.trim(),
      phone: profile.phone.trim(),
      email: profile.email.trim().toLowerCase(),
      guardianName: profile.guardianName.trim(),
    };
    this.patients.push({ ...patient });
    this.persistPatients();
    return { ...patient };
  }

  async createPatient(input: CreatePatientInput): Promise<PatientProfile> {
    const normalizedPatient: PatientProfile = {
      userId: this.generateNextPatientId(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      dob: input.dob.trim(),
      gender: input.gender.trim(),
      bloodGroup: input.bloodGroup.trim(),
      phone: input.phone.trim(),
      email: input.email.trim().toLowerCase(),
      guardianName: input.guardianName.trim(),
    };

    if (!normalizedPatient.firstName || !normalizedPatient.lastName || !normalizedPatient.dob || !normalizedPatient.gender || !normalizedPatient.bloodGroup || !normalizedPatient.phone || !normalizedPatient.email) {
      throw new BadRequestException('firstName, lastName, dob, gender, bloodGroup, phone and email are required');
    }
    this.patients.push(normalizedPatient);
    this.persistPatients();
    return { ...normalizedPatient };
  }

  async updatePatientByUserId(userId: string, updates: UpdatePatientProfileInput): Promise<PatientProfile> {
    const patientIndex = this.patients.findIndex((item) => item.userId === userId);
    if (patientIndex === -1) throw new NotFoundException('Patient profile not found');
    const existingPatient = this.patients[patientIndex];
    const nextPatient = {
      ...existingPatient,
      ...updates,
      userId,
      firstName: updates.firstName?.trim() ?? existingPatient.firstName,
      lastName: updates.lastName?.trim() ?? existingPatient.lastName,
      dob: updates.dob?.trim() ?? existingPatient.dob,
      gender: updates.gender?.trim() ?? existingPatient.gender,
      bloodGroup: updates.bloodGroup?.trim() ?? existingPatient.bloodGroup,
      phone: updates.phone?.trim() ?? existingPatient.phone,
      email: updates.email?.trim().toLowerCase() ?? existingPatient.email,
      guardianName: updates.guardianName?.trim() ?? existingPatient.guardianName,
    } as PatientProfile;
    this.patients[patientIndex] = nextPatient;
    this.persistPatients();
    return { ...nextPatient };
  }

  private generateNextPatientId(): string {
    const patientIds = this.patients
      .map((item) => {
        const match = /^PAT(\d+)$/i.exec(item.userId.trim());
        return match ? Number.parseInt(match[1], 10) : Number.NaN;
      })
      .filter((value) => Number.isFinite(value));

    const nextNumber = (patientIds.length ? Math.max(...patientIds) : 0) + 1;
    let candidate = `PAT${nextNumber.toString().padStart(3, '0')}`;
    let counter = nextNumber;
    while (this.patients.some((item) => item.userId === candidate)) {
      counter += 1;
      candidate = `PAT${counter.toString().padStart(3, '0')}`;
    }
    return candidate;
  }

  private loadPersistedPatients(): void {
    try {
      if (!existsSync(PATIENTS_DATA_FILE)) {
        this.persistPatients();
        return;
      }

      const raw = readFileSync(PATIENTS_DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const seen = new Set<string>();
        const deduped: PatientProfile[] = [];
        for (const item of parsed) {
          const cleanId = item?.userId?.trim();
          if (!cleanId || seen.has(cleanId)) continue;
          seen.add(cleanId);
          deduped.push({ ...item, userId: cleanId });
        }
        if (deduped.length > 0) {
          this.patients = deduped;
        }
      }
    } catch (_) {}
  }

  private persistPatients(): void {
    try {
      mkdirSync(dirname(PATIENTS_DATA_FILE), { recursive: true });
      writeFileSync(PATIENTS_DATA_FILE, JSON.stringify(this.patients, null, 2));
    } catch (_) {}
  }
}
