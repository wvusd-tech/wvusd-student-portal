// src/utils/studentDataMerger.js
// Joins multi-source assessment data (ELPAC roster, SBAC, and Data Portal) by Student ID
// and provides rich parsed assessment structures and AI NotebookLM prompts.

export const YOY_THRESHOLDS = {
  STANDARD_RELATIVE: {
    STRONG_GROWTH: 10.0,
    MODERATE_GROWTH_MIN: 2.0,
    MODERATE_DECLINE_MAX: -2.0,
    SIGNIFICANT_DECLINE: -10.0
  },
  PERCENTAGE_SCORES: {
    STRONG_GROWTH: 5.0,
    MODERATE_GROWTH_MIN: 2.0,
    MODERATE_DECLINE_MAX: -2.0,
    SIGNIFICANT_DECLINE: -5.0
  }
};

/**
 * Normalizes an assessment score to a comparable numeric value.
 */
export function normalizeReadingScore(val) {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (!str || str === '-' || str.toLowerCase() === 'n/a' || str === 'T' || str === 'N' || str === 'true' || str === 'false') {
    return null;
  }

  const upper = str.toUpperCase();
  if (upper === 'PP') return 0.2;
  if (upper === 'P') return 0.5;
  if (/^[A-Z]$/.test(upper)) return upper.charCodeAt(0) - 64;
  if (upper === 'AA') return 0.1;

  const fractionMatch = str.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fractionMatch) {
    const num = parseFloat(fractionMatch[1]);
    const den = parseFloat(fractionMatch[2]);
    if (den > 0) return Number(((num / den) * 100).toFixed(1));
  }

  const numMatch = str.match(/-?\d+(\.\d+)?/);
  if (numMatch) {
    const parsed = parseFloat(numMatch[0]);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Parses comma-separated multi-attempt cell strings from Illuminate.
 */
export function parseMultiAttempt(cellValue) {
  if (cellValue === null || cellValue === undefined) {
    return { latest: '', raw: '', history: [], latestNumeric: null };
  }
  const raw = String(cellValue).trim();
  if (!raw) {
    return { latest: '', raw, history: [], latestNumeric: null };
  }

  const parts = raw
    .split(',')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (parts.length === 0) {
    return { latest: '', raw, history: [], latestNumeric: null };
  }

  const latest = parts[parts.length - 1];
  const latestNumeric = normalizeReadingScore(latest);

  return {
    latest,
    raw,
    history: parts,
    latestNumeric
  };
}

/**
 * Extracts trimester / baseline checkpoint ordering from an assessment header.
 */
export function extractPeriodInfo(text) {
  if (!text || typeof text !== 'string') {
    return { period: null, periodOrder: 99 };
  }
  if (/\bbaseline\b|\bboy\b|\bbeginning of year\b|\bpre-?test\b|\bdiagnostic\b/i.test(text)) {
    return { period: 'Baseline', periodOrder: 0 };
  }
  if (/\btrimester\s*1\b|\btri\.?\s*1\b|\bt1\b|\bfall\b/i.test(text)) {
    return { period: 'Tri 1', periodOrder: 1 };
  }
  if (/\btrimester\s*2\b|\btri\.?\s*2\b|\bt2\b|\bwinter\b|\bmoy\b|\bmiddle of year\b/i.test(text)) {
    return { period: 'Tri 2', periodOrder: 2 };
  }
  if (/\btrimester\s*3\b|\btri\.?\s*3\b|\bt3\b|\bspring\b|\beoy\b|\bend of year\b|\bpost-?test\b/i.test(text)) {
    return { period: 'Tri 3', periodOrder: 3 };
  }
  return { period: null, periodOrder: 99 };
}

/**
 * Normalizes assessment column header into year, period, and base family
 */
export function extractMetricInfo(header) {
  if (!header || typeof header !== 'string') {
    return { year: null, rest: '', family: '', period: null, periodOrder: 99, label: '' };
  }

  let year = null;
  let rest = header.trim();

  const leadingYearMatch = rest.match(/^(?:sy\s*)?((?:20)?(\d{2})\s*[-/–]\s*(?:20)?(\d{2}))\s+(.*)$/i);
  if (leadingYearMatch) {
    const y1 = leadingYearMatch[2].length === 2 ? `20${leadingYearMatch[2]}` : leadingYearMatch[2];
    const y2 = leadingYearMatch[3].length === 2 ? `20${leadingYearMatch[3]}` : leadingYearMatch[3];
    year = `${y1}-${y2}`;
    rest = leadingYearMatch[4].trim();
  } else {
    const embeddedYear = rest.match(/\b(20\d{2})\s*[-/–]\s*(?:20)?(\d{2})\b/) || rest.match(/\b(\d{2})\s*[-/–]\s*(\d{2})\b/);
    if (embeddedYear) {
      const y1 = embeddedYear[1].length === 4 ? embeddedYear[1] : `20${embeddedYear[1]}`;
      const y2 = embeddedYear[2].length === 4 ? embeddedYear[2] : `20${embeddedYear[2]}`;
      year = `${y1}-${y2}`;
    }
  }

  const { period, periodOrder } = extractPeriodInfo(rest);

  let family = rest;
  if (/amira.*arm/i.test(rest) && !/level|status|risk/i.test(rest)) {
    family = 'Amira ARM Fluency';
  } else if (/amira.*dyslexia.*status/i.test(rest)) {
    family = 'Amira Dyslexia Status';
  } else if (/star.*reading|instructional.*reading.*level|^star\b/i.test(rest)) {
    family = 'STAR Reading IRL';
  } else if (/star.*math/i.test(rest)) {
    family = 'STAR Math';
  } else if (/oral reading record|\borr\b/i.test(rest)) {
    family = 'Oral Reading Record (ORR)';
  } else if (/\bmath\b.*percent|math common assessment/i.test(rest)) {
    family = 'Math Common Assessment';
  } else if (/writing.*narrative/i.test(rest)) {
    family = 'Writing: Narrative';
  } else if (/writing.*opinion/i.test(rest)) {
    family = 'Writing: Opinion';
  } else if (/writing.*informational/i.test(rest)) {
    family = 'Writing: Informational';
  } else {
    family = rest
      .replace(/^(?:1st|2nd|3rd|4th|5th|k|tk|kindergarten|\d+(?:st|nd|rd|th)?)\s*grade\s+/i, '')
      .replace(/\b(?:baseline|beginning of year|boy|pre-?test|diagnostic|trimester\s*[123]|tri\.?\s*[123]|t[123]|fall|winter|spring|moy|eoy|post-?test)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim() || rest;
  }

  const label = [year, period].filter(Boolean).join(' ') || year || period || 'Current';

  return { year, rest, family, period, periodOrder, label };
}

/**
 * Computes Year-over-Year / Trimester-over-Trimester growth
 */
export function computeYoYGrowth(prevValue, currValue, family = '') {
  const prevParsed = typeof prevValue === 'object' && prevValue?.latest !== undefined ? prevValue : parseMultiAttempt(prevValue);
  const currParsed = typeof currValue === 'object' && currValue?.latest !== undefined ? currValue : parseMultiAttempt(currValue);

  const prev = prevParsed.latestNumeric;
  const curr = currParsed.latestNumeric;

  if (prev === null || curr === null) {
    return {
      status: 'unknown',
      tier: 'unknown',
      badge: '⚪ Baseline Only',
      color: 'slate',
      delta: null,
      percentChange: null,
      primaryChange: null,
      unit: '',
      isGrowth: false,
      isDecline: false,
      isSignificantDecline: false,
      prevScore: prev,
      currScore: curr,
      description: 'Baseline recorded'
    };
  }

  const isPercentageMetric = /percent|%|rubric|phonics|subtest|math/i.test(family) || (prev <= 100 && curr <= 100 && prev > 10);
  const delta = Number((curr - prev).toFixed(2));
  let percentChange = null;
  if (prev !== 0) {
    percentChange = Number((((curr - prev) / Math.abs(prev)) * 100).toFixed(1));
  }

  const primaryChange = isPercentageMetric ? delta : (percentChange ?? delta);
  const unit = isPercentageMetric ? 'pp' : '%';
  const thresholds = isPercentageMetric ? YOY_THRESHOLDS.PERCENTAGE_SCORES : YOY_THRESHOLDS.STANDARD_RELATIVE;

  if (primaryChange > thresholds.STRONG_GROWTH) {
    return {
      status: 'strong_growth',
      tier: 'strong_growth',
      badge: '🚀 Strong Growth',
      color: 'emerald',
      delta,
      percentChange,
      primaryChange,
      unit,
      isGrowth: true,
      isDecline: false,
      isSignificantDecline: false,
      prevScore: prev,
      currScore: curr,
      description: `+${delta}${isPercentageMetric ? ' pp' : ` (+${percentChange}%)`} (${prevParsed.latest} → ${currParsed.latest})`
    };
  } else if (primaryChange > thresholds.MODERATE_GROWTH_MIN) {
    return {
      status: 'growth',
      tier: 'moderate_growth',
      badge: '🟢 Moderate Growth',
      color: 'emerald',
      delta,
      percentChange,
      primaryChange,
      unit,
      isGrowth: true,
      isDecline: false,
      isSignificantDecline: false,
      prevScore: prev,
      currScore: curr,
      description: `+${delta}${isPercentageMetric ? ' pp' : ` (+${percentChange}%)`} (${prevParsed.latest} → ${currParsed.latest})`
    };
  } else if (primaryChange < thresholds.SIGNIFICANT_DECLINE) {
    return {
      status: 'strong_decline',
      tier: 'strong_decline',
      badge: '🔴 Significant Decline',
      color: 'rose',
      delta,
      percentChange,
      primaryChange,
      unit,
      isGrowth: false,
      isDecline: true,
      isSignificantDecline: true,
      prevScore: prev,
      currScore: curr,
      description: `${delta}${isPercentageMetric ? ' pp' : ` (${percentChange}%)`} (${prevParsed.latest} → ${currParsed.latest})`
    };
  } else if (primaryChange < thresholds.MODERATE_DECLINE_MAX) {
    return {
      status: 'decline',
      tier: 'moderate_decline',
      badge: '🟠 Moderate Decline',
      color: 'amber',
      delta,
      percentChange,
      primaryChange,
      unit,
      isGrowth: false,
      isDecline: true,
      isSignificantDecline: false,
      prevScore: prev,
      currScore: curr,
      description: `${delta}${isPercentageMetric ? ' pp' : ` (${percentChange}%)`} (${prevParsed.latest} → ${currParsed.latest})`
    };
  } else {
    return {
      status: 'steady',
      tier: 'maintained',
      badge: '🟡 Maintained',
      color: 'slate',
      delta,
      percentChange,
      primaryChange,
      unit,
      isGrowth: false,
      isDecline: false,
      isSignificantDecline: false,
      prevScore: prev,
      currScore: curr,
      description: `Maintained (${prevParsed.latest} → ${currParsed.latest}) [${delta >= 0 ? `+${delta}` : delta}${isPercentageMetric ? ' pp' : '%'}]`
    };
  }
}

/**
 * Parses raw data portal student record into tab arrays, growth comparisons, and headlines
 */
export function parseDataPortalStudentRecord(raw) {
  if (!raw) return { parsedTabs: {}, matchedTabs: [], yoyComparisons: [], baselineScores: [], headline: {} };

  const rawAssessmentsByTab = raw.assessmentsByTab || {};
  const metrics = raw.metrics || {};

  const parsedTabs = {};
  const allParsedColumns = [];
  const familyCheckpointsMap = {};

  const registerColumnCheckpoint = (colObj) => {
    if (colObj.parsed.latestNumeric === null) return;
    if (colObj.period === 'Baseline') return;
    if (!colObj.year && !colObj.period) return;
    if (!familyCheckpointsMap[colObj.family]) {
      familyCheckpointsMap[colObj.family] = [];
    }
    const existingIdx = familyCheckpointsMap[colObj.family].findIndex(
      c => c.header === colObj.header || (c.year === colObj.year && c.period && c.period === colObj.period)
    );
    if (existingIdx >= 0) {
      familyCheckpointsMap[colObj.family][existingIdx] = colObj;
    } else {
      familyCheckpointsMap[colObj.family].push(colObj);
    }
  };

  for (const [tabName, tabData] of Object.entries(rawAssessmentsByTab)) {
    // Skip empty roster echoes
    if (tabName.toLowerCase() === 'roster') continue;
    const colList = [];

    for (const [header, val] of Object.entries(tabData || {})) {
      if (val === null || val === undefined || val === '') continue;
      if (header.includes('User Name') || header.includes('English Proficiency') || header.includes('Special Ed') || header.includes('504 Accommodations')) {
        continue;
      }

      const info = extractMetricInfo(header);
      const parsed = parseMultiAttempt(val);

      const colObj = {
        tab: tabName,
        header,
        year: info.year,
        period: info.period,
        periodOrder: info.periodOrder,
        label: info.label,
        baseName: info.rest || header,
        family: info.family,
        rawVal: val,
        parsed,
        colIndex: allParsedColumns.length
      };

      colList.push(colObj);
      allParsedColumns.push(colObj);
      registerColumnCheckpoint(colObj);
    }

    if (colList.length > 0) {
      parsedTabs[tabName] = colList;
    }
  }

  // Also check raw metrics if not already present
  for (const [header, val] of Object.entries(metrics)) {
    if (!allParsedColumns.some(c => c.header === header)) {
      if (val === null || val === undefined || val === '') continue;
      if (header.includes('User Name') || header.includes('English Proficiency') || header.includes('Special Ed') || header.includes('504 Accommodations')) {
        continue;
      }
      const info = extractMetricInfo(header);
      const parsed = parseMultiAttempt(val);
      const colObj = {
        tab: 'General',
        header,
        year: info.year,
        period: info.period,
        periodOrder: info.periodOrder,
        label: info.label,
        baseName: info.rest || header,
        family: info.family,
        rawVal: val,
        parsed,
        colIndex: allParsedColumns.length
      };
      allParsedColumns.push(colObj);
      registerColumnCheckpoint(colObj);
      if (!parsedTabs['General']) parsedTabs['General'] = [];
      parsedTabs['General'].push(colObj);
    }
  }

  const baselineScores = allParsedColumns.filter(
    c => c.period === 'Baseline' && c.parsed.latestNumeric !== null
  );

  // Build YoY and Trimester Comparative Growth
  const yoyComparisons = [];
  for (const [family, checkpoints] of Object.entries(familyCheckpointsMap)) {
    if (checkpoints.length < 2) continue;

    const sorted = [...checkpoints].sort((a, b) => {
      const yearCmp = (a.year || '').localeCompare(b.year || '');
      if (yearCmp !== 0) return yearCmp;
      if (a.periodOrder !== b.periodOrder) return a.periodOrder - b.periodOrder;
      return (a.colIndex ?? 0) - (b.colIndex ?? 0);
    });

    const hasTrimesters = sorted.some(c => c.period === 'Tri 1' || c.period === 'Tri 2' || c.period === 'Tri 3');
    const stepComparisons = [];

    for (let i = 1; i < sorted.length; i++) {
      const stepPrev = sorted[i - 1];
      const stepCurr = sorted[i];
      const sameYr = Boolean(stepPrev.year && stepPrev.year === stepCurr.year);

      if (hasTrimesters && !sameYr) continue;

      const stepGrowth = computeYoYGrowth(stepPrev.parsed, stepCurr.parsed, family);
      if (stepGrowth.status !== 'unknown') {
        stepComparisons.push({
          fromLabel: sameYr && stepPrev.period ? `${stepPrev.year} ${stepPrev.period}` : (stepPrev.label || stepPrev.year || 'Prev'),
          toLabel: sameYr && stepCurr.period ? `${stepCurr.year} ${stepCurr.period}` : (stepCurr.label || stepCurr.year || 'Curr'),
          shortFrom: stepPrev.period || stepPrev.year || 'Prev',
          shortTo: stepCurr.period || stepCurr.year || 'Curr',
          year: stepCurr.year,
          isSameYear: sameYr,
          prev: stepPrev,
          curr: stepCurr,
          growth: stepGrowth
        });
      }
    }

    if (stepComparisons.length === 0) continue;

    const latestStep = stepComparisons[stepComparisons.length - 1];
    const prevCol = latestStep.prev;
    const currCol = latestStep.curr;
    const growth = latestStep.growth;
    const isSameYear = latestStep.isSameYear;
    const prevLabel = latestStep.fromLabel;
    const currLabel = latestStep.toLabel;
    const shortTransition = isSameYear && prevCol.period && currCol.period
      ? `${prevCol.period} → ${currCol.period}`
      : `${prevLabel} → ${currLabel}`;

    const familyBaseline = baselineScores.find(b => b.family === family && (!currCol.year || b.year === currCol.year))
      || baselineScores.find(b => b.family === family)
      || null;

    const activeYearCheckpoints = hasTrimesters
      ? sorted.filter(c => c.year === currCol.year)
      : sorted;

    yoyComparisons.push({
      family,
      prevYear: prevLabel,
      currYear: currLabel,
      shortTransition,
      isSameYear,
      prev: prevCol,
      curr: currCol,
      growth,
      checkpoints: activeYearCheckpoints,
      stepComparisons,
      baselineCol: familyBaseline
    });
  }

  // Detect headline metrics
  const findFamilyLatest = (famPattern) => {
    const matched = allParsedColumns.filter(
      c => (famPattern.test(c.family) || famPattern.test(c.header)) && c.parsed.latestNumeric !== null
    );
    if (matched.length === 0) return null;
    matched.sort((a, b) => {
      const yearCmp = (b.year || '').localeCompare(a.year || '');
      if (yearCmp !== 0) return yearCmp;
      const orderA = a.periodOrder !== undefined && a.periodOrder !== 99 ? a.periodOrder : -1;
      const orderB = b.periodOrder !== undefined && b.periodOrder !== 99 ? b.periodOrder : -1;
      if (orderB !== orderA) return orderB - orderA;
      return (b.colIndex ?? 0) - (a.colIndex ?? 0);
    });
    return matched[0];
  };

  const amiraCol = findFamilyLatest(/amira.*arm/i);
  const starCol = findFamilyLatest(/star.*reading|star.*irl|instructional.*reading|^star\b/i);
  const mathCol = findFamilyLatest(/math.*percent|math common/i);

  return {
    parsedTabs,
    matchedTabs: Object.keys(parsedTabs),
    yoyComparisons,
    baselineScores,
    allParsedColumns,
    headline: {
      star: starCol,
      math: mathCol,
      amira: amiraCol
    }
  };
}

/**
 * Merge SBAC and Data Portal assessment streams into existing roster students
 */
export function mergeStudentStreams(baseStudents = [], sbacList = [], dataList = []) {
  const sbacMap = new Map();
  (sbacList || []).forEach(s => {
    const id = String(s.studentId || s.id || '').trim();
    if (id) sbacMap.set(id, s);
  });

  const dataMap = new Map();
  (dataList || []).forEach(d => {
    const id = String(d.studentId || d.id || '').trim();
    if (id) dataMap.set(id, d);
  });

  return baseStudents.map(student => {
    const id = String(student.studentId || student.id || '').trim();
    const sbac = sbacMap.get(id) || {};
    const rawData = dataMap.get(id) || {};

    const gradeNum = typeof student.grade === 'number' ? student.grade : parseInt(String(student.grade || '5').replace(/\D/g, ''), 10) || 0;
    const isKinder = gradeNum === 0 || String(student.gradeLevel || student.grade || '').toUpperCase().includes('K');

    // Parse Data Portal assessments
    const parsedData = parseDataPortalStudentRecord(rawData);
    const parsedTabs = parsedData.parsedTabs || {};
    const matchedTabs = parsedData.matchedTabs || [];
    const yoyComparisons = parsedData.yoyComparisons || [];
    const baselineScores = parsedData.baselineScores || [];

    // Extract benchmark headline metrics
    let starReading = parsedData.headline?.star?.parsed?.latest || null;
    let mathCa = parsedData.headline?.math?.parsed?.latest || null;
    let amira = parsedData.headline?.amira?.parsed?.latest || null;
    let kinderWriting = null;

    // Direct multi-attempt fallback search across 1st ELA, 2nd ELA, 3rd ELA, 4th ELA, 5th ELA & Benchmarks tabs
    if (!starReading && rawData.assessmentsByTab) {
      for (const [tabName, tabData] of Object.entries(rawData.assessmentsByTab)) {
        if (/ela|benchmark|reading/i.test(tabName)) {
          for (const [header, val] of Object.entries(tabData || {})) {
            if (/star.*reading|instructional.*reading.*level|^star\b/i.test(header) && val) {
              const p = parseMultiAttempt(val);
              if (p.latest) {
                starReading = p.latest;
                break;
              }
            }
          }
        }
        if (starReading) break;
      }
    }

    // Direct fallback for Math CA across 1st Math, 2nd Math, 3rd Math, 4th Math, 5th Math & Benchmarks
    if (!mathCa && rawData.assessmentsByTab) {
      for (const [tabName, tabData] of Object.entries(rawData.assessmentsByTab)) {
        if (/math|benchmark/i.test(tabName)) {
          for (const [header, val] of Object.entries(tabData || {})) {
            if (/math.*percent|math.*common.*assessment|common.*assessment.*percent/i.test(header) && val) {
              const p = parseMultiAttempt(val);
              if (p.latest) {
                mathCa = p.latest;
                break;
              }
            }
          }
        }
        if (mathCa) break;
      }
    }

    // Direct fallback for Amira across tabs
    if (!amira && rawData.assessmentsByTab) {
      for (const [tabName, tabData] of Object.entries(rawData.assessmentsByTab)) {
        for (const [header, val] of Object.entries(tabData || {})) {
          if (/amira.*arm/i.test(header) && val) {
            const p = parseMultiAttempt(val);
            if (p.latest) {
              amira = p.latest;
              break;
            }
          }
        }
        if (amira) break;
      }
    }

    // Scan Kinder tab specifically if student is Kindergarten
    if (isKinder && !kinderWriting && rawData.assessmentsByTab) {
      const kinderTab = rawData.assessmentsByTab['Kinder'] || rawData.assessmentsByTab['kinder'] || {};
      for (const [header, val] of Object.entries(kinderTab)) {
        const lh = header.toLowerCase();
        if (!amira && lh.includes('amira')) {
          const p = parseMultiAttempt(val);
          if (p.latest) amira = p.latest;
        }
        if (!kinderWriting && (lh.includes('writing') || lh.includes('rubric'))) {
          const p = parseMultiAttempt(val);
          if (p.latest) kinderWriting = p.latest;
        }
      }
    }

    // SBAC metrics
    const latestEla = sbac.latestEla || student.latestEla || null;
    const latestMath = sbac.latestMath || student.latestMath || null;
    const elaDelta = sbac.elaDelta ?? student.elaDelta ?? null;
    const mathDelta = sbac.mathDelta ?? student.mathDelta ?? null;
    const rawElaHistory = sbac.elaHistory || sbac.history?.filter(h => h.testId?.toLowerCase().includes('ela')) || [];
    const rawMathHistory = sbac.mathHistory || sbac.history?.filter(h => h.testId?.toLowerCase().includes('math')) || [];
    const rawPlacements = sbac.mathPlacements || sbac.placements || [];

    // Sort histories chronologically
    const elaHistory = [...rawElaHistory].sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0));
    const mathHistory = [...rawMathHistory].sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0));
    const mathPlacements = [...rawPlacements].sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0));

    return Object.assign({}, student, {
      gradeNum,
      isKinder,
      assessmentsByTab: parsedTabs,
      matchedTabs,
      yoyComparisons,
      baselineScores,
      benchmarks: {
        starReading,
        mathCa,
        amira,
        kinderWriting,
        rawTabs: matchedTabs
      },
      sbac: {
        latestEla,
        latestMath,
        elaDelta,
        mathDelta,
        elaHistory,
        mathHistory,
        mathPlacements,
        hasSbacData: Boolean(latestEla || latestMath || elaHistory.length > 0 || mathHistory.length > 0)
      }
    });
  });
}

