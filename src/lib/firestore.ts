/**
 * Firestore REST API helper — no SDK, works in any Node.js / Edge runtime.
 * Requires Firestore rules: allow read, write: if true;
 */

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID ?? "";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

// ── Value encoding / decoding ─────────────────────────────────────────────────
type FsVal =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { mapValue: { fields: Record<string, FsVal> } }
  | { arrayValue: { values?: FsVal[] } };

function parse(v: FsVal): unknown {
  if ("stringValue"  in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue"  in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue"    in v) return null;
  if ("mapValue"     in v) return fromFields(v.mapValue.fields ?? {});
  if ("arrayValue"   in v) return (v.arrayValue.values ?? []).map(parse);
  return null;
}

function fromFields(fields: Record<string, FsVal>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, parse(v)]));
}

function toVal(v: unknown): FsVal {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string")  return { stringValue: v };
  if (typeof v === "number")  return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toVal) } };
  if (typeof v === "object")  return { mapValue: { fields: toFields(v as Record<string, unknown>) } };
  return { stringValue: String(v) };
}

function toFields(obj: Record<string, unknown>): Record<string, FsVal> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toVal(v)]));
}

function docId(name: string) { return name.split("/").pop() ?? ""; }

// ── Public helpers ────────────────────────────────────────────────────────────

/** Check if a document exists */
export async function fsExists(col: string, id: string): Promise<boolean> {
  const res = await fetch(`${BASE}/${col}/${encodeURIComponent(id)}`, { cache: "no-store" });
  return res.status === 200;
}

/** Create or overwrite a document */
export async function fsSet(col: string, id: string, data: Record<string, unknown>): Promise<void> {
  await fetch(`${BASE}/${col}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toFields(data) }),
    cache: "no-store",
  });
}

/** Update specific fields (partial update) */
export async function fsUpdate(col: string, id: string, data: Record<string, unknown>): Promise<void> {
  const mask = Object.keys(data).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
  await fetch(`${BASE}/${col}/${encodeURIComponent(id)}?${mask}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toFields(data) }),
    cache: "no-store",
  });
}

/** Query with a single equality filter */
export async function fsQuery(
  col: string,
  field: string,
  value: string,
  maxItems = 100,
): Promise<Array<Record<string, unknown> & { _id: string }>> {
  const body = {
    structuredQuery: {
      from: [{ collectionId: col }],
      where: { fieldFilter: { field: { fieldPath: field }, op: "EQUAL", value: { stringValue: value } } },
      limit: maxItems,
    },
  };
  const res = await fetch(`${BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) return [];
  type Row = { document?: { name: string; fields: Record<string, FsVal> } };
  const rows: Row[] = await res.json();
  return rows
    .filter(r => r.document?.fields)
    .map(r => ({ ...fromFields(r.document!.fields), _id: docId(r.document!.name) } as Record<string, unknown> & { _id: string }));
}

/** List all documents in a collection (up to maxItems) */
export async function fsList(
  col: string,
  maxItems = 200,
): Promise<Array<Record<string, unknown> & { _id: string }>> {
  const res = await fetch(`${BASE}/${col}?pageSize=${maxItems}`, { cache: "no-store" });
  if (!res.ok) return [];
  type Row = { name: string; fields?: Record<string, FsVal> };
  const data: { documents?: Row[] } = await res.json();
  return (data.documents ?? [])
    .filter(r => r.fields)
    .map(r => ({ ...fromFields(r.fields!), _id: docId(r.name) } as Record<string, unknown> & { _id: string }));
}

/** Add a new document with an auto-generated ID */
export async function fsAdd(col: string, data: Record<string, unknown>): Promise<string> {
  const res = await fetch(`${BASE}/${col}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toFields(data) }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`fsAdd failed: ${res.status}`);
  const doc: { name: string } = await res.json();
  return docId(doc.name);
}

/** Get a single document by ID */
export async function fsGet(
  col: string,
  id: string,
): Promise<(Record<string, unknown> & { _id: string }) | null> {
  const res = await fetch(`${BASE}/${col}/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!res.ok) return null;
  const doc: { name: string; fields?: Record<string, FsVal> } = await res.json();
  if (!doc.fields) return null;
  return { ...fromFields(doc.fields), _id: docId(doc.name) } as Record<string, unknown> & { _id: string };
}

/** Batch-update a list of doc IDs with the same partial data */
export async function fsBatchUpdate(col: string, ids: string[], data: Record<string, unknown>): Promise<void> {
  if (!ids.length) return;
  const fieldPaths = Object.keys(data);
  const writes = ids.map(id => ({
    update: {
      name: `projects/${PROJECT}/databases/(default)/documents/${col}/${id}`,
      fields: toFields(data),
    },
    updateMask: { fieldPaths },
  }));
  for (let i = 0; i < writes.length; i += 500) {
    await fetch(`${BASE}:commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ writes: writes.slice(i, i + 500) }),
      cache: "no-store",
    });
  }
}
