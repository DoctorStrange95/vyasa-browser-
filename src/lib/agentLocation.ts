/**
 * Location Intelligence Agent
 * Extracts state, district, and city from unstructured health article text.
 * Used by both agentIDSP and agentNCD to enrich scraped items with geo data.
 */

export const INDIA_STATES: string[] = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu",
  "Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu and Kashmir","Ladakh","Chandigarh","Puducherry",
  "Andaman and Nicobar","Dadra and Nagar Haveli","Lakshadweep",
];

// Aliases / historic names → canonical state name
const STATE_ALIASES: Record<string, string> = {
  "j&k"           : "Jammu and Kashmir",
  "j & k"         : "Jammu and Kashmir",
  "jammu kashmir" : "Jammu and Kashmir",
  "pondicherry"   : "Puducherry",
  "orissa"        : "Odisha",
  "uttaranchal"   : "Uttarakhand",
  "bombay"        : "Maharashtra",
  "madras"        : "Tamil Nadu",
  "calcutta"      : "West Bengal",
  "bangalore"     : "Karnataka",
  "nct of delhi"  : "Delhi",
  "ncr"           : "Delhi",
};

// Major cities/districts → their state (used for fine-grained location extraction)
const DISTRICT_STATE_MAP: Record<string, string> = {
  // Andhra Pradesh
  visakhapatnam:"Andhra Pradesh", vizag:"Andhra Pradesh",
  vijayawada:"Andhra Pradesh",    guntur:"Andhra Pradesh",
  kurnool:"Andhra Pradesh",       tirupati:"Andhra Pradesh",
  nellore:"Andhra Pradesh",       anantapur:"Andhra Pradesh",
  kadapa:"Andhra Pradesh",        eluru:"Andhra Pradesh",

  // Assam
  guwahati:"Assam", dibrugarh:"Assam", jorhat:"Assam",
  silchar:"Assam",  tinsukia:"Assam",  lakhimpur:"Assam",
  nagaon:"Assam",   cachar:"Assam",

  // Bihar
  patna:"Bihar",       gaya:"Bihar",     muzaffarpur:"Bihar",
  bhagalpur:"Bihar",   darbhanga:"Bihar", purnia:"Bihar",
  samastipur:"Bihar",  munger:"Bihar",

  // Chhattisgarh
  raipur:"Chhattisgarh",  bilaspur:"Chhattisgarh",
  durg:"Chhattisgarh",    korba:"Chhattisgarh",
  jagdalpur:"Chhattisgarh", raigarh:"Chhattisgarh",

  // Goa
  panaji:"Goa", margao:"Goa",

  // Gujarat
  ahmedabad:"Gujarat",   surat:"Gujarat",    vadodara:"Gujarat",
  rajkot:"Gujarat",      bhavnagar:"Gujarat", jamnagar:"Gujarat",
  junagadh:"Gujarat",    gandhinagar:"Gujarat", anand:"Gujarat",
  navsari:"Gujarat",

  // Haryana
  gurugram:"Haryana", gurgaon:"Haryana", faridabad:"Haryana",
  ambala:"Haryana",   hisar:"Haryana",   rohtak:"Haryana",
  karnal:"Haryana",   panipat:"Haryana", sonipat:"Haryana",

  // Himachal Pradesh
  shimla:"Himachal Pradesh", mandi:"Himachal Pradesh",
  kangra:"Himachal Pradesh", solan:"Himachal Pradesh",
  kullu:"Himachal Pradesh",

  // Jharkhand
  ranchi:"Jharkhand",   jamshedpur:"Jharkhand",
  dhanbad:"Jharkhand",  bokaro:"Jharkhand",
  hazaribagh:"Jharkhand",

  // Karnataka
  bengaluru:"Karnataka", mysuru:"Karnataka",  mysore:"Karnataka",
  hubli:"Karnataka",     mangaluru:"Karnataka", belagavi:"Karnataka",
  belgaum:"Karnataka",   davangere:"Karnataka", kalaburagi:"Karnataka",
  gulbarga:"Karnataka",  ballari:"Karnataka",

  // Kerala
  thiruvananthapuram:"Kerala", trivandrum:"Kerala",
  kochi:"Kerala",              kozhikode:"Kerala",
  calicut:"Kerala",            thrissur:"Kerala",
  kannur:"Kerala",             kollam:"Kerala",
  palakkad:"Kerala",           malappuram:"Kerala",
  kottayam:"Kerala",           idukki:"Kerala",

  // Madhya Pradesh
  bhopal:"Madhya Pradesh",   indore:"Madhya Pradesh",
  jabalpur:"Madhya Pradesh", gwalior:"Madhya Pradesh",
  ujjain:"Madhya Pradesh",   rewa:"Madhya Pradesh",
  sagar:"Madhya Pradesh",    satna:"Madhya Pradesh",

  // Maharashtra
  mumbai:"Maharashtra",  pune:"Maharashtra",     nagpur:"Maharashtra",
  nashik:"Maharashtra",  aurangabad:"Maharashtra", solapur:"Maharashtra",
  amravati:"Maharashtra", kolhapur:"Maharashtra",  thane:"Maharashtra",
  nanded:"Maharashtra",  latur:"Maharashtra",    akola:"Maharashtra",
  navi_mumbai:"Maharashtra",

  // Manipur
  imphal:"Manipur",

  // Meghalaya
  shillong:"Meghalaya", tura:"Meghalaya",

  // Mizoram
  aizawl:"Mizoram", lunglei:"Mizoram",

  // Nagaland
  kohima:"Nagaland", dimapur:"Nagaland",

  // Odisha
  bhubaneswar:"Odisha", cuttack:"Odisha",   rourkela:"Odisha",
  sambalpur:"Odisha",   berhampur:"Odisha", puri:"Odisha",
  balasore:"Odisha",    koraput:"Odisha",   mayurbhanj:"Odisha",

  // Punjab
  amritsar:"Punjab",  ludhiana:"Punjab",  jalandhar:"Punjab",
  patiala:"Punjab",   bathinda:"Punjab",  mohali:"Punjab",
  hoshiarpur:"Punjab", ferozepur:"Punjab",

  // Rajasthan
  jaipur:"Rajasthan",  jodhpur:"Rajasthan",  udaipur:"Rajasthan",
  kota:"Rajasthan",    bikaner:"Rajasthan",  alwar:"Rajasthan",
  ajmer:"Rajasthan",   bhilwara:"Rajasthan", sikar:"Rajasthan",

  // Sikkim
  gangtok:"Sikkim",

  // Tamil Nadu
  chennai:"Tamil Nadu",      coimbatore:"Tamil Nadu",
  madurai:"Tamil Nadu",      tiruchirappalli:"Tamil Nadu",
  trichy:"Tamil Nadu",       salem:"Tamil Nadu",
  tirunelveli:"Tamil Nadu",  erode:"Tamil Nadu",
  vellore:"Tamil Nadu",      tiruppur:"Tamil Nadu",
  dindigul:"Tamil Nadu",

  // Telangana
  hyderabad:"Telangana",   warangal:"Telangana",
  nizamabad:"Telangana",   karimnagar:"Telangana",
  khammam:"Telangana",     mahbubnagar:"Telangana",
  ramagundam:"Telangana",

  // Tripura
  agartala:"Tripura", udaipur_tripura:"Tripura",

  // Uttar Pradesh
  lucknow:"Uttar Pradesh",     agra:"Uttar Pradesh",
  varanasi:"Uttar Pradesh",    kanpur:"Uttar Pradesh",
  prayagraj:"Uttar Pradesh",   allahabad:"Uttar Pradesh",
  meerut:"Uttar Pradesh",      noida:"Uttar Pradesh",
  ghaziabad:"Uttar Pradesh",   bareilly:"Uttar Pradesh",
  moradabad:"Uttar Pradesh",   aligarh:"Uttar Pradesh",
  mathura:"Uttar Pradesh",     gorakhpur:"Uttar Pradesh",
  firozabad:"Uttar Pradesh",   muzaffarnagar:"Uttar Pradesh",
  saharanpur:"Uttar Pradesh",  jhansi:"Uttar Pradesh",

  // Uttarakhand
  dehradun:"Uttarakhand",  haridwar:"Uttarakhand",
  roorkee:"Uttarakhand",   haldwani:"Uttarakhand",
  rishikesh:"Uttarakhand", nainital:"Uttarakhand",

  // West Bengal
  kolkata:"West Bengal",   howrah:"West Bengal",
  asansol:"West Bengal",   siliguri:"West Bengal",
  durgapur:"West Bengal",  bardhaman:"West Bengal",
  malda:"West Bengal",     kharagpur:"West Bengal",

  // Delhi & NCR
  "new delhi":"Delhi", delhi:"Delhi",
  noida_ncr:"Uttar Pradesh",

  // Jammu & Kashmir
  srinagar:"Jammu and Kashmir",   jammu:"Jammu and Kashmir",
  anantnag:"Jammu and Kashmir",   baramulla:"Jammu and Kashmir",
  udhampur:"Jammu and Kashmir",

  // Arunachal Pradesh
  itanagar:"Arunachal Pradesh", naharlagun:"Arunachal Pradesh",

  // Ladakh
  leh:"Ladakh", kargil:"Ladakh",
};

