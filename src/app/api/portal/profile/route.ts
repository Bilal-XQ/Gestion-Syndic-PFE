import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getOwnerByUserId, getOwnerById } from "@/lib/db/queries/owners";
import { getApartmentById } from "@/lib/db/queries/apartments";
import { getBuildingById } from "@/lib/db/queries/buildings";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const role = user.app_metadata?.user_role;
  if (role !== "proprietaire") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ownerRecord = await getOwnerByUserId(user.id);
  if (!ownerRecord) {
    return NextResponse.json({ error: "Owner not found" }, { status: 404 });
  }

  const owner = await getOwnerById(ownerRecord.id);
  if (!owner) {
    return NextResponse.json({ error: "Owner not found" }, { status: 404 });
  }

  const apartment = await getApartmentById(ownerRecord.apartmentId);
  if (!apartment) {
    return NextResponse.json(
      { error: "Apartment not found" },
      { status: 404 }
    );
  }

  const building = await getBuildingById(apartment.buildingId);

  return NextResponse.json({
    ownerId: ownerRecord.id,
    owner: {
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email,
      phone: owner.phone,
      ownershipDate: owner.ownershipDate,
    },
    apartment: {
      unitNumber: apartment.unitNumber,
      floor: apartment.floor,
      surfaceArea: apartment.surfaceArea,
      roomCount: apartment.roomCount,
      tantiemes: apartment.tantiemes,
      buildingTotalTantiemes: building?.totalTantiemes,
    },
    building: building
      ? { name: building.name, address: building.address }
      : null,
  });
}
