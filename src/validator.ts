import * as fs from 'fs';
import * as path from 'path';

export interface ValidationResult {
  accepted: boolean;
  reason: string;
  filePath: string;
  fileName: string;
  wordCount: number;
  fileSize: number;
}

const MIN_WORD_COUNT = 100;
const MAX_WORD_COUNT = 50000;
const ACCEPTED_EXTENSIONS = ['.txt', '.md'];

export function validateDocument(filePath: string): ValidationResult {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  // Check file exists
  if (!fs.existsSync(filePath)) {
    return {
      accepted: false,
      reason: `File not found: ${filePath}`,
      filePath,
      fileName,
      wordCount: 0,
      fileSize: 0
    };
  }

  // Check file extension
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return {
      accepted: false,
      reason: `File type not supported: ${ext}. Accepted types: ${ACCEPTED_EXTENSIONS.join(', ')}. For PDF or DOCX, please convert to .txt first.`,
      filePath,
      fileName,
      wordCount: 0,
      fileSize: 0
    };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const fileSize = fs.statSync(filePath).size;

  // Check word count minimum
  if (wordCount < MIN_WORD_COUNT) {
    return {
      accepted: false,
      reason: `Document too short (${wordCount} words). Minimum ${MIN_WORD_COUNT} words required. This does not appear to be a complete contract.`,
      filePath,
      fileName,
      wordCount,
      fileSize
    };
  }

  // Check word count maximum
  if (wordCount > MAX_WORD_COUNT) {
    return {
      accepted: false,
      reason: `Document too long (${wordCount} words). Maximum ${MAX_WORD_COUNT} words. This document exceeds the scope of this triage tool — escalate to manual review.`,
      filePath,
      fileName,
      wordCount,
      fileSize
    };
  }

  return {
    accepted: true,
    reason: 'Document passed validation',
    filePath,
    fileName,
    wordCount,
    fileSize
  };
}