export interface LocationResult {
  state:    string;
  district: string;
  village:  string;
}

/** Extract best-effort {state, district, village} from free text. */
export function extractLocation(text: string): LocationResult {
  const lower = ` ${text.toLowerCase()} `;

  let state    = "";
  let district = "";

  // 1. District/city first (more specific — also gives us the state)
  for (const [d, s] of Object.entries(DISTRICT_STATE_MAP)) {
    const token = d.replace("_", " ");
    if (lower.includes(` ${token} `) ||
        lower.includes(` ${token},`) ||
        lower.includes(` ${token}.`) ||
        lower.includes(` ${token}'`) ||
        lower.includes(`(${token})`)) {
      district = token.replace(/\b\w/g, c => c.toUpperCase());
      state    = s;
      break;
    }
  }

  // 2. Fallback to full state names
  if (!state) {
    for (const s of INDIA_STATES) {
      if (lower.includes(s.toLowerCase())) { state = s; break; }
    }
  }

  // 3. Try aliases
  if (!state) {
    for (const [alias, s] of Object.entries(STATE_ALIASES)) {
      if (lower.includes(alias)) { state = s; break; }
    }
  }

  return { state, district, village: "" };
}

/** Extract ALL states mentioned in a text (for multi-state alerts). */
export function extractAllStates(text: string): string[] {
  const lower = text.toLowerCase();
  return INDIA_STATES.filter(s => lower.includes(s.toLowerCase()));
}
