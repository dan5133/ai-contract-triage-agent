import * as fs from 'fs';
import * as path from 'path';
import { ClassificationResult } from './classifier.js';
import { ExtractionResult } from './extractor.js';
import { ValidationResult } from './validator.js';

export interface TriageOutput {
  runId: string;
  timestamp: string;
  fileName: string;
  validation: ValidationResult;
  classification: ClassificationResult;
  extraction?: ExtractionResult;
  timeSavedMinutes?: number;
  status: 'SUCCESS' | 'REJECTED' | 'ERROR';
  rejectionReason?: string;
}

const OUTPUTS_DIR = './data/outputs';
const LOGS_DIR = './data/logs';
const REJECTIONS_LOG = path.join(LOGS_DIR, 'rejections.json');
const RUNS_LOG = path.join(LOGS_DIR, 'runs.json');

// Ensure directories exist
export function ensureDirectories(): void {
  [OUTPUTS_DIR, LOGS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Generate unique run ID
export function generateRunId(): string {
  return `triage-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

// Write successful triage output
export function writeOutput(output: TriageOutput): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = output.fileName.replace(/\.[^/.]+$/, '');

  // Write JSON output
  const jsonPath = path.join(OUTPUTS_DIR, `${baseName}-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));

  // Write human-readable summary
  const summaryPath = path.join(OUTPUTS_DIR, `${baseName}-${timestamp}-summary.txt`);
  fs.writeFileSync(summaryPath, formatSummary(output));

  console.log(`\n✅ Output written to:\n   ${jsonPath}\n   ${summaryPath}`);
}

// Log rejection
export function logRejection(output: TriageOutput): void {
  let rejections: TriageOutput[] = [];

  if (fs.existsSync(REJECTIONS_LOG)) {
    try {
      rejections = JSON.parse(fs.readFileSync(REJECTIONS_LOG, 'utf8'));
    } catch {
      rejections = [];
    }
  }

  rejections.push(output);
  fs.writeFileSync(REJECTIONS_LOG, JSON.stringify(rejections, null, 2));
}

// Log all runs
export function logRun(output: TriageOutput): void {
  let runs: TriageOutput[] = [];

  if (fs.existsSync(RUNS_LOG)) {
    try {
      runs = JSON.parse(fs.readFileSync(RUNS_LOG, 'utf8'));
    } catch {
      runs = [];
    }
  }

  runs.push(output);
  fs.writeFileSync(RUNS_LOG, JSON.stringify(runs, null, 2));
}

// Format human-readable summary
function formatSummary(output: TriageOutput): string {
  const ext = output.extraction;
  const cls = output.classification;

  let summary = `
PORTSWIGGER CONTRACT TRIAGE SUMMARY
=====================================
Run ID:        ${output.runId}
Timestamp:     ${output.timestamp}
File:          ${output.fileName}
Status:        ${output.status}
Document Type: ${cls.documentType}
Confidence:    ${Math.round(cls.confidence * 100)}%

TIME ANALYSIS
-------------
Estimated manual reading: ${ext?.estimatedManualReadingMinutes || 0} minutes
Triage time:              ${ext?.triageTimeSeconds || 0} seconds
Time saved:               ~${output.timeSavedMinutes || 0} minutes

`;

  if (ext) {
    summary += `STANDARD CLAUSES (no review needed)
-------------------------------------
${ext.standardClauses.map(c => `✓ ${c}`).join('\n')}

KEY TERMS
---------
${Object.entries(ext.keyTerms).map(([k, v]) => `${k}: ${v}`).join('\n')}

`;

    if (ext.nonStandardClauses.length > 0) {
      summary += `NON-STANDARD CLAUSES (flagged for review)
------------------------------------------
${ext.nonStandardClauses.map(c => `
⚠️  ${c.clauseType} [${c.riskLevel}]
   Location: ${c.location}
   Issue: ${c.description}
   Review reason: ${c.reviewReason}
`).join('')}
`;
    } else {
      summary += `NON-STANDARD CLAUSES
--------------------
None identified — document appears standard.\n\n`;
    }

    summary += `HUMAN REVIEW REQUIRED
----------------------
${ext.humanReviewItems.length > 0
  ? ext.humanReviewItems.map(item => `→ ${item}`).join('\n')
  : '→ Standard document — routine sign-off only'}

`;
  }

  summary += `
DATA HANDLING NOTE
------------------
This document was processed using the Anthropic Claude API.
Document content was transmitted to the Anthropic API for classification only.
No document content is stored externally.
Output is stored locally in /data/outputs/
For production deployment, review data handling against your DPA obligations.

⚠️  THIS TRIAGE DOES NOT CONSTITUTE LEGAL REVIEW
   All flagged items require human legal judgment before proceeding.
=====================================
`;

  return summary;
}
