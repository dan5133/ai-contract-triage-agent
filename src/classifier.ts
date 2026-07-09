import Anthropic from '@anthropic-ai/sdk';

export type DocumentType = 'MUTUAL_NDA' | 'ORDER_FORM' | 'UNKNOWN';

export interface ClassificationResult {
  documentType: DocumentType;
  confidence: number;
  reasoning: string;
  accepted: boolean;
  rejectionReason?: string;
}

const CONFIDENCE_THRESHOLD = 0.80;

export async function classifyDocument(
  client: Anthropic,
  content: string
): Promise<ClassificationResult> {

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are a contract classification specialist.
    
Your ONLY job is to determine if a document is one of two types:
1. MUTUAL_NDA - A mutual non-disclosure agreement between two parties
2. ORDER_FORM - A customer order form or purchase order

You must respond with ONLY valid JSON in this exact format:
{
  "documentType": "MUTUAL_NDA" or "ORDER_FORM" or "UNKNOWN",
  "confidence": 0.0 to 1.0,
  "reasoning": "one sentence explaining your classification"
}

If you are not confident this is one of the two accepted types, return UNKNOWN.
Never guess. UNKNOWN is always the correct answer when uncertain.`,
    messages: [{
      role: 'user',
      content: `Classify this document:\n\n${content.substring(0, 3000)}`
    }]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const result = JSON.parse(text.replace(/```json|```/g, '').trim());

    if (result.documentType === 'UNKNOWN') {
      return {
        documentType: 'UNKNOWN',
        confidence: result.confidence,
        reasoning: result.reasoning,
        accepted: false,
        rejectionReason: `Document type not recognised as NDA or Order Form. This triage tool accepts: Mutual NDAs and Customer Order Forms only. Reason: ${result.reasoning}`
      };
    }

    if (result.confidence < CONFIDENCE_THRESHOLD) {
      return {
        documentType: result.documentType,
        confidence: result.confidence,
        reasoning: result.reasoning,
        accepted: false,
        rejectionReason: `Classification confidence too low (${Math.round(result.confidence * 100)}%). Minimum required: ${CONFIDENCE_THRESHOLD * 100}%. Escalating to manual review.`
      };
    }

    return {
      documentType: result.documentType,
      confidence: result.confidence,
      reasoning: result.reasoning,
      accepted: true
    };

  } catch {
    return {
      documentType: 'UNKNOWN',
      confidence: 0,
      reasoning: 'Failed to parse classification response',
      accepted: false,
      rejectionReason: 'Internal classification error — escalating to manual review'
    };
  }
}
