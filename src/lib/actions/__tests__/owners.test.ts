import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Constants with valid v4 UUIDs ────────────────────────────────────
const SYNDIC_ID = "a1111111-1111-4111-8111-111111111111";
const BUILDING_ID = "b2222222-2222-4222-8222-222222222222";
const APT_1_ID = "c3333333-3333-4333-8333-333333333333";
const APT_2_ID = "d4444444-4444-4444-8444-444444444444";
const OWNER_ID = "e5555555-5555-4555-8555-555555555555";
const USER_ID = "f6666666-6666-4666-8666-666666666666";
const NEW_AUTH_ID = "a7777777-7777-4777-8777-777777777777";

// ─── Mocks ────────────────────────────────────────────────────────────

const mockGetUser = vi.fn();
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
    })
  ),
}));

const mockCreateUser = vi.fn();
const mockDeleteUser = vi.fn();
vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    auth: {
      admin: {
        createUser: mockCreateUser,
        deleteUser: mockDeleteUser,
      },
    },
  })),
}));

const mockSendEmail = vi.fn().mockResolvedValue({ success: true });
vi.mock("@/lib/email/send-email", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock("@/lib/email/templates/welcome", () => ({
  WelcomeEmail: vi.fn(() => null),
}));

// Track DB calls using direct schema reference comparison
import {
  owners as ownersTable,
  users as usersTable,
  apartments as apartmentsTable,
  auditLogs as auditLogsTable,
} from "@/lib/db/schema";

const insertCalls: Array<{ table: unknown; values: unknown }> = [];
const updateCalls: Array<{ table: unknown; setData: unknown }> = [];

function tableName(ref: unknown): string {
  if (ref === usersTable) return "users";
  if (ref === ownersTable) return "owners";
  if (ref === apartmentsTable) return "apartments";
  if (ref === auditLogsTable) return "audit_logs";
  return "unknown";
}

vi.mock("@/lib/db", () => ({
  db: {
    insert: (table: unknown) => ({
      values: (vals: unknown) => {
        insertCalls.push({ table, values: vals });
        return {
          returning: () => [{ id: OWNER_ID }],
        };
      },
    }),
    update: (table: unknown) => ({
      set: (data: unknown) => {
        updateCalls.push({ table, setData: data });
        return {
          where: () => Promise.resolve(),
        };
      },
    }),
  },
}));

const mockGetBuildingBySyndicId = vi.fn();
vi.mock("@/lib/db/queries/buildings", () => ({
  getBuildingBySyndicId: (...args: unknown[]) =>
    mockGetBuildingBySyndicId(...args),
}));

const mockGetApartmentById = vi.fn();
vi.mock("@/lib/db/queries/apartments", () => ({
  getApartmentById: (...args: unknown[]) => mockGetApartmentById(...args),
}));

const mockGetOwnerById = vi.fn();
vi.mock("@/lib/db/queries/owners", () => ({
  getOwnerById: (...args: unknown[]) => mockGetOwnerById(...args),
}));

// ─── Helpers ──────────────────────────────────────────────────────────

const syndicSession = {
  data: {
    user: { id: SYNDIC_ID, app_metadata: { user_role: "syndic" } },
  },
  error: null,
};

const noSession = { data: { user: null }, error: { message: "not authenticated" } };

const building = { id: BUILDING_ID };

const vacantApartment = {
  id: APT_1_ID,
  buildingId: BUILDING_ID,
  status: "vacant",
};

const validOwnerInput = {
  firstName: "Mohamed",
  lastName: "El Amrani",
  email: "mohamed@example.com",
  phone: "+212600000000",
  apartmentId: APT_1_ID,
  ownershipDate: "2024-01-15",
};

const existingOwner = {
  id: OWNER_ID,
  userId: USER_ID,
  apartmentId: APT_1_ID,
  ownershipDate: new Date("2024-01-15"),
  firstName: "Mohamed",
  lastName: "El Amrani",
  email: "mohamed@example.com",
  phone: "+212600000000",
  unitNumber: "A101",
};

// ─── Import after mocks ──────────────────────────────────────────────

const { createOwner, updateOwner, deleteOwner } = await import(
  "@/lib/actions/owners"
);

// ─── Tests ────────────────────────────────────────────────────────────

describe("createOwner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertCalls.length = 0;
    updateCalls.length = 0;
    mockGetUser.mockResolvedValue(syndicSession);
    mockGetBuildingBySyndicId.mockResolvedValue(building);
    mockGetApartmentById.mockResolvedValue(vacantApartment);
    mockCreateUser.mockResolvedValue({
      data: { user: { id: NEW_AUTH_ID } },
      error: null,
    });
  });

  it("creates auth user, inserts users + owners, writes CREATE_OWNER audit", async () => {
    const result = await createOwner(validOwnerInput);
    expect(result).toEqual({
      success: true,
      data: { id: OWNER_ID },
    });
    expect(mockCreateUser).toHaveBeenCalledTimes(1);

    // Check insert calls
    const usersInsert = insertCalls.find((c) => tableName(c.table) === "users");
    expect(usersInsert).toBeDefined();

    const ownersInsert = insertCalls.find((c) => tableName(c.table) === "owners");
    expect(ownersInsert).toBeDefined();

    const auditInsert = insertCalls.find((c) => tableName(c.table) === "audit_logs");
    expect(auditInsert).toBeDefined();
    expect(auditInsert!.values).toEqual(
      expect.objectContaining({ action: "CREATE_OWNER" })
    );
  });

  it("sets apartment status to occupied on owner creation", async () => {
    await createOwner(validOwnerInput);
    const aptUpdate = updateCalls.find((c) => tableName(c.table) === "apartments");
    expect(aptUpdate).toBeDefined();
    expect(aptUpdate!.setData).toEqual(
      expect.objectContaining({ status: "occupied" })
    );
  });

  it("rejects unauthenticated users", async () => {
    mockGetUser.mockResolvedValue(noSession);
    const result = await createOwner(validOwnerInput);
    expect(result).toEqual({ success: false, error: "Non authentifié" });
  });

  it("rejects invalid input", async () => {
    const result = await createOwner({ firstName: "" });
    expect(result.success).toBe(false);
  });
});

