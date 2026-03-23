import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────

// Mock Supabase server client
const mockGetUser = vi.fn();
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
    })
  ),
}));

// Mock DB
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();
const mockSet = vi.fn();
const mockWhere = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return {
        values: (...vArgs: unknown[]) => {
          mockValues(...vArgs);
          return {
            returning: (...rArgs: unknown[]) => {
              mockReturning(...rArgs);
              return [{ id: "new-charge-id" }];
            },
          };
        },
      };
    },
    update: (...args: unknown[]) => {
      mockUpdate(...args);
      return {
        set: (...sArgs: unknown[]) => {
          mockSet(...sArgs);
          return {
            where: (...wArgs: unknown[]) => {
              mockWhere(...wArgs);
              return Promise.resolve();
            },
          };
        },
      };
    },
  },
}));

// Mock query helpers
const mockGetBuildingBySyndicId = vi.fn();
const mockGetBuildingById = vi.fn();
vi.mock("@/lib/db/queries/buildings", () => ({
  getBuildingBySyndicId: (...args: unknown[]) =>
    mockGetBuildingBySyndicId(...args),
  getBuildingById: (...args: unknown[]) => mockGetBuildingById(...args),
}));

const mockGetApartmentById = vi.fn();
vi.mock("@/lib/db/queries/apartments", () => ({
  getApartmentById: (...args: unknown[]) => mockGetApartmentById(...args),
}));

const mockGetChargeById = vi.fn();
vi.mock("@/lib/db/queries/charges", () => ({
  getChargeById: (...args: unknown[]) => mockGetChargeById(...args),
}));

const mockGetOwnerByApartmentId = vi.fn();
const mockGetOwnerById = vi.fn();
const mockGetOwnerByUserId = vi.fn();
vi.mock("@/lib/db/queries/owners", () => ({
  getOwnerByApartmentId: (...args: unknown[]) =>
    mockGetOwnerByApartmentId(...args),
  getOwnerById: (...args: unknown[]) => mockGetOwnerById(...args),
  getOwnerByUserId: (...args: unknown[]) => mockGetOwnerByUserId(...args),
}));

// Mock email sender
const mockSendEmail = vi.fn().mockResolvedValue({ success: true });
vi.mock("@/lib/email/send-email", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

// Mock PDF render
vi.mock("@/lib/pdf/payment-notice", () => ({
  renderPaymentNotice: vi.fn(() =>
    Promise.resolve(Buffer.from("fake-pdf-content"))
  ),
}));

// ─── Helpers ──────────────────────────────────────────────────────────

const SYNDIC_UUID = "00000000-0000-4000-8000-000000000001";
const BUILDING_UUID = "00000000-0000-4000-8000-000000000010";
const APT_UUID = "00000000-0000-4000-8000-000000000004";
const OWNER_USER_UUID = "00000000-0000-4000-8000-000000000050";
const OWNER_RECORD_UUID = "00000000-0000-4000-8000-000000000051";

const syndicSession = {
  data: {
    user: { id: SYNDIC_UUID, app_metadata: { user_role: "syndic" } },
  },
  error: null,
};

const noSession = { data: { user: null }, error: { message: "not authenticated" } };

const proprietaireSession = {
  data: {
    user: {
      id: OWNER_USER_UUID,
      app_metadata: { user_role: "proprietaire" },
    },
  },
  error: null,
};

const building = { id: BUILDING_UUID, name: "Résidence Oliviers", address: "12 Rue Test" };
const apartment = { id: APT_UUID, buildingId: BUILDING_UUID, unitNumber: "A101", floor: 1 };

const validInput = {
  title: "Électricité Q1 2026",
  description: "Facture trimestrielle",
  category: "electricity",
  totalAmount: 1500,
  dueDate: "2026-03-15",
  apartmentId: APT_UUID,
};

const chargeWithRemainder = {
  id: "00000000-0000-4000-8000-000000000020",
  syndicId: SYNDIC_UUID,
  apartmentId: APT_UUID,
  title: "Électricité Q1 2026",
  description: null,
  category: "electricity",
  totalAmount: "1500.00",
  dueDate: "2026-03-15",
  lastReminderSentAt: null,
  createdAt: new Date(),
  amountPaid: "500.00",
  remainingAmount: "1000.00",
  status: "partial",
};

const ownerRecord = { id: "owner-uuid" };
const ownerDetails = {
  id: "owner-uuid",
  firstName: "Jean",
  lastName: "Dupont",
  email: "jean@example.com",
  phone: null,
};

// ─── Tests ────────────────────────────────────────────────────────────

const { createCharge, deleteCharge, sendPaymentReminder, downloadPaymentNotice } = await import(
  "@/lib/actions/charges"
);

describe("createCharge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(syndicSession);
    mockGetBuildingBySyndicId.mockResolvedValue(building);
    mockGetApartmentById.mockResolvedValue(apartment);
  });

  it("inserts charge and returns success with id", async () => {
    const result = await createCharge(validInput);
    expect(result).toEqual({
      success: true,
      data: { id: "new-charge-id" },
    });
    expect(mockInsert).toHaveBeenCalledTimes(2); // charge + audit
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Électricité Q1 2026",
        totalAmount: "1500",
      })
    );
  });

  it("writes CREATE_CHARGE audit log", async () => {
    await createCharge(validInput);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CREATE_CHARGE",
        entityType: "charges",
        entityId: "new-charge-id",
      })
    );
  });

  it("rejects invalid input", async () => {
    const result = await createCharge({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects unauthenticated users", async () => {
    mockGetUser.mockResolvedValue(noSession);
    const result = await createCharge(validInput);
    expect(result).toEqual({ success: false, error: "Non authentifié" });
  });

  it("rejects when apartment not found", async () => {
    mockGetApartmentById.mockResolvedValue(null);
    const result = await createCharge(validInput);
    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toBe(
      "Appartement introuvable"
    );
  });
});

