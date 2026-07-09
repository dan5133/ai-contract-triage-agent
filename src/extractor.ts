import Anthropic from '@anthropic-ai/sdk';
import { DocumentType } from './classifier.js';

export interface ClauseFlag {
  clauseType: string;
  location: string;
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  humanReviewRequired: boolean;
  reviewReason?: string;
}

export interface ExtractionResult {
  standardClauses: string[];
  nonStandardClauses: ClauseFlag[];
  humanReviewItems: string[];
  keyTerms: Record<string, string>;
  estimatedManualReadingMinutes: number;
  triageTimeSeconds: number;
}

const READING_SPEEDS: Record<DocumentType, number> = {
  'MUTUAL_NDA': 25,
  'ORDER_FORM': 15,
  'UNKNOWN': 0
};

export async function extractClauses(
  client: Anthropic,
  content: string,
  documentType: DocumentType,
  startTime: number
): Promise<ExtractionResult> {

  const extractionPrompt = documentType === 'MUTUAL_NDA'
    ? getNDAPrompt()
    : getOrderFormPrompt();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: extractionPrompt,
    messages: [{
      role: 'user',
      content: `Extract and analyse this ${documentType}:\n\n${content}`
    }]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';

  try {
    const result = JSON.parse(text.replace(/```json|```/g, '').trim());
    const triageTimeSeconds = Math.round((Date.now() - startTime) / 1000);

    return {
      ...result,
      estimatedManualReadingMinutes: READING_SPEEDS[documentType],
      triageTimeSeconds
    };
  } catch {
    throw new Error('Failed to extract clauses from document');
  }
}

function getNDAPrompt(): string {
  return `You are a contract triage specialist reviewing Mutual NDAs.

Your job is to identify what is standard boilerplate and what requires human attention.
You do NOT give legal advice. You NAME the clauses and FLAG anomalies for human review.

Standard NDA clauses (boilerplate — typically no review needed):
- Definition of Confidential Information
- Standard exclusions (public domain, independently developed, legal requirement)
- Standard obligation of confidentiality
- Standard term and termination
- Standard governing law (England and Wales)
- Standard notice provisions

Flag for human review:
- Unusually long confidentiality periods (over 3 years)
- Unilateral rather than mutual obligations
- Very broad or very narrow definitions of Confidential Information  
- Non-standard jurisdiction or governing law
- Unusual remedies or liquidated damages clauses
- Missing standard exclusions
- Any clause the reviewer has annotated or marked

Respond ONLY with valid JSON:
{
  "standardClauses": ["list of standard clauses present"],
  "nonStandardClauses": [
    {
      "clauseType": "clause name",
      "location": "section number or paragraph",
      "description": "what is non-standard about it",
      "riskLevel": "LOW|MEDIUM|HIGH",
      "humanReviewRequired": true,
      "reviewReason": "why human needs to review this"
    }
  ],
  "humanReviewItems": ["explicit list of items requiring human decision"],
  "keyTerms": {
    "parties": "Party A and Party B names",
    "term": "duration of agreement",
    "jurisdiction": "governing law",
    "confidentialityPeriod": "how long after termination"
  }
}`;
}

function getOrderFormPrompt(): string {
  return `You are a contract triage specialist reviewing Customer Order Forms.

Your job is to identify what is standard and what requires human attention.
You do NOT give legal advice. You NAME the items and FLAG anomalies for human review.

Standard order form items (boilerplate):
- Standard payment terms (30 days)
- Standard delivery terms
- Standard warranty period
- Reference to master agreement or standard T&Cs
- Standard limitation of liability

Flag for human review:
- Non-standard payment terms
- Unusual liability caps or unlimited liability
- Custom SLA requirements
- Non-standard IP ownership terms
- Missing reference to governing agreement
- Unusual termination rights
- Any handwritten amendments or redlines

Respond ONLY with valid JSON:
{
  "standardClauses": ["list of standard items present"],
  "nonStandardClauses": [
    {
      "clauseType": "item name",
      "location": "section or line reference",
      "description": "what is non-standard",
      "riskLevel": "LOW|MEDIUM|HIGH",
      "humanReviewRequired": true,
      "reviewReason": "why human needs to review"
    }
  ],
  "humanReviewItems": ["explicit list of items requiring human decision"],
  "keyTerms": {
    "customer": "customer name",
    "value": "order value if stated",
    "paymentTerms": "payment terms",
    "deliveryDate": "required delivery if stated",
    "governingAgreement": "master agreement referenced"
  }
}`;
}
