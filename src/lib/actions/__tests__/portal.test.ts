import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────

// Mock Supabase server client
const mockGetUser = vi.fn();
const mockUpdateUser = vi.fn();
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
        updateUser: mockUpdateUser,
      },
    })
  ),
}));

// Mock DB
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockValues = vi.fn();
const mockSet = vi.fn();
const mockWhere = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return {
        values: (...vArgs: unknown[]) => {
          mockValues(...vArgs);
          return Promise.resolve();
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
const mockGetOwnerByUserId = vi.fn();
vi.mock("@/lib/db/queries/owners", () => ({
  getOwnerByUserId: (...args: unknown[]) => mockGetOwnerByUserId(...args),
}));

// ─── Helpers ──────────────────────────────────────────────────────────

const OWNER_USER_UUID = "00000000-0000-4000-8000-000000000001";
const OWNER_RECORD_UUID = "00000000-0000-4000-8000-000000000002";
const APT_UUID = "00000000-0000-4000-8000-000000000003";

const proprietaireSession = {
  data: {
    user: {
      id: OWNER_USER_UUID,
      app_metadata: { user_role: "proprietaire" },
    },
  },
  error: null,
};

const syndicSession = {
  data: {
    user: {
      id: OWNER_USER_UUID,
      app_metadata: { user_role: "syndic" },
    },
  },
  error: null,
};

const noSession = { data: { user: null }, error: { message: "not authenticated" } };

const ownerRecord = { id: OWNER_RECORD_UUID, apartmentId: APT_UUID };

// ─── Tests ────────────────────────────────────────────────────────────

const { updatePhone, changePassword } = await import(
  "@/lib/actions/portal"
);

// ─── updatePhone ──────────────────────────────────────────────────────

describe("updatePhone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(proprietaireSession);
    mockGetOwnerByUserId.mockResolvedValue(ownerRecord);
  });

  it("rejects invalid phone (too short)", async () => {
    const result = await updatePhone({ phone: "123" });
    expect(result.success).toBe(false);
  });

  it("rejects unauthenticated user", async () => {
    mockGetUser.mockResolvedValue(noSession);
    const result = await updatePhone({ phone: "0612345678" });
    expect(result).toEqual({ success: false, error: "Non authentifié" });
  });

  it("rejects syndic role", async () => {
    mockGetUser.mockResolvedValue(syndicSession);
    const result = await updatePhone({ phone: "0612345678" });
    expect(result).toEqual({ success: false, error: "Non authentifié" });
  });

  it("rejects proprietaire with no owner record", async () => {
    mockGetOwnerByUserId.mockResolvedValue(null);
    const result = await updatePhone({ phone: "0612345678" });
    expect(result).toEqual({
      success: false,
      error: "Propriétaire introuvable",
    });
  });

  it("updates phone successfully", async () => {
    const result = await updatePhone({ phone: "0612345678" });
    expect(result).toEqual({ success: true, data: null });
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ phone: "0612345678" })
    );
  });

  it("clears phone when empty string is passed", async () => {
    const result = await updatePhone({ phone: "" });
    expect(result).toEqual({ success: true, data: null });
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ phone: null })
    );
  });

  it("writes audit log with UPDATE_OWNER action", async () => {
    await updatePhone({ phone: "0612345678" });
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "UPDATE_OWNER",
        entityType: "owners",
        entityId: OWNER_RECORD_UUID,
      })
    );
  });
});

// ─── changePassword ───────────────────────────────────────────────────

describe("changePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(proprietaireSession);
    mockUpdateUser.mockResolvedValue({ data: { user: {} }, error: null });
  });

  it("rejects mismatched passwords", async () => {
    const result = await changePassword({
      password: "securePass1",
      confirmPassword: "differentPass",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unauthenticated user", async () => {
    mockGetUser.mockResolvedValue(noSession);
    const result = await changePassword({
      password: "securePass1",
      confirmPassword: "securePass1",
    });
    expect(result).toEqual({ success: false, error: "Non authentifié" });
  });

  it("rejects syndic role", async () => {
    mockGetUser.mockResolvedValue(syndicSession);
    const result = await changePassword({
      password: "securePass1",
      confirmPassword: "securePass1",
    });
    expect(result).toEqual({ success: false, error: "Non authentifié" });
  });

  it("returns error when Supabase auth.updateUser fails", async () => {
    mockUpdateUser.mockResolvedValue({
      data: null,
      error: { message: "Password too weak" },
    });
    const result = await changePassword({
      password: "securePass1",
      confirmPassword: "securePass1",
    });
    expect(result).toEqual({
      success: false,
      error: "Password too weak",
    });
  });

  it("changes password successfully", async () => {
    const result = await changePassword({
      password: "securePass1",
      confirmPassword: "securePass1",
    });
    expect(result).toEqual({ success: true, data: null });
    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: "securePass1",
    });
  });
});