describe("updateOwner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertCalls.length = 0;
    updateCalls.length = 0;
    mockGetUser.mockResolvedValue(syndicSession);
    mockGetBuildingBySyndicId.mockResolvedValue(building);
    mockGetOwnerById.mockResolvedValue(existingOwner);
    mockGetApartmentById.mockResolvedValue(vacantApartment);
  });

  it("updates user fields and writes UPDATE_OWNER audit", async () => {
    const result = await updateOwner(OWNER_ID, {
      ...validOwnerInput,
      firstName: "Ahmed",
    });
    expect(result).toEqual({ success: true, data: null });

    const usersUpdate = updateCalls.find((c) => tableName(c.table) === "users");
    expect(usersUpdate).toBeDefined();
    expect(usersUpdate!.setData).toEqual(
      expect.objectContaining({ firstName: "Ahmed" })
    );

    const auditInsert = insertCalls.find((c) => tableName(c.table) === "audit_logs");
    expect(auditInsert).toBeDefined();
    expect(auditInsert!.values).toEqual(
      expect.objectContaining({ action: "UPDATE_OWNER", entityId: OWNER_ID })
    );
  });

  it("apartment reassignment: old → vacant, new → occupied", async () => {
    const result = await updateOwner(OWNER_ID, {
      ...validOwnerInput,
      apartmentId: APT_2_ID, // different from existing APT_1_ID
    });
    expect(result).toEqual({ success: true, data: null });

    const aptUpdates = updateCalls.filter((c) => tableName(c.table) === "apartments");
    expect(aptUpdates.length).toBe(2);
    const statuses = aptUpdates.map(
      (u) => (u.setData as { status: string }).status
    );
    expect(statuses).toContain("vacant");
    expect(statuses).toContain("occupied");
  });

  it("rejects when owner not found", async () => {
    mockGetOwnerById.mockResolvedValue(null);
    const result = await updateOwner("bad-id", validOwnerInput);
    expect(result.success).toBe(false);
  });
});

describe("deleteOwner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertCalls.length = 0;
    updateCalls.length = 0;
    mockGetUser.mockResolvedValue(syndicSession);
    mockGetOwnerById.mockResolvedValue(existingOwner);
  });

  it("soft-deletes owner and user, sets apartment to vacant", async () => {
    const result = await deleteOwner(OWNER_ID);
    expect(result).toEqual({ success: true, data: null });

    const ownerUpdate = updateCalls.find((c) => tableName(c.table) === "owners");
    expect(ownerUpdate).toBeDefined();
    expect(ownerUpdate!.setData).toEqual(
      expect.objectContaining({ deletedAt: expect.any(Date) })
    );

    const userUpdate = updateCalls.find((c) => tableName(c.table) === "users");
    expect(userUpdate).toBeDefined();
    expect(userUpdate!.setData).toEqual(
      expect.objectContaining({ deletedAt: expect.any(Date) })
    );

    const aptUpdate = updateCalls.find((c) => tableName(c.table) === "apartments");
    expect(aptUpdate).toBeDefined();
    expect(aptUpdate!.setData).toEqual(
      expect.objectContaining({ status: "vacant" })
    );
  });

  it("writes DELETE_OWNER audit log", async () => {
    await deleteOwner(OWNER_ID);
    const auditInsert = insertCalls.find((c) => tableName(c.table) === "audit_logs");
    expect(auditInsert).toBeDefined();
    expect(auditInsert!.values).toEqual(
      expect.objectContaining({
        action: "DELETE_OWNER",
        entityType: "owners",
        entityId: OWNER_ID,
      })
    );
  });

  it("rejects when owner not found", async () => {
    mockGetOwnerById.mockResolvedValue(null);
    const result = await deleteOwner("bad-id");
    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toBe(
      "Copropriétaire introuvable"
    );
  });

  it("rejects unauthenticated users", async () => {
    mockGetUser.mockResolvedValue(noSession);
    const result = await deleteOwner(OWNER_ID);
    expect(result).toEqual({ success: false, error: "Non authentifié" });
  });
});