describe("deleteCharge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(syndicSession);
    mockGetChargeById.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000020",
      syndicId: SYNDIC_UUID,
    });
  });

  it("soft-deletes charge by setting deletedAt", async () => {
    const result = await deleteCharge("00000000-0000-4000-8000-000000000020");
    expect(result).toEqual({ success: true, data: null });
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        deletedAt: expect.any(Date),
      })
    );
  });

  it("writes DELETE_CHARGE audit log", async () => {
    await deleteCharge("00000000-0000-4000-8000-000000000020");
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "DELETE_CHARGE",
        entityType: "charges",
        entityId: "00000000-0000-4000-8000-000000000020",
      })
    );
  });

  it("rejects unauthenticated users", async () => {
    mockGetUser.mockResolvedValue(noSession);
    const result = await deleteCharge("00000000-0000-4000-8000-000000000020");
    expect(result).toEqual({ success: false, error: "Non authentifié" });
  });

  it("rejects when charge not found", async () => {
    mockGetChargeById.mockResolvedValue(null);
    const result = await deleteCharge("00000000-0000-4000-8000-000000000020");
    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toBe(
      "Charge introuvable"
    );
  });
});

describe("sendPaymentReminder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(syndicSession);
    mockGetChargeById.mockResolvedValue(chargeWithRemainder);
    mockGetOwnerByApartmentId.mockResolvedValue(ownerRecord);
    mockGetOwnerById.mockResolvedValue(ownerDetails);
    mockGetBuildingBySyndicId.mockResolvedValue(building);
  });

  it("sends payment reminder email", async () => {
    const result = await sendPaymentReminder("00000000-0000-4000-8000-000000000020");
    expect(result).toEqual({ success: true, data: null });
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "jean@example.com",
        subject: expect.stringContaining("Rappel de paiement"),
      })
    );
  });

  it("updates last_reminder_sent_at", async () => {
    await sendPaymentReminder("00000000-0000-4000-8000-000000000020");
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        lastReminderSentAt: expect.any(Date),
      })
    );
  });

  it("writes SEND_REMINDER audit log", async () => {
    await sendPaymentReminder("00000000-0000-4000-8000-000000000020");
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "SEND_REMINDER",
        entityType: "charges",
        entityId: "00000000-0000-4000-8000-000000000020",
      })
    );
  });

  it("rejects when charge is already paid", async () => {
    mockGetChargeById.mockResolvedValue({
      ...chargeWithRemainder,
      remainingAmount: "0",
      status: "paid",
    });
    const result = await sendPaymentReminder("00000000-0000-4000-8000-000000000020");
    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toBe(
      "Cette charge est déjà payée"
    );
  });
});

describe("downloadPaymentNotice — proprietaire", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(proprietaireSession);
    mockGetChargeById.mockResolvedValue(chargeWithRemainder);
    mockGetOwnerByUserId.mockResolvedValue({
      id: OWNER_RECORD_UUID,
      apartmentId: APT_UUID,
    });
    mockGetApartmentById.mockResolvedValue(apartment);
    mockGetOwnerByApartmentId.mockResolvedValue(ownerRecord);
    mockGetOwnerById.mockResolvedValue(ownerDetails);
    mockGetBuildingById.mockResolvedValue(building);
  });

  it("downloads notice for own apartment charge", async () => {
    const result = await downloadPaymentNotice(chargeWithRemainder.id);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filename).toContain("avis-paiement");
      expect(result.data.buffer).toBeTruthy();
    }
  });

  it("rejects download for another apartment charge", async () => {
    mockGetOwnerByUserId.mockResolvedValue({
      id: OWNER_RECORD_UUID,
      apartmentId: "00000000-0000-4000-8000-000000000099", // different apartment
    });
    const result = await downloadPaymentNotice(chargeWithRemainder.id);
    expect(result).toEqual({ success: false, error: "Accès refusé" });
  });
});
