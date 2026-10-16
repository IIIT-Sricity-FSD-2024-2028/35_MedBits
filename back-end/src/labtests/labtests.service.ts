import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { LabRequestsService } from '../lab-requests/lab-requests.service';

export type LabTest = {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
};

export type TestBookingStatus = 'cart' | 'booked';

export type TestBooking = {
  id: string;
  userId: string;
  labTestId: string;
  branchId: string;
  status: TestBookingStatus;
  cartId: string;
  orderId: string | null;
};

export type CreateTestBookingInput = {
  userId: string;
  labTestId: string;
  branchId: string;
};

type LabTestsState = {
  testBookings: TestBooking[];
};

const LABTESTS_DATA_FILE = join(
  __dirname,
  '..',
  '..',
  'data',
  'labtests.json',
);

@Injectable()
export class LabTestsService {
  private readonly labTests: LabTest[] = [
    {
      id: 'LAB001',
      name: 'Prime Full Body Checkup',
      price: 1549,
      category: 'Full Body Check Up',
      description: 'Comprehensive preventive health screening package.',
    },
    {
      id: 'LAB002',
      name: 'Xpert Regular Full Body Health Checkup',
      price: 1079,
      category: 'Full Body Check Up',
      description: 'Routine full body screening with essential health markers.',
    },
    {
      id: 'LAB003',
      name: 'HbA1c Test (Glycated Hemoglobin)',
      price: 649,
      category: 'Diabetes',
      description: 'Measures average blood sugar levels over the last 2 to 3 months.',
    },
    {
      id: 'LAB004',
      name: 'Fasting Blood Sugar Test (FBS)',
      price: 100,
      category: 'Diabetes',
      description: 'Checks your fasting glucose level for diabetes screening.',
    },
    {
      id: 'LAB005',
      name: 'Complete Blood Count (CBC)',
      price: 419,
      category: 'Blood Studies',
      description: 'Complete blood count to assess overall blood health.',
    },
    {
      id: 'LAB006',
      name: 'Comprehensive Lipid Profile',
      price: 829,
      category: 'Heart',
      description: 'Measures cholesterol and triglycerides for cardiac risk review.',
    },
    {
      id: 'LAB007',
      name: 'Thyroid Profile Total (T3, T4, TSH)',
      price: 550,
      category: 'Thyroid',
      description: 'Evaluates thyroid gland activity and metabolic hormone regulation to detect hyperthyroidism or hypothyroidism.',
    },
    {
      id: 'LAB008',
      name: 'Vitamin D (25-OH) & Vitamin B12 Duo',
      price: 1299,
      category: 'Vitamin',
      description: 'Crucial screening for bone density, calcium absorption, neurological health, energy metabolism, and immunity strength.',
    },
    {
      id: 'LAB009',
      name: 'Renal / Kidney Function Test (KFT)',
      price: 699,
      category: 'Kidney',
      description: 'Assesses serum creatinine, blood urea nitrogen (BUN), uric acid, and electrolytes to evaluate kidney filtration health.',
    },
    {
      id: 'LAB010',
      name: 'Liver Function Test (LFT)',
      price: 749,
      category: 'Liver',
      description: 'Evaluates liver enzymes (SGOT, SGPT, ALP), bilirubin levels, and total proteins to detect hepatic infection or inflammation.',
    },
  ];

  private testBookings: TestBooking[] = [];
  private readonly activeCartIds = new Map<string, string>();

  constructor(
    @Inject(forwardRef(() => LabRequestsService))
    private readonly labRequestsService: LabRequestsService,
  ) {
    this.loadPersistedState();
  }

  findAllTests(): LabTest[] {
    return this.labTests.map((test) => ({ ...test }));
  }

  createBooking(input: CreateTestBookingInput) {
    if (!input.userId || !input.labTestId || !input.branchId) {
      throw new BadRequestException('userId, labTestId and branchId are required');
    }

    const labTest = this.findTestById(input.labTestId);
    if (!labTest) {
      throw new BadRequestException('Lab test not found');
    }

    const existingBooking = this.testBookings.find(
      (booking) =>
        booking.userId === input.userId &&
        booking.labTestId === input.labTestId &&
        booking.branchId === input.branchId &&
        booking.status === 'cart',
    );

    if (existingBooking) {
      return this.toBookingDetails(existingBooking);
    }

    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const booking: TestBooking = {
      id: `TBOOK${timestamp}${randomSuffix}`,
      userId: input.userId,
      labTestId: input.labTestId,
      branchId: input.branchId || '00000000-0000-4000-8000-000000000001',
      status: 'cart',
      cartId: this.getOrCreateActiveCartId(input.userId),
      orderId: null,
    };

    this.testBookings.unshift(booking);
    this.persistState();
    return this.toBookingDetails(booking);
  }

