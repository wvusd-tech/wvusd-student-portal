// src/services/api.js
// Multi-endpoint federated client for WVUSD Student 360 Portal (verified Google id_token via POST)

import {
  ELPAC_API_URL,
  SBAC_API_URL,
  DATA_API_URL
} from '../config/constants.js';

function postWithIdToken(url, idToken) {
  return fetch(url, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ id_token: idToken.trim() })
  });
}

/**
 * Fetch the authoritative student roster and ELPAC data from ELPAC endpoint
 */
export async function fetchRosterAndElpac(idToken = '') {
  if (!ELPAC_API_URL) throw new Error('ELPAC API URL is not configured.');
  if (!idToken || typeof idToken !== 'string' || idToken.trim().length <= 40) {
    const err = new Error('Valid Google Sign-In id_token is required.');
    err.isForbidden = true;
    throw err;
  }

  const res = await postWithIdToken(ELPAC_API_URL, idToken);
  if (!res.ok) throw new Error(`ELPAC Server Error: HTTP ${res.status}`);
  const data = await res.json();
  if (data.status === 'Forbidden' || data.success === false) {
    const err = new Error(data.message || data.error || 'Access Denied');
    err.isForbidden = true;
    throw err;
  }
  return data;
}

/**
 * Fetch SBAC CAASPP assessment histories and deltas
 */
export async function fetchSbacData(idToken) {
  if (!SBAC_API_URL || !idToken) return [];
  try {
    const res = await postWithIdToken(SBAC_API_URL, idToken);
    if (!res.ok) return [];
    const data = await res.json();
    return data.students || [];
  } catch (err) {
    console.warn('Silent SBAC fetch bypass:', err);
    return [];
  }
}

/**
 * Fetch Illuminate/Data Portal assessments (STAR, Benchmarks, Common Assessments, Kinder)
 */
export async function fetchDataPortalData(idToken) {
  if (!DATA_API_URL || !idToken) return [];
  try {
    const res = await postWithIdToken(DATA_API_URL, idToken);
    if (!res.ok) return [];
    const data = await res.json();
    return data.students || [];
  } catch (err) {
    console.warn('Silent Data Portal fetch bypass:', err);
    return [];
  }
}
