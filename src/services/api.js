// src/services/api.js
// Multi-endpoint federated client for WVUSD Student 360 Portal

import {
  ELPAC_API_URL,
  ELPAC_TOKEN,
  SBAC_API_URL,
  SBAC_TOKEN,
  DATA_API_URL,
  DATA_TOKEN
} from '../config/constants.js';

/**
 * Fetch the authoritative student roster and ELPAC data from ELPAC endpoint
 */
export async function fetchRosterAndElpac(userEmail, idToken = '') {
  if (!ELPAC_API_URL) throw new Error('ELPAC API URL is not configured.');
  const params = new URLSearchParams({
    appToken: ELPAC_TOKEN || ''
  });
  if (idToken) params.set('id_token', idToken);
  if (userEmail) params.set('email', userEmail.trim().toLowerCase());

  const res = await fetch(`${ELPAC_API_URL}?${params.toString()}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });
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
export async function fetchSbacData(userEmail) {
  if (!SBAC_API_URL) return null;
  const params = new URLSearchParams({
    email: userEmail.trim().toLowerCase(),
    appToken: SBAC_TOKEN || ''
  });
  try {
    const res = await fetch(`${SBAC_API_URL}?${params.toString()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return null;
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
export async function fetchDataPortalData(userEmail) {
  if (!DATA_API_URL) return null;
  const params = new URLSearchParams({
    email: userEmail.trim().toLowerCase(),
    appToken: DATA_TOKEN || ''
  });
  try {
    const res = await fetch(`${DATA_API_URL}?${params.toString()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.students || [];
  } catch (err) {
    console.warn('Silent Data Portal fetch bypass:', err);
    return [];
  }
}
