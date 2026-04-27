import { NextRequest, NextResponse } from "next/server";
import { adminList, adminGet } from "@/lib/firestore-admin";

export const maxDuration = 30;

// ── Column detection ─────────────────────────────────────────────────────────

function norm(s: string) {
  return s.toLowerCase().replace(/[\s_\-\.\/\(\)]+/g, "");
}

function findCol(keys: string[], ...patterns: string[]): string | undefined {
  const normed = keys.map(norm);
  for (const p of patterns) {
    const pn = norm(p);
    const idx = normed.findIndex((k) => k.includes(pn));
    if (idx !== -1) return keys[idx];
  }
}

interface ColMap {
  name?:       string;
  district?:   string;
  speciality?: string;
  address?:    string;
  phone?:      string;
  type?:       string;
  status?:     string;
}

function detectColumns(keys: string[]): ColMap {
  return {
    name:       findCol(keys, "hospital name", "hospitalname", "nameofhospital", "name of hospital", "facility name", "facilityname", "nameof"),
    district:   findCol(keys, "district name", "districtname", "district"),
    speciality: findCol(keys, "specialities empanelled", "specialitiesempanelled", "empanelledspecialiti", "specialities", "speciality", "currentspecialiti", "empanelledspeciality"),
    address:    findCol(keys, "address", "hospitaladdress", "hospital address"),
    phone:      findCol(keys, "phone no", "phoneno", "contact no", "contactno", "mobile no", "mobileno", "phone number", "phonenumber", "phone", "mobile", "contact"),
    type:       findCol(keys, "hospital type", "hospitaltype", "facility type", "facilitytype", "type"),
    status:     findCol(keys, "empanelment status", "empanelmentstatus", "status"),
  };
}

export interface HospitalRow {
  name:         string;
  district:     string;
  specialities: string;
  address:      string;
  phone:        string;
  type:         string;
  status:       string;
}

function toRow(raw: Record<string, unknown>, c: ColMap): HospitalRow {
  const s = (k?: string) => (k ? String(raw[k] ?? "").trim() : "");
  return {
    name:         s(c.name),
    district:     s(c.district),
    specialities: s(c.speciality),
    address:      s(c.address),
    phone:        s(c.phone),
    type:         s(c.type),
    status:       s(c.status),
  };
}

function matchesSpeciality(spCell: string, code: string): boolean {
  if (!spCell) return false;
  const tokens = spCell.toUpperCase().split(/[,;\s\/]+/).map((t) => t.trim()).filter(Boolean);
  return tokens.includes(code.toUpperCase());
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;

  // List all available states
  if (p.get("states") === "true") {
    try {
      const docs = await adminList("hospitals", 50);
      return NextResponse.json(
        docs.map((d) => ({
          stateSlug:  String(d.stateSlug ?? d._id),
          stateName:  String(d.stateName ?? d._id),
          count:      Number(d.count ?? 0),
          importedAt: d.importedAt ?? null,
        })).sort((a, b) => a.stateName.localeCompare(b.stateName))
      );
    } catch (e) {
      const msg = String(e);
      // Firebase not configured in this environment — return empty list gracefully
      if (msg.includes("FIREBASE_SERVICE_ACCOUNT_KEY") || msg.includes("credential")) {
        return NextResponse.json([]);
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  const state = p.get("state");
  if (!state) return NextResponse.json({ error: "state required" }, { status: 400 });

  let doc: (Record<string, unknown> & { _id: string }) | null;
  try {
    doc = await adminGet("hospitals", state);
  } catch (e) {
    const msg = String(e);
    if (msg.includes("FIREBASE_SERVICE_ACCOUNT_KEY") || msg.includes("credential")) {
      return NextResponse.json({ hospitals: [], districts: [], total: 0, columns: [] });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (!doc) return NextResponse.json({ error: "state not found" }, { status: 404 });

  const rawHospitals = (doc.hospitals as Record<string, unknown>[]) ?? [];
  if (!rawHospitals.length) {
    return NextResponse.json({ hospitals: [], districts: [], total: 0, columns: [] });
  }

  const keys   = Object.keys(rawHospitals[0]);
  const cols   = detectColumns(keys);

  // Schema debug mode
  if (p.get("schema") === "1") {
    return NextResponse.json({
      columns:    keys,
      detected:   cols,
      sampleRow:  rawHospitals[0],
      totalRows:  rawHospitals.length,
      stateName:  doc.stateName,
    });
  }

  // Names-only mode: return ALL hospital names for this state (used for Ayushman name-matching)
  if (p.get("namesOnly") === "true") {
    const keys2  = rawHospitals.length ? Object.keys(rawHospitals[0]) : [];
    const cols2  = detectColumns(keys2);
    const names  = rawHospitals.map(raw => toRow(raw, cols2).name).filter(Boolean);
    return NextResponse.json({ names, total: names.length });
  }

  const district   = p.get("district")?.trim().toLowerCase() ?? "";
  const speciality = p.get("speciality")?.trim().toUpperCase() ?? "";
  const q          = p.get("q")?.trim().toLowerCase() ?? "";
  const page       = Math.max(0, parseInt(p.get("page") ?? "0", 10));
  const limit      = 50;

  // Collect districts & filter
  const districtSet = new Set<string>();
  let filtered: HospitalRow[] = [];

  for (const raw of rawHospitals) {
    const row = toRow(raw, cols);
    if (row.district) districtSet.add(row.district);

    if (district && !row.district.toLowerCase().includes(district)) continue;
    if (speciality && !matchesSpeciality(row.specialities, speciality)) continue;
    if (q && !row.name.toLowerCase().includes(q) && !row.district.toLowerCase().includes(q) && !row.address.toLowerCase().includes(q)) continue;

    filtered.push(row);
  }

  const allDistricts = [...districtSet].sort();
  const total        = filtered.length;
  const hospitals    = filtered.slice(page * limit, (page + 1) * limit);

  return NextResponse.json({
    hospitals,
    districts:  allDistricts,
    total,
    page,
    pages:      Math.ceil(total / limit),
    stateName:  doc.stateName,
    importedAt: doc.importedAt ?? null,
    detected:   cols,
  });
}
