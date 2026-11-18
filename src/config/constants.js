// src/config/constants.js
// WVUSD Student 360 Assessment Portal Configuration

export const APP_TITLE = "WVUSD Student 360 Portal";
export const DISTRICT_NAME = "Walnut Valley Unified School District";

export const GOOGLE_CLIENT_ID =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
  "915478440754-0gsp8u23u3qovgh60b643q7n9o2260r8.apps.googleusercontent.com";

export const ELPAC_API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_ELPAC_URL) ||
  "https://script.google.com/macros/s/AKfycbzRXjeAwSH3Ix0DVpMYees8DGMOAY3RrD98S3wAoZm9maKnsytHnXriSC5B16G_QGyN/exec";

export const ELPAC_TOKEN =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_ELPAC_TOKEN) ||
  "d448e928f38972b381f8dc61ae4aa1c7";

export const SBAC_API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SBAC_URL) ||
  "https://script.google.com/macros/s/AKfycbwK_Gl3z5ANxFgyCxbv2awKDQsVrr7s2FvRusiLCKx7qa0B2Y1VN2GtoUoI0AuVaJ8/exec";

export const SBAC_TOKEN =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SBAC_TOKEN) ||
  "0cb56611228c9ea65980af2a21561233";

export const DATA_API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_DATA_URL) ||
  "https://script.google.com/macros/s/AKfycbzooerUiIhtgwdta9hfZ9CwyDs7tj7ctWfTEjj_5XGauDqzZTVHn-bjGtY2jgM_q6mV/exec";

export const DATA_TOKEN =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_DATA_TOKEN) ||
  "2bb2d607a4324d673d304e552ff545b1";

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
