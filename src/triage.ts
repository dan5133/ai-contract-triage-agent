import * as dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { validateDocument } from './validator.js';
import { classifyDocument } from './classifier.js';
import { extractClauses } from './extractor.js';
import {
  ensureDirectories,
  generateRunId,
  writeOutput,
  logRejection,
  logRun,
  TriageOutput
} from './logger.js';

dotenv.config();

async function main() {
  const startTime = Date.now();
  ensureDirectories();

  // --- ENTRY POINT ---
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('\n❌ ERROR: No document provided.');
    console.error('Usage: npm run triage <path-to-document>');
    console.error('Example: npm run triage ./sample-docs/sample-nda.txt\n');
    process.exit(1);
  }

  console.log(`\n📄 PORTSWIGGER CONTRACT TRIAGE`);
  console.log(`================================`);
  console.log(`File: ${filePath}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  const runId = generateRunId();
  const timestamp = new Date().toISOString();

  // --- STEP 1: VALIDATE ---
  console.log('Step 1/3: Validating document...');
  const validation = validateDocument(filePath);

  if (!validation.accepted) {
    console.error(`\n❌ DOCUMENT REJECTED — VALIDATION FAILED`);
    console.error(`Reason: ${validation.reason}\n`);

    const output: TriageOutput = {
      runId,
      timestamp,
      fileName: validation.fileName,
      validation,
      classification: {
        documentType: 'UNKNOWN',
        confidence: 0,
        reasoning: 'Not reached — validation failed',
        accepted: false,
        rejectionReason: validation.reason
      },
      status: 'REJECTED',
      rejectionReason: validation.reason
    };

    logRejection(output);
    logRun(output);
    process.exit(1);
  }

  console.log(`   ✓ Valid document (${validation.wordCount} words, ${Math.round(validation.fileSize / 1024)}KB)`);

  // --- STEP 2: CLASSIFY ---
  console.log('Step 2/3: Classifying document type...');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('\n❌ ERROR: ANTHROPIC_API_KEY not set in .env file');
    process.exit(1);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const fs = await import('fs');
  const content = fs.readFileSync(filePath, 'utf8');

  const classification = await classifyDocument(client, content);

  if (!classification.accepted) {
    console.error(`\n❌ DOCUMENT REJECTED — TYPE NOT ACCEPTED`);
    console.error(`Reason: ${classification.rejectionReason}\n`);
    console.error(`This triage tool accepts: Mutual NDAs and Customer Order Forms only.\n`);

    const output: TriageOutput = {
      runId,
      timestamp,
      fileName: validation.fileName,
      validation,
      classification,
      status: 'REJECTED',
      rejectionReason: classification.rejectionReason
    };

    logRejection(output);
    logRun(output);
    process.exit(1);
  }

  console.log(`   ✓ Document type: ${classification.documentType} (${Math.round(classification.confidence * 100)}% confidence)`);

  // --- STEP 3: EXTRACT ---
  console.log('Step 3/3: Extracting and flagging clauses...');

  const extraction = await extractClauses(
    client,
    content,
    classification.documentType,
    startTime
  );

  const timeSavedMinutes = extraction.estimatedManualReadingMinutes -
    Math.round(extraction.triageTimeSeconds / 60);

  console.log(`   ✓ Found ${extraction.standardClauses.length} standard clauses`);
  console.log(`   ✓ Flagged ${extraction.nonStandardClauses.length} non-standard clauses`);
  console.log(`   ✓ ${extraction.humanReviewItems.length} items require human review`);

  // --- OUTPUT ---
  const output: TriageOutput = {
    runId,
    timestamp,
    fileName: validation.fileName,
    validation,
    classification,
    extraction,
    timeSavedMinutes: Math.max(0, timeSavedMinutes),
    status: 'SUCCESS'
  };

  writeOutput(output);
  logRun(output);

  console.log(`\n✅ TRIAGE COMPLETE`);
  console.log(`   Time saved: ~${Math.max(0, timeSavedMinutes)} minutes vs manual review`);
  console.log(`   Human review items: ${extraction.humanReviewItems.length}`);

  if (extraction.humanReviewItems.length > 0) {
    console.log(`\n⚠️  ITEMS REQUIRING HUMAN REVIEW:`);
    extraction.humanReviewItems.forEach(item => {
      console.log(`   → ${item}`);
    });
  }

  console.log(`\n📋 Full summary saved to /data/outputs/\n`);
}

main().catch(error => {
  console.error('\n❌ UNEXPECTED ERROR:', error.message);
  console.error('Document preserved. No partial output written.');
  process.exit(1);
});
