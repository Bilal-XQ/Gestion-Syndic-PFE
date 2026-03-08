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

// Mock DB — transaction + standard insert/update/select
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();
const mockSet = vi.fn();
const mockWhere = vi.fn();

let txInsertFn: typeof mockInsert;
let insertCallCount = 0;

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
              return [{ id: "new-meeting-id" }];
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
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return {
        from: () => ({
          innerJoin: () => ({
            where: () =>
              Promise.resolve([
                {
                  id: OWNER_UUID_1,
                  userId: USER_UUID_1,
                  apartmentId: APT_UUID,
                },
              ]),
          }),
        }),
      };
    },
    transaction: async (fn: (tx: unknown) => Promise<void>) => {
      insertCallCount = 0;
      txInsertFn = vi.fn();
      const tx = {
        insert: (...args: unknown[]) => {
          txInsertFn(...args);
          return {
            values: (...vArgs: unknown[]) => {
              mockValues(...vArgs);
              insertCallCount++;
              return {
                returning: () => {
                  if (insertCallCount === 1)
                    return [{ id: "new-meeting-id" }];
                  return [{ id: `invitation-${insertCallCount}` }];
                },
              };
            },
          };
        },
      };
      await fn(tx);
    },
  },
}));

// Mock query helpers
const mockGetBuildingBySyndicId = vi.fn();
vi.mock("@/lib/db/queries/buildings", () => ({
  getBuildingBySyndicId: (...args: unknown[]) =>
    mockGetBuildingBySyndicId(...args),
}));

const mockGetMeetingById = vi.fn();
vi.mock("@/lib/db/queries/meetings", () => ({
  getMeetingById: (...args: unknown[]) => mockGetMeetingById(...args),
}));

// Mock Resend
const mockSend = vi.fn().mockResolvedValue({ id: "email-id" });
vi.mock("resend", () => {
  const ResendMock = function () {
    return { emails: { send: mockSend } };
  };
  return { Resend: ResendMock };
});

// Mock email template
vi.mock("@/lib/email/templates/meeting-invitation", () => ({
  MeetingInvitationEmail: vi.fn(() => null),
}));

// ─── Helpers ──────────────────────────────────────────────────────────

const SYNDIC_UUID = "00000000-0000-4000-8000-000000000001";
const BUILDING_UUID = "00000000-0000-4000-8000-000000000010";
const APT_UUID = "00000000-0000-4000-8000-000000000004";
const OWNER_UUID_1 = "00000000-0000-4000-8000-000000000020";
const USER_UUID_1 = "00000000-0000-4000-8000-000000000030";

const syndicSession = {
  data: {
    user: { id: SYNDIC_UUID, app_metadata: { user_role: "syndic" } },
  },
  error: null,
};

const noSession = { data: { user: null }, error: { message: "not authenticated" } };

const building = {
  id: BUILDING_UUID,
  name: "Résidence Oliviers",
  address: "12 Rue Test",
};

const validInput = {
  title: "AG Q2 2026",
  description: "Ordre du jour budget",
  meetingDate: "2026-06-15",
  startTime: "14:00",
  endTime: "16:00",
  location: "Salle A",
  ownerIds: [OWNER_UUID_1],
};

const meetingResult = {
  meeting: {
    id: "meeting-1",
    syndicId: SYNDIC_UUID,
    title: "AG Q2 2026",
    status: "scheduled",
    meetingDate: "2026-06-15",
    startTime: "14:00",
    endTime: "16:00",
    location: "Salle A",
    description: null,
    createdAt: new Date().toISOString(),
    totalInvitations: 1,
    acceptedCount: 0,
    declinedCount: 0,
  },
  invitations: [],
};

const cancelledMeetingResult = {
  ...meetingResult,
  meeting: { ...meetingResult.meeting, status: "cancelled" },
};

// ─── Tests ────────────────────────────────────────────────────────────

const { createMeeting, cancelMeeting, deleteMeeting } = await import(
  "@/lib/actions/meetings"
);

describe("createMeeting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertCallCount = 0;
    mockGetUser.mockResolvedValue(syndicSession);
    mockGetBuildingBySyndicId.mockResolvedValue(building);
  });

  it("creates meeting and returns success with id", async () => {
    const result = await createMeeting(validInput);
    expect(result).toEqual({
      success: true,
      data: { id: "new-meeting-id" },
    });
  });

  it("writes CREATE_MEETING audit log", async () => {
    await createMeeting(validInput);
    // audit log insert is called after transaction via db.insert
    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CREATE_MEETING",
        entityType: "meetings",
        entityId: "new-meeting-id",
      })
    );
  });

  it("rejects invalid input (empty title)", async () => {
    const result = await createMeeting({ ...validInput, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects unauthenticated users", async () => {
    mockGetUser.mockResolvedValue(noSession);
    const result = await createMeeting(validInput);
    expect(result).toEqual({ success: false, error: "Non authentifié" });
  });

  it("rejects endTime before startTime", async () => {
    const result = await createMeeting({
      ...validInput,
      startTime: "16:00",
      endTime: "14:00",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty ownerIds", async () => {
    const result = await createMeeting({ ...validInput, ownerIds: [] });
    expect(result.success).toBe(false);
  });
});

describe("cancelMeeting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(syndicSession);
    mockGetMeetingById.mockResolvedValue(meetingResult);
  });

  it("cancels a scheduled meeting", async () => {
    const result = await cancelMeeting("meeting-1");
    expect(result).toEqual({ success: true, data: null });
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("rejects cancelling already-cancelled meeting", async () => {
    mockGetMeetingById.mockResolvedValue(cancelledMeetingResult);
    const result = await cancelMeeting("meeting-1");
    expect(result).toEqual({
      success: false,
      error: "Cette réunion est déjà annulée",
    });
  });

  it("rejects unauthenticated users", async () => {
    mockGetUser.mockResolvedValue(noSession);
    const result = await cancelMeeting("meeting-1");
    expect(result).toEqual({ success: false, error: "Non authentifié" });
  });
});

describe("deleteMeeting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(syndicSession);
    mockGetMeetingById.mockResolvedValue(meetingResult);
  });

  it("soft-deletes meeting and returns success", async () => {
    const result = await deleteMeeting("meeting-1");
    expect(result).toEqual({ success: true, data: null });
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        deletedAt: expect.any(Date),
      })
    );
  });

  it("rejects unauthenticated users", async () => {
    mockGetUser.mockResolvedValue(noSession);
    const result = await deleteMeeting("meeting-1");
    expect(result).toEqual({ success: false, error: "Non authentifié" });
  });
});
