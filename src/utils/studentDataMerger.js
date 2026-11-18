// src/utils/studentDataMerger.js
// Joins multi-source assessment data by Student ID and builds AI NotebookLM prompts

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
    const data = dataMap.get(id) || {};

    const gradeNum = typeof student.grade === 'number' ? student.grade : parseInt(String(student.grade || '5').replace(/\D/g, ''), 10) || 0;
    const isKinder = gradeNum === 0 || String(student.gradeLevel || '').toUpperCase().includes('K');

    // Extract Data Portal / Benchmark metrics
    const assessmentsByTab = Object.assign({}, student.assessmentsByTab || {}, data.assessmentsByTab || {});
    const metrics = Object.assign({}, student.metrics || {}, data.metrics || {});

    // Benchmark specific extractions (STAR Reading, Math CA, Kinder Amira)
    let starReading = null;
    let mathCa = null;
    let amira = null;
    let kinderWriting = null;

    // Scan metrics & assessmentsByTab
    for (const [key, val] of Object.entries(metrics)) {
      const lower = key.toLowerCase();
      if (lower.includes('star reading') || lower.includes('star read') || lower === 'star') {
        starReading = val;
      } else if (lower.includes('math ca') || lower.includes('math common') || lower.includes('common assessment')) {
        mathCa = val;
      } else if (lower.includes('amira')) {
        amira = val;
      } else if (lower.includes('writing') && isKinder) {
        kinderWriting = val;
      }
    }

    // Inspect Kinder tab specifically if available
    const kinderTab = assessmentsByTab['Kinder'] || assessmentsByTab['kinder'] || {};
    for (const [kKey, kVal] of Object.entries(kinderTab)) {
      const lk = kKey.toLowerCase();
      if (lk.includes('amira')) amira = kVal;
      if (lk.includes('writing') || lk.includes('rubric')) kinderWriting = kVal;
    }

    // SBAC metrics
    const latestEla = sbac.latestEla || student.latestEla || null;
    const latestMath = sbac.latestMath || student.latestMath || null;
    const elaDelta = sbac.elaDelta ?? student.elaDelta ?? null;
    const mathDelta = sbac.mathDelta ?? student.mathDelta ?? null;
    const elaHistory = sbac.elaHistory || sbac.history?.filter(h => h.testId?.toLowerCase().includes('ela')) || [];
    const mathHistory = sbac.mathHistory || sbac.history?.filter(h => h.testId?.toLowerCase().includes('math')) || [];
    const mathPlacement = sbac.placement || sbac.mathPlacement || null;

    return Object.assign({}, student, {
      gradeNum,
      isKinder,
      assessmentsByTab,
      metrics,
      benchmarks: {
        starReading,
        mathCa,
        amira,
        kinderWriting,
        rawTabs: Object.keys(assessmentsByTab)
      },
      sbac: {
        latestEla,
        latestMath,
        elaDelta,
        mathDelta,
        elaHistory,
        mathHistory,
        mathPlacement,
        hasSbacData: Boolean(latestEla || latestMath)
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
- **STAR Reading:** ${student.benchmarks?.starReading || 'Not recorded'}
- **Math Common Assessment:** ${student.benchmarks?.mathCa || 'Not recorded'}
${student.isKinder ? `- **Kindergarten Amira:** ${student.benchmarks?.amira || 'Not recorded'}\n- **Kindergarten Writing Assessment:** ${student.benchmarks?.kinderWriting || 'Not recorded'}` : ''}

## Assessment Metrics by Tab:
${Object.entries(student.assessmentsByTab || {})
  .map(([tab, scores]) => `### Tab: ${tab}\n${Object.entries(scores).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`)
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
- **ELA Overall Score:** ${student.sbac?.latestEla?.scaledScore || 'N/A'} (${student.sbac?.latestEla?.rawLevel || 'N/A'})
- **ELA YoY Delta:** ${student.sbac?.elaDelta !== null && student.sbac?.elaDelta !== undefined ? `${student.sbac.elaDelta > 0 ? '+' : ''}${student.sbac.elaDelta} pts` : 'No prior test'}
- **Mathematics Overall Score:** ${student.sbac?.latestMath?.scaledScore || 'N/A'} (${student.sbac?.latestMath?.rawLevel || 'N/A'})
- **Math YoY Delta:** ${student.sbac?.mathDelta !== null && student.sbac?.mathDelta !== undefined ? `${student.sbac.mathDelta > 0 ? '+' : ''}${student.sbac.mathDelta} pts` : 'No prior test'}

## Historical Trajectory:
- ELA Records: ${JSON.stringify(student.sbac?.elaHistory || [])}
- Math Records: ${JSON.stringify(student.sbac?.mathHistory || [])}

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
Review this student's ELPAC domain balance (Oral vs. Written) and teacher notes. Provide 3 specific English Language Development (ELD) classroom strategies aligned with the California ELD Standards (Emerging, Expanding, or Bridging) and evaluate their readiness for reclassification (RFEP).`;
  }

  // Master 360 Overview
  return `# Complete WVUSD 360° Student Assessment Portfolio
**Student:** ${student.name} (ID: #${student.studentId || student.id})
**Grade:** ${student.gradeLevel || student.grade} | **School:** ${student.school}
**Teacher:** ${student.teacherName} (${student.teacherEmail || 'N/A'})
**Program Flags:** ${flagText}

## 1. Local Benchmarks & Classroom Growth
- STAR Reading: ${student.benchmarks?.starReading || 'N/A'}
- Math Common Assessment: ${student.benchmarks?.mathCa || 'N/A'}
${student.isKinder ? `- Amira Kindergarten: ${student.benchmarks?.amira || 'N/A'}\n- Kindergarten Writing: ${student.benchmarks?.kinderWriting || 'N/A'}` : ''}

## 2. State Standardized Assessments (SBAC)
${student.isKinder ? '*Kindergarten students do not take SBAC.*' : `- ELA: ${student.sbac?.latestEla?.scaledScore || 'N/A'} (${student.sbac?.latestEla?.rawLevel || 'N/A'})\n- Math: ${student.sbac?.latestMath?.scaledScore || 'N/A'} (${student.sbac?.latestMath?.rawLevel || 'N/A'})`}

## 3. English Language Proficiency (ELPAC)
- Status: ${student.flags?.elStatus || 'EO'}
- Overall: ${student.latestOverall?.rawLevel || 'N/A'}
- Oral: ${student.latestOral?.rawLevel || 'N/A'}
- Written: ${student.latestWritten?.rawLevel || 'N/A'}

---
### NotebookLM Prompt Instructions:
Synthesize this holistic 360° assessment portfolio. Identify cross-assessment patterns (e.g., correlations between language fluency and math/reading standardized test results), highlight primary academic risk factors, and recommend customized Tier 1/2 classroom accommodations.`;
}
