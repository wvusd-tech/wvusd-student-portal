// src/config/constants.js
// WVUSD Student 360 Assessment Portal Configuration

export const APP_TITLE = "WVUSD Student 360 Portal";
export const DISTRICT_NAME = "Walnut Valley Unified School District";

export const GOOGLE_CLIENT_ID =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
  "243489966839-kcopbaj692oat1p2hoq5lrcddq9n4k17.apps.googleusercontent.com";

export const ELPAC_API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_ELPAC_URL) ||
  "https://script.google.com/macros/s/AKfycbzmcAIbfi9uycBuWY9ucRBctNWBq76UxgYNOi-xEfJLdGNbByBhHxrGufwA-MlbxK6X/exec";

export const SBAC_API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SBAC_URL) ||
  "https://script.google.com/macros/s/AKfycbw4V4dx2kKJKJLykWaO6dbGDNqxy8HcVRDar43ytSg5SYnvLrssutvx9wHWribAfmQ/exec";

export const DATA_API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_DATA_URL) ||
  "https://script.google.com/macros/s/AKfycbzwDNJK9MsEkEQwSL1MWm3S8QqeyhIUGxrCffTERFeEZtNAiVazjW0jTegwtm6fWd8g/exec";

export const DISTRICT_LOGO =
  "https://res.cloudinary.com/djv9u4054/image/upload/v1783959106/UPdated_Black_and_White_Logo-removebg-preview_zubeqp.png";

export const SITE_LOGOS = {
  "diamond bar": "https://res.cloudinary.com/djv9u4054/image/upload/v178362852/0-DBARBRAHMASWide_q8uled-removebg-preview_x7ta88.png",
  "south pointe": "https://res.cloudinary.com/djv9u4054/image/upload/v1783623577/copy_of_copy_of_spt_logo-removebg-preview_l7eve6.png",
  "maple hill": "https://res.cloudinary.com/djv9u4054/image/upload/v1783459666/copy_of_untitled_design_6_qhbikx.png",
  "chaparral": "https://res.cloudinary.com/djv9u4054/image/upload/v1781797508/CHP_Logo-removebg-preview_npea0e.png",
  "suzanne": "https://res.cloudinary.com/djv9u4054/image/upload/v1780597225/Suzanne_iqsuyo.png",
  "walnut high": "https://res.cloudinary.com/djv9u4054/image/upload/v1780504988/stickerwhs_iwwwxs_rx0om9.png",
  "collegewood": "https://res.cloudinary.com/djv9u4054/image/upload/v1777485387/Untitled_design_14_on26t9.png",
  "vejar": "https://res.cloudinary.com/djv9u4054/image/upload/v1777485064/Untitled_design_13_ohnd95.png",
  "castle rock": "https://res.cloudinary.com/djv9u4054/image/upload/v1777486030/Untitled_design_15_dt6zmq.png",
  "evergreen": "https://res.cloudinary.com/djv9u4054/image/upload/v1777484631/Untitled_design_12_le66tp.png",
  "quail summit": "https://res.cloudinary.com/djv9u4054/image/upload/v1777484271/Untitled_design_11_bd8mmm.png",
  "walnut elementary": "https://res.cloudinary.com/djv9u4054/image/upload/v1777483405/Untitled_design_10_imwook.png",
  "westhoff": "https://res.cloudinary.com/djv9u4054/image/upload/v1777482954/Untitled_design_9_pkf2df.png",
  "morris": "https://res.cloudinary.com/djv9u4054/image/upload/v1777482304/Untitled_design_7_kyzokr.png"
};

export function getSiteLogo(siteName) {
  if (!siteName || siteName === "ALL") return DISTRICT_LOGO;
  const lower = String(siteName).toLowerCase();
  if (lower.includes("walnut") && !lower.includes("high")) {
    return SITE_LOGOS["walnut elementary"];
  }
  for (const [key, url] of Object.entries(SITE_LOGOS)) {
    if (lower.includes(key)) return url;
  }
  return DISTRICT_LOGO;
}

export const SBAC_PERFORMANCE_LEVELS = {
  4: { label: "Standard Exceeded", badge: "L4 · Level 4", color: "bg-blue-50 text-blue-800 border-blue-200" },
  3: { label: "Standard Met", badge: "L3 · Level 3", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  2: { label: "Standard Nearly Met", badge: "L2 · Level 2", color: "bg-amber-50 text-amber-800 border-amber-200" },
  1: { label: "Standard Not Met", badge: "L1 · Level 1", color: "bg-rose-50 text-rose-800 border-rose-200" }
};

export const ELPAC_PERFORMANCE_LEVELS = {
  4: { label: "Well Developed", badge: "L4 · Well", color: "bg-blue-50 text-blue-800 border-blue-200" },
  3: { label: "Moderately Developed", badge: "L3 · Moderately", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  2: { label: "Somewhat Developed", badge: "L2 · Somewhat", color: "bg-amber-50 text-amber-800 border-amber-200" },
  1: { label: "Minimally Developed", badge: "L1 · Minimally", color: "bg-rose-50 text-rose-800 border-rose-200" }
};

export const ELPAC_PARTS = {
  0: { part: 0, label: "Overall ELPAC", shortLabel: "Part 0 · Overall", category: "OVERALL" },
  1: { part: 1, label: "Oral Language", shortLabel: "Part 1 · Oral", category: "ORAL" },
  2: { part: 2, label: "Written Language", shortLabel: "Part 2 · Written", category: "WRITTEN" },
  3: { part: 3, label: "Listening Domain", shortLabel: "Part 3 · Listening", category: "ORAL" },
  4: { part: 4, label: "Speaking Domain", shortLabel: "Part 4 · Speaking", category: "ORAL" },
  5: { part: 5, label: "Reading Domain", shortLabel: "Part 5 · Reading", category: "WRITTEN" },
  6: { part: 6, label: "Writing Domain", shortLabel: "Part 6 · Writing", category: "WRITTEN" },
};

export function getPartLabel(partVal) {
  const num = Number(partVal);
  if (!isNaN(num) && ELPAC_PARTS[num]) {
    return ELPAC_PARTS[num];
  }
  return {
    part: partVal ?? 0,
    label: partVal !== undefined && partVal !== "" ? `Part ${partVal}` : "Overall (Part 0)",
    shortLabel: partVal !== undefined && partVal !== "" ? `Part ${partVal}` : "Part 0",
    category: "OVERALL"
  };
}
