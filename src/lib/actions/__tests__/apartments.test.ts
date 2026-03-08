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
              return [{ id: "new-apartment-id" }];
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
vi.mock("@/lib/db/queries/buildings", () => ({
  getBuildingBySyndicId: (...args: unknown[]) =>
    mockGetBuildingBySyndicId(...args),
}));

const mockGetApartmentById = vi.fn();
vi.mock("@/lib/db/queries/apartments", () => ({
  getApartmentById: (...args: unknown[]) => mockGetApartmentById(...args),
}));

const mockGetOwnerByApartmentId = vi.fn();
vi.mock("@/lib/db/queries/owners", () => ({
  getOwnerByApartmentId: (...args: unknown[]) =>
    mockGetOwnerByApartmentId(...args),
}));

// ─── Helpers ──────────────────────────────────────────────────────────

const syndicSession = {
  data: {
    user: { id: "syndic-uuid", app_metadata: { user_role: "syndic" } },
  },
  error: null,
};

const ownerSession = {
  data: {
    user: {
      id: "owner-uuid",
      app_metadata: { user_role: "proprietaire" },
    },
  },
  error: null,
};

const noSession = { data: { user: null }, error: { message: "not authenticated" } };

const validInput = {
  unitNumber: "A101",
  floor: 1,
  surfaceArea: 75,
  roomCount: 3,
};

const building = { id: "building-uuid" };
const existingApartment = {
  id: "apt-uuid",
  buildingId: "building-uuid",
  unitNumber: "A101",
  floor: 1,
  surfaceArea: "75",
  roomCount: 3,
  status: "vacant",
};

// ─── Tests ────────────────────────────────────────────────────────────

// Import after mocks
const { createApartment, updateApartment, deleteApartment } = await import(
  "@/lib/actions/apartments"
);

describe("createApartment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(syndicSession);
    mockGetBuildingBySyndicId.mockResolvedValue(building);
  });

  it("inserts with correct values and default status vacant", async () => {
    const result = await createApartment(validInput);
    expect(result).toEqual({
      success: true,
      data: { id: "new-apartment-id" },
    });
    // Verify audit log was written
    expect(mockInsert).toHaveBeenCalledTimes(2); // apartment + audit
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ status: "vacant", unitNumber: "A101" })
    );
  });

  it("writes CREATE_APARTMENT audit log", async () => {
    await createApartment(validInput);
    // Second insert call is the audit log
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CREATE_APARTMENT",
        entityType: "apartments",
      })
    );
  });

  it("rejects invalid input", async () => {
    const result = await createApartment({ unitNumber: "" });
    expect(result.success).toBe(false);
  });

  it("rejects unauthenticated users", async () => {
    mockGetUser.mockResolvedValue(noSession);
    const result = await createApartment(validInput);
    expect(result).toEqual({ success: false, error: "Non authentifié" });
  });

  it("rejects non-syndic users", async () => {
    mockGetUser.mockResolvedValue(ownerSession);
    const result = await createApartment(validInput);
    expect(result).toEqual({ success: false, error: "Accès refusé" });
  });
});

describe("updateApartment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(syndicSession);
    mockGetBuildingBySyndicId.mockResolvedValue(building);
    mockGetApartmentById.mockResolvedValue(existingApartment);
  });

  it("updates allowed fields and writes UPDATE_APARTMENT audit log", async () => {
    const result = await updateApartment("apt-uuid", {
      ...validInput,
      unitNumber: "A102",
    });
    expect(result).toEqual({ success: true, data: null });
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ unitNumber: "A102" })
    );
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "UPDATE_APARTMENT",
        entityType: "apartments",
        entityId: "apt-uuid",
      })
    );
  });

  it("rejects when apartment not found", async () => {
    mockGetApartmentById.mockResolvedValue(null);
    const result = await updateApartment("bad-id", validInput);
    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toBe(
      "Appartement introuvable"
    );
  });

  it("rejects non-syndic users", async () => {
    mockGetUser.mockResolvedValue(ownerSession);
    const result = await updateApartment("apt-uuid", validInput);
    expect(result).toEqual({ success: false, error: "Accès refusé" });
  });
});

describe("deleteApartment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(syndicSession);
    mockGetBuildingBySyndicId.mockResolvedValue(building);
    mockGetApartmentById.mockResolvedValue(existingApartment);
    mockGetOwnerByApartmentId.mockResolvedValue(null);
  });

  it("soft-deletes apartment when no active owner", async () => {
    const result = await deleteApartment("apt-uuid");
    expect(result).toEqual({ success: true, data: null });
    // Should set deletedAt
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        deletedAt: expect.any(Date),
      })
    );
  });

  it("writes DELETE_APARTMENT audit log", async () => {
    await deleteApartment("apt-uuid");
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "DELETE_APARTMENT",
        entityType: "apartments",
        entityId: "apt-uuid",
      })
    );
  });

  it("rejects if active owner is assigned", async () => {
    mockGetOwnerByApartmentId.mockResolvedValue({ id: "owner-id" });
    const result = await deleteApartment("apt-uuid");
    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toContain(
      "copropriétaire actif"
    );
  });

  it("rejects unauthenticated users", async () => {
    mockGetUser.mockResolvedValue(noSession);
    const result = await deleteApartment("apt-uuid");
    expect(result).toEqual({ success: false, error: "Non authentifié" });
  });
});
