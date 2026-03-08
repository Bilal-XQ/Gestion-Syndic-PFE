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

// Mock DB with transaction support
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();
const mockTransaction = vi.fn();

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
              return [{ id: "new-payment-id" }];
            },
          };
        },
      };
    },
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

// Mock query helpers
const mockGetChargeById = vi.fn();
vi.mock("@/lib/db/queries/charges", () => ({
  getChargeById: (...args: unknown[]) => mockGetChargeById(...args),
}));

const mockGetOwnerByUserId = vi.fn();
vi.mock("@/lib/db/queries/owners", () => ({
  getOwnerByUserId: (...args: unknown[]) => mockGetOwnerByUserId(...args),
}));

// ─── Helpers ──────────────────────────────────────────────────────────

// Use valid UUIDs because Zod validates them
const SYNDIC_UUID = "00000000-0000-4000-8000-000000000001";
const OWNER_UUID = "00000000-0000-4000-8000-000000000002";
const CHARGE_UUID = "00000000-0000-4000-8000-000000000003";
const APT_UUID = "00000000-0000-4000-8000-000000000004";

const syndicSession = {
  data: {
    user: { id: SYNDIC_UUID, app_metadata: { user_role: "syndic" } },
  },
  error: null,
};

const proprietaireSession = {
  data: {
    user: {
      id: OWNER_UUID,
      app_metadata: { user_role: "proprietaire" },
    },
  },
  error: null,
};

const noSession = { data: { user: null }, error: { message: "not authenticated" } };

const validInput = {
  chargeId: CHARGE_UUID,
  ownerId: OWNER_UUID,
  amount: 500,
  paymentDate: "2026-03-01",
  method: "bank_transfer",
  reference: "REF-001",
  notes: "Partial payment",
};

const chargeWithRemainder = {
  id: CHARGE_UUID,
  syndicId: SYNDIC_UUID,
  apartmentId: APT_UUID,
  title: "Électricité Q1 2026",
  totalAmount: "1500.00",
  dueDate: "2026-03-15",
  amountPaid: "500.00",
  remainingAmount: "1000.00",
  status: "partial",
};

const fullyPaidCharge = {
  ...chargeWithRemainder,
  amountPaid: "1500.00",
  remainingAmount: "0",
  status: "paid",
};

// ─── Tests ────────────────────────────────────────────────────────────

const { createPayment } = await import("@/lib/actions/payments");

describe("createPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(syndicSession);
    mockGetChargeById.mockResolvedValue(chargeWithRemainder);
    // transaction mock: execute the callback with a fake tx, then return the result
    mockTransaction.mockImplementation(async (cb: Function) => {
      const tx = {
        insert: (...args: unknown[]) => {
          mockInsert(...args);
          return {
            values: (...vArgs: unknown[]) => {
              mockValues(...vArgs);
              return {
                returning: (...rArgs: unknown[]) => {
                  mockReturning(...rArgs);
                  return [{ id: "new-payment-id" }];
                },
              };
            },
          };
        },
      };
      return cb(tx);
    });
  });

  it("wraps insert in db.transaction() and returns success", async () => {
    const result = await createPayment(validInput);
    expect(result).toEqual({
      success: true,
      data: { id: "new-payment-id" },
    });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        chargeId: CHARGE_UUID,
        amount: "500",
      })
    );
  });

  it("writes CREATE_PAYMENT audit log with db (not tx)", async () => {
    await createPayment(validInput);
    // Audit log is the second insert call (after transaction)
    expect(mockInsert).toHaveBeenCalledTimes(2); // tx.insert + db.insert (audit)
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CREATE_PAYMENT",
        entityType: "payments",
        entityId: "new-payment-id",
      })
    );
  });

  it("rejects when amount exceeds remaining balance", async () => {
    const result = await createPayment({
      ...validInput,
      amount: 2000, // exceeds 1000 remaining
    });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toBe(
      "Le montant dépasse le solde restant"
    );
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejects when charge is already fully paid", async () => {
    mockGetChargeById.mockResolvedValue(fullyPaidCharge);
    const result = await createPayment(validInput);
    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toBe(
      "Cette charge est déjà payée"
    );
  });

  it("transaction rollback prevents audit log", async () => {
    mockTransaction.mockRejectedValue(new Error("DB error"));
    try {
      await createPayment(validInput);
    } catch {
      // Expected to throw
    }
    // Audit log insert should NOT have been called outside transaction
    // mockInsert from the db.insert(auditLogs) should not occur
    // since the transaction threw before reaching that line
    const auditCalls = mockValues.mock.calls.filter(
      (call) =>
        call[0] &&
        typeof call[0] === "object" &&
        "action" in (call[0] as Record<string, unknown>) &&
        (call[0] as Record<string, unknown>).action === "CREATE_PAYMENT"
    );
    expect(auditCalls).toHaveLength(0);
  });

  it("rejects invalid input with Zod error", async () => {
    const result = await createPayment({ chargeId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects unauthenticated users", async () => {
    mockGetUser.mockResolvedValue(noSession);
    const result = await createPayment(validInput);
    expect(result).toEqual({ success: false, error: "Non authentifié" });
  });

  it("allows proprietaire role to create payment", async () => {
    mockGetUser.mockResolvedValue(proprietaireSession);
    mockGetOwnerByUserId.mockResolvedValue({
      id: OWNER_UUID,
      apartmentId: APT_UUID,
    });
    const result = await createPayment(validInput);
    expect(result).toEqual({
      success: true,
      data: { id: "new-payment-id" },
    });
  });
});

describe("createPayment — IDOR fix", () => {
  const OTHER_OWNER_UUID = "00000000-0000-4000-8000-000000000099";
  const OTHER_APT_UUID = "00000000-0000-4000-8000-000000000098";

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(proprietaireSession);
    mockGetChargeById.mockResolvedValue(chargeWithRemainder);
    mockTransaction.mockImplementation(async (cb: Function) => {
      const tx = {
        insert: (...args: unknown[]) => {
          mockInsert(...args);
          return {
            values: (...vArgs: unknown[]) => {
              mockValues(...vArgs);
              return {
                returning: (...rArgs: unknown[]) => {
                  mockReturning(...rArgs);
                  return [{ id: "new-payment-id" }];
                },
              };
            },
          };
        },
      };
      return cb(tx);
    });
  });

  it("proprietaire: overrides client-submitted ownerId with server-resolved ownerId", async () => {
    mockGetOwnerByUserId.mockResolvedValue({
      id: OWNER_UUID,
      apartmentId: APT_UUID,
    });
    // Submit with a different ownerId — server should override
    const input = { ...validInput, ownerId: OTHER_OWNER_UUID };
    const result = await createPayment(input);
    expect(result.success).toBe(true);
    // Verify the insert used the server-resolved ownerId, not the submitted one
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: OWNER_UUID })
    );
  });

  it("proprietaire: rejects payment for charge not belonging to their apartment", async () => {
    mockGetOwnerByUserId.mockResolvedValue({
      id: OWNER_UUID,
      apartmentId: OTHER_APT_UUID, // Different apartment than the charge
    });
    const result = await createPayment(validInput);
    expect(result).toEqual({ success: false, error: "Accès refusé" });
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});

describe("payments module exports", () => {
  it("does not export updatePayment or deletePayment", async () => {
    const mod = await import("@/lib/actions/payments");
    expect(mod).not.toHaveProperty("updatePayment");
    expect(mod).not.toHaveProperty("deletePayment");
  });
});
