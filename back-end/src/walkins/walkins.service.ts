import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { PatientsService } from '../patients/patients.service';

export type WalkIn = {
  id: string;
  userId?: string;
  patientId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  guardianName: string;
  createdAt: string;
};

export type CreateWalkInInput = Omit<WalkIn, 'id' | 'createdAt' | 'userId' | 'patientId'>;

const WALKINS_DATA_FILE = join(
  __dirname,
  '..',
  '..',
  'data',
  'walkins.json',
);

const DEFAULT_WALKINS: WalkIn[] = [
  { id: 'WALKIN004', firstName: 'Meera', lastName: 'Nair', email: 'meera.nair@example.com', phone: '9876543210', dob: '14-09-1995', gender: 'Female', bloodGroup: 'B+', guardianName: 'Suresh Nair', createdAt: '2026-05-03T09:40:00.000Z' },
  { id: 'WALKIN003', firstName: 'Arjun', lastName: 'Menon', email: 'arjun.menon@example.com', phone: '9123456780', dob: '28-02-1988', gender: 'Male', bloodGroup: 'O+', guardianName: 'Lakshmi Menon', createdAt: '2026-05-03T08:55:00.000Z' },
  { id: 'WALKIN002', firstName: 'Farah', lastName: 'Ali', email: 'farah.ali@example.com', phone: '9988776655', dob: '06-11-2001', gender: 'Female', bloodGroup: 'A-', guardianName: 'Imran Ali', createdAt: '2026-05-02T16:30:00.000Z' },
  { id: 'WALKIN001', firstName: 'Dev', lastName: 'Patel', email: 'dev.patel@example.com', phone: '9012345678', dob: '19-07-1992', gender: 'Male', bloodGroup: 'AB+', guardianName: 'Kiran Patel', createdAt: '2026-05-02T15:10:00.000Z' },
];

@Injectable()
export class WalkInsService implements OnModuleInit {
  private walkins: WalkIn[] = [...DEFAULT_WALKINS];

  constructor(private readonly patientsService: PatientsService) {
    this.loadPersistedWalkIns();
  }

  async onModuleInit(): Promise<void> {
    await this.reconcileWithPatients();
  }

  getAllWalkIns(): WalkIn[] {
    return this.walkins.map((walkin) => ({ ...walkin }));
  }

  async createWalkIn(input: CreateWalkInInput): Promise<WalkIn> {
    const normalizedInput = {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      dob: input.dob.trim(),
      gender: input.gender.trim(),
      bloodGroup: input.bloodGroup.trim(),
      guardianName: input.guardianName.trim(),
    };

    if (!normalizedInput.firstName || !normalizedInput.lastName || !normalizedInput.email || !normalizedInput.phone || !normalizedInput.dob || !normalizedInput.gender || !normalizedInput.bloodGroup) {
      throw new BadRequestException('firstName, lastName, email, phone, dob, gender and bloodGroup are required');
    }

    let patient = this.patientsService.findMatchingPatient({
      email: normalizedInput.email,
      firstName: normalizedInput.firstName,
      lastName: normalizedInput.lastName,
      phone: normalizedInput.phone,
    });

    if (!patient) {
      patient = await this.patientsService.createPatient({
        firstName: normalizedInput.firstName,
        lastName: normalizedInput.lastName,
        email: normalizedInput.email,
        phone: normalizedInput.phone,
        dob: this.toIsoDate(normalizedInput.dob),
        gender: normalizedInput.gender,
        bloodGroup: normalizedInput.bloodGroup,
        guardianName: normalizedInput.guardianName,
      });
    }

    const nextId = this.generateNextId();
    const walkin: WalkIn = {
      id: nextId,
      userId: patient.userId,
      patientId: patient.userId,
      ...normalizedInput,
      createdAt: new Date().toISOString(),
    };
    this.walkins.unshift(walkin);
    this.persistWalkIns();

    return {
      ...walkin,
      id: patient.userId,
      userId: patient.userId,
      patientId: patient.userId,
      registrationId: walkin.id,
      name: `${patient.firstName} ${patient.lastName}`.trim(),
    } as WalkIn;
  }

  private async reconcileWithPatients(): Promise<void> {
    let walkinsModified = false;

    for (const walkin of this.walkins) {
      const explicitId = walkin.userId?.trim() || walkin.patientId?.trim();
      let patient = this.patientsService.findMatchingPatient({
        userId: explicitId,
        email: walkin.email,
        firstName: walkin.firstName,
        lastName: walkin.lastName,
        phone: walkin.phone,
      });

      if (!patient) {
        patient = await this.patientsService.createPatient({
          firstName: walkin.firstName,
          lastName: walkin.lastName,
          email: walkin.email,
          phone: walkin.phone,
          dob: this.toIsoDate(walkin.dob),
          gender: walkin.gender,
          bloodGroup: walkin.bloodGroup,
          guardianName: walkin.guardianName ?? '',
        });
      }

      if (walkin.userId !== patient.userId || walkin.patientId !== patient.userId) {
        walkin.userId = patient.userId;
        walkin.patientId = patient.userId;
        walkinsModified = true;
      }
    }

    if (walkinsModified) {
      this.persistWalkIns();
    }
  }

  private loadPersistedWalkIns(): void {
    try {
      if (!existsSync(WALKINS_DATA_FILE)) {
        this.persistWalkIns();
        return;
      }
      const raw = readFileSync(WALKINS_DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        this.walkins = parsed;
      }
    } catch (_) {}
  }

  private persistWalkIns(): void {
    try {
      mkdirSync(dirname(WALKINS_DATA_FILE), { recursive: true });
      writeFileSync(WALKINS_DATA_FILE, JSON.stringify(this.walkins, null, 2));
    } catch (_) {}
  }

  private generateNextId(): string {
    const idNumbers = this.walkins.map((walkin) => Number.parseInt(walkin.id.replace('WALKIN', ''), 10)).filter((value) => Number.isFinite(value));
    const nextNumber = (idNumbers.length ? Math.max(...idNumbers) : 0) + 1;
    return `WALKIN${nextNumber.toString().padStart(3, '0')}`;
  }

  private toIsoDate(dob: string): string {
    const [day, month, year] = dob.split('-').map((value) => value.trim());
    if (!day || !month || !year) return dob;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
}
