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
const mockSet = vi.fn();
const mockWhere = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return {
        values: (...vArgs: unknown[]) => {
          mockValues(...vArgs);
          return { returning: () => [{ id: "inv-id" }] };
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
    select: () => ({
      from: () => ({
        where: () =>
          Promise.resolve([
            { id: OWNER_UUID, apartmentId: "apt-1" },
          ]),
      }),
    }),
  },
}));

// Mock query helpers — notifications
const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();
vi.mock("@/lib/db/queries/notifications", () => ({
  markAsRead: (...args: unknown[]) => mockMarkAsRead(...args),
  markAllAsRead: (...args: unknown[]) => mockMarkAllAsRead(...args),
}));

// ─── Helpers ──────────────────────────────────────────────────────────

const OWNER_USER_UUID = "00000000-0000-4000-8000-000000000050";
const OWNER_UUID = "00000000-0000-4000-8000-000000000020";
const INVITATION_UUID = "00000000-0000-4000-8000-000000000060";

const ownerSession = {
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
      id: "syndic-uuid",
      app_metadata: { user_role: "syndic" },
    },
  },
  error: null,
};

const noSession = { data: { user: null }, error: { message: "not authenticated" } };

// We need to mock the raw DB select that respondToInvitation uses for invitation lookup
// The action does two selects: first for owner record, then for invitation
let selectCallCount = 0;

const invitedInvitation = {
  id: INVITATION_UUID,
  ownerId: OWNER_UUID,
  meetingId: "meeting-1",
  status: "invited",
  respondedAt: null,
};

const alreadyRespondedInvitation = {
  ...invitedInvitation,
  status: "accepted",
};

// Override the select mock to handle multiple calls
vi.mock("@/lib/db", async () => {
  return {
    db: {
      insert: (...args: unknown[]) => {
        mockInsert(...args);
        return {
          values: (...vArgs: unknown[]) => {
            mockValues(...vArgs);
            return { returning: () => [{ id: "inv-id" }] };
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
      select: () => {
        selectCallCount++;
        return {
          from: () => ({
            where: () => {
              // First call: owner record, Second call: invitation
              if (selectCallCount % 2 === 1) {
                return Promise.resolve([
                  { id: OWNER_UUID, apartmentId: "apt-1" },
                ]);
              }
              return Promise.resolve([invitedInvitation]);
            },
          }),
        };
      },
    },
  };
});

// ─── Tests ────────────────────────────────────────────────────────────

const {
  respondToInvitation,
  markNotificationRead,
  markAllNotificationsRead,
} = await import("@/lib/actions/notifications");

describe("respondToInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCallCount = 0;
    mockGetUser.mockResolvedValue(ownerSession);
  });

  it("accepts an invitation and writes audit log", async () => {
    const result = await respondToInvitation({
      invitationId: INVITATION_UUID,
      response: "accepted",
    });
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "accepted",
        respondedAt: expect.any(Date),
      })
    );
    // Audit log
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "RESPOND_INVITATION",
        entityType: "meeting_invitations",
      })
    );
  });

  it("declines an invitation", async () => {
    const result = await respondToInvitation({
      invitationId: INVITATION_UUID,
      response: "declined",
    });
    expect(result.success).toBe(true);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "declined" })
    );
  });

  it("rejects unauthenticated users", async () => {
    mockGetUser.mockResolvedValue(noSession);
    const result = await respondToInvitation({
      invitationId: INVITATION_UUID,
      response: "accepted",
    });
    expect(result).toEqual({ success: false, error: "Non authentifié" });
  });

  it("rejects syndic role", async () => {
    mockGetUser.mockResolvedValue(syndicSession);
    const result = await respondToInvitation({
      invitationId: INVITATION_UUID,
      response: "accepted",
    });
    expect(result).toEqual({ success: false, error: "Accès refusé" });
  });

  it("rejects invalid input", async () => {
    const result = await respondToInvitation({
      invitationId: "not-a-uuid",
      response: "maybe",
    });
    expect(result.success).toBe(false);
  });
});

describe("markNotificationRead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(ownerSession);
  });

  it("marks a notification as read", async () => {
    const result = await markNotificationRead("notif-1");
    expect(result).toEqual({ success: true, data: null });
    expect(mockMarkAsRead).toHaveBeenCalledWith("notif-1", OWNER_USER_UUID);
  });

  it("rejects unauthenticated users", async () => {
    mockGetUser.mockResolvedValue(noSession);
    const result = await markNotificationRead("notif-1");
    expect(result).toEqual({ success: false, error: "Non authentifié" });
  });
});

describe("markAllNotificationsRead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(ownerSession);
  });

  it("marks all notifications as read", async () => {
    const result = await markAllNotificationsRead();
    expect(result).toEqual({ success: true, data: null });
    expect(mockMarkAllAsRead).toHaveBeenCalledWith(OWNER_USER_UUID);
  });
});