  getCartBookingsByUserId(userId: string) {
    return this.testBookings
      .filter((booking) => booking.userId === userId && booking.status === 'cart')
      .map((booking) => this.toBookingDetails(booking));
  }

  confirmBookingsByUserId(userId: string, context?: { patientName?: string }) {
    const cartBookings = this.testBookings.filter(
      (booking) => booking.userId === userId && booking.status === 'cart',
    );

    if (!cartBookings.length) {
      throw new BadRequestException('Lab cart is empty');
    }

    const orderId = `LABORD${Date.now()}`;

    cartBookings.forEach((booking) => {
      booking.status = 'booked';
      booking.orderId = orderId;

      const labTest = this.findTestById(booking.labTestId);
      if (labTest) {
        this.labRequestsService.createDirectPatientRequest({
          sourceBookingId: booking.id,
          orderId,
          patientId: booking.userId,
          patientName: context?.patientName?.trim() || booking.userId || 'Patient',
          branchId: booking.branchId || '00000000-0000-4000-8000-000000000001',
          testName: labTest.name,
          requestDate: new Date().toISOString().split('T')[0],
        });
      }
    });

    this.activeCartIds.delete(userId);
    this.persistState();

    return cartBookings.map((booking) => this.toBookingDetails(booking));
  }

  getBookingHistoryByUserId(userId: string) {
    return this.testBookings
      .filter((booking) => booking.userId === userId && booking.status === 'booked')
      .map((booking) => this.toBookingDetails(booking));
  }

  removeCartBooking(bookingId: string) {
    const bookingIndex = this.testBookings.findIndex(
      (booking) => booking.id === bookingId && booking.status === 'cart',
    );
    if (bookingIndex === -1) {
      throw new BadRequestException('Cart test not found');
    }

    const [removedBooking] = this.testBookings.splice(bookingIndex, 1);
    const hasRemainingCartBookings = this.testBookings.some(
      (booking) => booking.userId === removedBooking.userId && booking.status === 'cart',
    );
    if (!hasRemainingCartBookings) {
      this.activeCartIds.delete(removedBooking.userId);
    }

    this.persistState();
    return this.toBookingDetails(removedBooking);
  }

  private findTestById(id: string): LabTest | undefined {
    if (!id) return undefined;
    const clean = id.trim().toLowerCase();
    const test = this.labTests.find((item) =>
      item.id.toLowerCase() === clean ||
      item.name.toLowerCase() === clean ||
      item.name.toLowerCase().includes(clean) ||
      clean.includes(item.id.toLowerCase())
    );
    if (test) return { ...test };

    return {
      id: id.trim(),
      name: id.trim(),
      price: 500,
      category: 'General',
      description: 'Diagnostic laboratory screening.',
    };
  }

  private toBookingDetails(booking: TestBooking) {
    const labTest = this.findTestById(booking.labTestId);
    if (!labTest) {
      throw new BadRequestException('Lab test not found');
    }

    return {
      ...booking,
      labTest,
    };
  }

  private getOrCreateActiveCartId(userId: string) {
    const existingCartBooking = this.testBookings.find(
      (booking) => booking.userId === userId && booking.status === 'cart',
    );
    if (existingCartBooking) {
      this.activeCartIds.set(userId, existingCartBooking.cartId);
      return existingCartBooking.cartId;
    }

    const existingCartId = this.activeCartIds.get(userId);
    if (existingCartId) {
      return existingCartId;
    }

    const cartId = `LABCART${Date.now()}`;
    this.activeCartIds.set(userId, cartId);
    return cartId;
  }

  private loadPersistedState() {
    try {
      if (!existsSync(LABTESTS_DATA_FILE)) {
        return;
      }

      const saved = JSON.parse(readFileSync(LABTESTS_DATA_FILE, 'utf8')) as Partial<LabTestsState>;
      if (Array.isArray(saved.testBookings)) {
        this.testBookings = saved.testBookings;
      }
    } catch (_) {}
  }

  private persistState() {
    mkdirSync(dirname(LABTESTS_DATA_FILE), { recursive: true });
    writeFileSync(
      LABTESTS_DATA_FILE,
      JSON.stringify(
        {
          testBookings: this.testBookings,
        },
        null,
        2,
      ),
    );
  }
}
