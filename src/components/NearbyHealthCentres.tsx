"use client";
import { useState, useEffect } from "react";

interface Place {
  place_id: string;
  name: string;
  vicinity: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: { open_now: boolean; weekday_text?: string[] };
  types?: string[];
  website?: string;
  geometry: { location: { lat: number; lng: number } };
}

type FilterType = "all" | "phc" | "chc";

function facilityType(place: Place): string {
  const name = place.name.toLowerCase();
  if (name.includes("primary health") || name.includes("phc")) return "PHC";
  if (name.includes("community health") || name.includes("chc")) return "CHC";
  if (name.includes("district hospital") || name.includes("district hospital")) return "District Hospital";
  if (name.includes("sub centre") || name.includes("sub-centre")) return "Sub-Centre";
  return "Health Centre";
}

function facilityColor(type: string): string {
  if (type === "PHC")  return "#2dd4bf";
  if (type === "CHC")  return "#6366f1";
  if (type === "District Hospital") return "#f97316";
  return "#0d9488";
}

export default function NearbyHealthCentres({ stateName, defaultCity }: { stateName: string; defaultCity?: string }) {
  const [places, setPlaces]       = useState<Place[]>([]);
  const [status, setStatus]       = useState<"idle" | "locating" | "loading" | "done" | "error" | "nokey">("idle");
  const [error, setError]         = useState("");
  const [filter, setFilter]       = useState<FilterType>("all");
  const [radius, setRadius]       = useState("10000");
  const [hours, setHours]         = useState(false);
  const [coords, setCoords]       = useState<{ lat: number; lng: number } | null>(null);

  function locate() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        fetchPlaces(c.lat, c.lng, filter, radius);
      },
      (err) => {
        setError(`Location access denied. ${err.message}`);
        setStatus("error");
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }

  function fetchPlaces(lat: number, lng: number, type: FilterType, rad: string) {
    setStatus("loading");
    fetch(`/api/nearby-centres?lat=${lat}&lng=${lng}&radius=${rad}&type=${type}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.needsKey) { setStatus("nokey"); return; }
        if (d.error)    { setError(d.error); setStatus("error"); return; }
        setPlaces(d.results ?? []);
        setStatus("done");
      })
      .catch(() => { setError("Network error. Please try again."); setStatus("error"); });
  }

  function applyFilter(f: FilterType) {
    setFilter(f);
    if (coords) fetchPlaces(coords.lat, coords.lng, f, radius);
  }

  function applyRadius(r: string) {
    setRadius(r);
    if (coords) fetchPlaces(coords.lat, coords.lng, filter, r);
  }

  const visible = places.filter((p) => {
    if (filter === "all") return true;
    const type = facilityType(p);
    if (filter === "phc") return type === "PHC" || type === "Sub-Centre";
    if (filter === "chc") return type === "CHC" || type === "District Hospital";
    return true;
  });

  const mapsSearchUrl = `https://www.google.com/maps/search/primary+health+centre+near+${encodeURIComponent(stateName)}`;

  return (
    <section id="health-centres" style={{ marginTop: "2.5rem", marginBottom: "3rem" }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h2 className="font-display" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "0.3rem" }}>
            Find Nearby Health Centres
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.6 }}>
            Locate PHCs, CHCs &amp; government hospitals near you — with address, phone &amp; opening hours.
          </p>
        </div>
        <a
          href={mapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: "0.8rem", color: "#64748b", textDecoration: "none", border: "1px solid #1e3a5f", borderRadius: "6px", padding: "0.4rem 0.85rem", whiteSpace: "nowrap" }}
        >
          Open in Google Maps ↗
        </a>
      </div>

      {/* Idle / locate prompt */}
      {status === "idle" && (
        <div style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "2.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🏥</div>
          <p style={{ color: "#94a3b8", marginBottom: "0.5rem", fontSize: "0.95rem" }}>
            Share your location to find government health centres near you
          </p>
          <p style={{ color: "#475569", fontSize: "0.82rem", marginBottom: "1.75rem" }}>
            PHCs &amp; CHCs provide free consultations, vaccinations, maternal care, and essential medicines.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={locate}
              style={{
                backgroundColor: "#0d9488", color: "#fff", border: "none",
                borderRadius: "8px", padding: "0.7rem 1.75rem", fontSize: "0.9rem",
                fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Use My Location
            </button>
            <a
              href={mapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: "transparent", color: "#2dd4bf",
                border: "1px solid #1e3a5f", borderRadius: "8px",
                padding: "0.7rem 1.75rem", fontSize: "0.9rem", fontWeight: 600,
                textDecoration: "none", display: "inline-block",
              }}
            >
              Search on Maps
            </a>
          </div>
        </div>
      )}

      {/* Locating */}
      {status === "locating" && (
        <div style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "2.5rem", textAlign: "center", color: "#64748b" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem", animation: "pulse 1.5s ease-in-out infinite" }}>📍</div>
          Getting your location…
        </div>
      )}

      {/* Loading */}
      {status === "loading" && (
        <div style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "2.5rem", textAlign: "center", color: "#64748b" }}>
          <div style={{ marginBottom: "0.75rem" }}>Searching for health centres nearby…</div>
        </div>
      )}

      {/* No API key */}
      {status === "nokey" && (
        <div style={{ backgroundColor: "#0f2040", border: "1px solid #eab30840", borderRadius: "12px", padding: "2rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <span style={{ color: "#eab308", fontSize: "1.2rem" }}>⚠</span>
            <div>
              <div style={{ fontWeight: 600, color: "#e2e8f0", marginBottom: "0.4rem" }}>Google Places API key not configured</div>
              <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.6, marginBottom: "1rem" }}>
                Add <code style={{ backgroundColor: "#0a1628", padding: "0.1rem 0.4rem", borderRadius: "4px", color: "#2dd4bf" }}>GOOGLE_PLACES_API_KEY</code> to <code style={{ backgroundColor: "#0a1628", padding: "0.1rem 0.4rem", borderRadius: "4px", color: "#2dd4bf" }}>.env.local</code> to enable live facility search.
              </p>
              <a
                href={mapsSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#0d9488", textDecoration: "none", fontWeight: 600, fontSize: "0.85rem" }}
              >
                Search health centres on Google Maps instead →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div style={{ backgroundColor: "#0f2040", border: "1px solid #ef444440", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "0.75rem" }}>⚠ {error}</div>
          <button
            onClick={locate}
            style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "6px", padding: "0.4rem 1rem", color: "#94a3b8", cursor: "pointer", fontSize: "0.82rem", fontFamily: "inherit" }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      {status === "done" && (
        <div>
          {/* Filter bar */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center", marginBottom: "1.25rem" }}>
            {(["all", "phc", "chc"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => applyFilter(f)}
                style={{
                  backgroundColor: filter === f ? "#0d9488" : "#0f2040",
                  border: `1px solid ${filter === f ? "#0d9488" : "#1e3a5f"}`,
                  borderRadius: "6px", padding: "0.35rem 0.85rem",
                  color: filter === f ? "#fff" : "#94a3b8",
                  fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", fontWeight: filter === f ? 600 : 400,
                }}
              >
                {f === "all" ? "All Facilities" : f === "phc" ? "PHC / Sub-Centre" : "CHC / Hospital"}
              </button>
            ))}
            <select
              value={radius}
              onChange={(e) => applyRadius(e.target.value)}
              style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "6px", padding: "0.35rem 0.75rem", color: "#94a3b8", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", marginLeft: "auto" }}
            >
              <option value="5000">Within 5 km</option>
              <option value="10000">Within 10 km</option>
              <option value="20000">Within 20 km</option>
              <option value="50000">Within 50 km</option>
            </select>
            <button
              onClick={() => setHours(!hours)}
              style={{ backgroundColor: hours ? "#0f204080" : "transparent", border: "1px solid #1e3a5f", borderRadius: "6px", padding: "0.35rem 0.75rem", color: hours ? "#2dd4bf" : "#64748b", fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit" }}
            >
              {hours ? "Hide Hours" : "Show Hours"}
            </button>
          </div>

          {visible.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#475569", backgroundColor: "#0f2040", borderRadius: "10px" }}>
              No {filter === "phc" ? "PHCs" : filter === "chc" ? "CHCs" : "health centres"} found within {Number(radius) / 1000} km. Try increasing the radius.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {visible.map((place) => (
                <PlaceCard key={place.place_id} place={place} showHours={hours} />
              ))}
            </div>
          )}

          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.72rem", color: "#334155" }}>
              Showing {visible.length} facilities · Powered by Google Places
            </span>
            <button
              onClick={locate}
              style={{ backgroundColor: "transparent", border: "1px solid #1e3a5f", borderRadius: "6px", padding: "0.35rem 0.85rem", color: "#64748b", cursor: "pointer", fontSize: "0.78rem", fontFamily: "inherit" }}
            >
              Refresh location
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function PlaceCard({ place, showHours }: { place: Place; showHours: boolean }) {
  const type  = facilityType(place);
  const color = facilityColor(type);
  const isOpen = place.opening_hours?.open_now;
  const address = place.formatted_address ?? place.vicinity;
  const phone   = place.formatted_phone_number ?? place.international_phone_number;

  const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;

  return (
    <div style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      {/* Type badge + open status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.65rem", color, backgroundColor: `${color}20`, border: `1px solid ${color}40`, borderRadius: "4px", padding: "0.15rem 0.5rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {type}
        </span>
        {place.opening_hours && (
          <span style={{ fontSize: "0.68rem", color: isOpen ? "#22c55e" : "#ef4444", backgroundColor: isOpen ? "#22c55e15" : "#ef444415", borderRadius: "4px", padding: "0.15rem 0.5rem", flexShrink: 0 }}>
            {isOpen ? "● Open now" : "○ Closed"}
          </span>
        )}
      </div>

      {/* Name */}
      <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.95rem", lineHeight: 1.3 }}>{place.name}</div>

      {/* Address */}
      {address && (
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "flex-start" }}>
          <span style={{ color: "#475569", fontSize: "0.75rem", flexShrink: 0, marginTop: "0.05rem" }}>📍</span>
          <span style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.45 }}>{address}</span>
        </div>
      )}

      {/* Phone */}
      {phone && (
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <span style={{ color: "#475569", fontSize: "0.75rem" }}>📞</span>
          <a
            href={`tel:${phone}`}
            style={{ fontSize: "0.85rem", color: "#2dd4bf", textDecoration: "none", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500 }}
          >
            {phone}
          </a>
        </div>
      )}

      {/* Rating */}
      {place.rating && (
        <div>
          <StarRating rating={place.rating} count={place.user_ratings_total} />
        </div>
      )}

      {/* Opening hours */}
      {showHours && place.opening_hours?.weekday_text && (
        <div style={{ backgroundColor: "#070f1e", borderRadius: "6px", padding: "0.6rem 0.75rem" }}>
          <div style={{ fontSize: "0.68rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>Opening Hours</div>
          {place.opening_hours.weekday_text.map((line, i) => (
            <div key={i} style={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.6 }}>{line}</div>
          ))}
        </div>
      )}

      {/* Services typical for govt health centres */}
      <div style={{ marginTop: "0.25rem" }}>
        <div style={{ fontSize: "0.65rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>Services</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
          {getServices(type).map((svc) => (
            <span key={svc} style={{ fontSize: "0.68rem", color: "#64748b", backgroundColor: "#1e3a5f30", borderRadius: "4px", padding: "0.15rem 0.45rem" }}>{svc}</span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ flex: 1, minWidth: "120px", textAlign: "center", backgroundColor: "#0d9488", color: "#fff", textDecoration: "none", borderRadius: "7px", padding: "0.5rem 0.75rem", fontSize: "0.8rem", fontWeight: 600 }}
        >
          Get Directions
        </a>
        {phone && (
          <a
            href={`tel:${phone}`}
            style={{ flex: 1, minWidth: "100px", textAlign: "center", backgroundColor: "#0f2040", border: "1px solid #1e3a5f", color: "#2dd4bf", textDecoration: "none", borderRadius: "7px", padding: "0.5rem 0.75rem", fontSize: "0.8rem", fontWeight: 600 }}
          >
            Call
          </a>
        )}
        {place.website && (
          <a
            href={place.website}
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: "transparent", border: "1px solid #1e3a5f", color: "#64748b", textDecoration: "none", borderRadius: "7px", padding: "0.5rem 0.75rem", fontSize: "0.8rem" }}
          >
            Website
          </a>
        )}
      </div>
    </div>
  );
}

function StarRating({ rating, count }: { rating?: number; count?: number }) {
  if (!rating) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem" }}>
      <span style={{ color: "#eab308" }}>
        {"★".repeat(Math.round(rating))}{"☆".repeat(Math.max(0, 5 - Math.round(rating)))}
      </span>
      <span style={{ color: "#64748b" }}>{rating.toFixed(1)}{count ? ` · ${count.toLocaleString()} reviews` : ""}</span>
    </span>
  );
}

function getServices(type: string): string[] {
  if (type === "PHC") return ["OPD", "Vaccination", "Maternal Care", "Child Health", "Family Planning", "Essential Medicines"];
  if (type === "CHC") return ["OPD", "IPD (30 beds)", "Emergency", "Surgical", "Lab Tests", "X-Ray", "Vaccination", "Specialist OPD"];
  if (type === "District Hospital") return ["Emergency", "Surgery", "ICU", "Maternity", "Paediatrics", "Blood Bank", "Radiology", "Pharmacy"];
  return ["OPD", "Vaccination", "Maternal Care", "Essential Medicines"];
}
