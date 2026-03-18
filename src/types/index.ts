export type ApartmentEnriched = {
  id: string;
  unitNumber: string;
  floor: number;
  surfaceArea: string;
  roomCount: number;
  type: "studio" | "t1" | "t2" | "t3" | "t4_plus";
  status: "occupied" | "vacant";
  createdAt: Date;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  ownerId: string | null;
  totalActiveCharges: string;
};

export type ApartmentChargeDetail = {
  id: string;
  title: string;
  totalAmount: string;
  amountPaid: string;
  remainingAmount: string;
  status: "paid" | "partial" | "unpaid";
};