/**
 * Generate rich, copy-ready NotebookLM prompts depending on current active tab
 */
export function generateNotebookLMPrompt(student, mode = 'overview') {
  if (!student) return '';

  const flags = [];
  if (student.flags?.sped) flags.push('SPED / IEP');
  if (student.flags?.plan504) flags.push('504 Plan');
  if (student.flags?.elStatus && student.flags.elStatus !== 'EO') flags.push(`EL (${student.flags.elStatus})`);
  if (student.flags?.homelessFoster) flags.push('Foster/Homeless');

  const flagText = flags.length > 0 ? flags.join(', ') : 'None documented';

  if (mode === 'benchmarks') {
    return `# Student Success Team (SST) Intervention Brief
**Student:** ${student.name} (Grade: ${student.gradeLevel || student.grade})
**School:** ${student.school} | **Teacher:** ${student.teacherName}
**Demographic Flags:** ${flagText}

## Local Trimester & Benchmark Snapshot
- **STAR Reading:** ${student.benchmarks?.starReading || student.benchmarks?.amira || 'Not recorded'}
- **Math Common Assessment:** ${student.benchmarks?.mathCa || 'Not recorded'}
${student.isKinder ? `- **Kindergarten Amira:** ${student.benchmarks?.amira || 'Not recorded'}\n- **Kindergarten Writing Assessment:** ${student.benchmarks?.kinderWriting || 'Not recorded'}` : ''}

## Comparative Growth & Checkpoints:
${(student.yoyComparisons || []).map(c => `- **${c.family}:** ${c.growth?.description || c.shortTransition}`).join('\n') || '- No multi-trimester checkpoints recorded'}

## Assessment Records by Tab:
${Object.entries(student.assessmentsByTab || {})
  .map(([tab, cols]) => `### Tab: ${tab}\n${(cols || []).map(col => `- ${col.baseName || col.header} (${col.label || col.year || ''}): ${col.parsed?.latest ?? col.rawVal}`).join('\n')}`)
  .join('\n\n')}

---
### NotebookLM Prompt Instructions:
Please analyze this student's assessment trends, identify areas of significant growth or decline across trimesters, and draft 3 Tier-2 classroom intervention goals with corresponding progress monitoring check-ins.`;
  }

  if (mode === 'sbac') {
    return `# CAASPP / SBAC Assessment & Standards Mastery Brief
**Student:** ${student.name} (Grade: ${student.gradeLevel || student.grade})
**School:** ${student.school} | **Teacher:** ${student.teacherName}
**Demographic Flags:** ${flagText}

## Latest Smarter Balanced Performance
- **ELA Overall Score:** ${student.sbac?.latestEla?.scaledScore || 'N/A'} (Level ${student.sbac?.latestEla?.performanceLevel || 'N/A'})
- **ELA YoY Delta:** ${student.sbac?.elaDelta !== null && student.sbac?.elaDelta !== undefined ? `${student.sbac.elaDelta > 0 ? '+' : ''}${student.sbac.elaDelta} pts` : 'No prior test'}
- **Mathematics Overall Score:** ${student.sbac?.latestMath?.scaledScore || 'N/A'} (Level ${student.sbac?.latestMath?.performanceLevel || 'N/A'})
- **Math YoY Delta:** ${student.sbac?.mathDelta !== null && student.sbac?.mathDelta !== undefined ? `${student.sbac.mathDelta > 0 ? '+' : ''}${student.sbac.mathDelta} pts` : 'No prior test'}

## Historical ELA Trajectory:
${(student.sbac?.elaHistory || []).map(h => `- Year ${h.year} (${h.dateTaken || ''}): Scale Score ${h.scaledScore} (Level ${h.performanceLevel})`).join('\n') || '- No ELA test records'}

## Historical Mathematics Trajectory:
${(student.sbac?.mathHistory || []).map(h => `- Year ${h.year} (${h.dateTaken || ''}): Scale Score ${h.scaledScore} (Level ${h.performanceLevel})`).join('\n') || '- No Math test records'}

---
### NotebookLM Prompt Instructions:
Based on this student's SBAC performance and year-over-year trajectory, generate calibrated instructional accommodations, target California state standards for remediation, and draft specific SMART goals suitable for an IEP, 504 plan, or SST review.`;
  }

  if (mode === 'elpac') {
    return `# ELPAC & English Language Development (ELD) Profile
**Student:** ${student.name} (Grade: ${student.gradeLevel || student.grade})
**School:** ${student.school} | **Teacher:** ${student.teacherName}
**Language Proficiency Status:** ${student.flags?.elStatus || 'LEP'}
**Demographic Flags:** ${flagText}

## Latest ELPAC Scores:
- **Overall Performance:** ${student.latestOverall?.rawLevel || (student.latestOverall?.performanceLevel ? `Level ${student.latestOverall.performanceLevel}` : 'Not recorded')} (Scale Score: ${student.latestOverall?.scaledScore || '—'})
- **Oral Language:** ${student.latestOral?.rawLevel || (student.latestOral?.performanceLevel ? `Level ${student.latestOral.performanceLevel}` : 'Not recorded')}
- **Written Language:** ${student.latestWritten?.rawLevel || (student.latestWritten?.performanceLevel ? `Level ${student.latestWritten.performanceLevel}` : 'Not recorded')}

## Teacher / Counselor Observations:
${(student.teacherComments || []).map(c => `- [${c.academicYear || 'Current'} ${c.testWindow || ''}]: ${c.comment}`).join('\n') || 'No teacher observations recorded.'}

---
### NotebookLM Prompt Instructions:
Review this student's ELPAC domain balance (Oral vs. Written) and teacher notes. Provide 3 specific English Language Development (ELD) classroom strategies aligned with the California ELD Standards and evaluate readiness for reclassification (RFEP).`;
  }

  // Master 360 Overview
  return `# Complete WVUSD 360° Student Assessment Portfolio
**Student:** ${student.name} (ID: #${student.studentId || student.id})
**Grade:** ${student.gradeLevel || student.grade} | **School:** ${student.school}
**Teacher:** ${student.teacherName}
**Program Flags:** ${flagText}

## 1. Local Benchmarks & Classroom Growth
- STAR Reading: ${student.benchmarks?.starReading || student.benchmarks?.amira || 'N/A'}
- Math Common Assessment: ${student.benchmarks?.mathCa || 'N/A'}
${student.isKinder ? `- Amira Kindergarten: ${student.benchmarks?.amira || 'N/A'}\n- Kindergarten Writing: ${student.benchmarks?.kinderWriting || 'N/A'}` : ''}

## 2. State Standardized Assessments (SBAC)
${student.isKinder ? '*Kindergarten students do not take SBAC.*' : `- ELA: ${student.sbac?.latestEla?.scaledScore || 'N/A'} (Level ${student.sbac?.latestEla?.performanceLevel || 'N/A'})\n- Math: ${student.sbac?.latestMath?.scaledScore || 'N/A'} (Level ${student.sbac?.latestMath?.performanceLevel || 'N/A'})`}

## 3. English Language Proficiency (ELPAC)
- Status: ${student.flags?.elStatus || 'EO'}
- Overall: ${student.latestOverall?.rawLevel || 'N/A'}
- Oral: ${student.latestOral?.rawLevel || 'N/A'}
- Written: ${student.latestWritten?.rawLevel || 'N/A'}

---
### NotebookLM Prompt Instructions:
Synthesize this holistic 360° assessment portfolio. Identify cross-assessment patterns, highlight primary academic risk factors, and recommend customized Tier 1/2 classroom accommodations.`;
}
