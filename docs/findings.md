# What I Built, What I Learned, What I Would Not Automate
## Adnan Siddiqi | PortSwigger AI Pioneer Application

## What the Prototype Does
Triages Mutual NDAs and Customer Order Forms using a three-step pipeline:
1. Validates the document meets acceptance criteria
2. Classifies the document type with confidence scoring
3. Extracts standard and non-standard clauses, flags human review items

Time saving per document: approximately 20-23 minutes vs manual reading.

## What It Gets Right
- Document type classification — NDAs and order forms have consistent structural
  patterns that Claude identifies reliably
- Standard clause detection — boilerplate is genuinely boilerplate
- Non-standard clause flagging — unusual terms are surfaced with location references
- Rejection logic — unknown document types are rejected clearly, not guessed

## What It Gets Wrong
- Nuanced redlines — subtle wording changes that alter legal meaning
  are sometimes missed
- Context-dependent clauses — a liability cap that is standard in one
  industry is unusual in another. The agent does not know the industry context
- Handwritten amendments — text files cannot capture physical annotations
- Intent — the agent reads what is written, not what was meant

## What I Would Never Automate
- The decision to accept or reject a contract
- Legal judgment on clause acceptability
- Anything where being wrong has financial or legal consequences

The agent's job is to make the human's reading time more valuable —
not to replace the human.

## The Eval — Did It Actually Help?
Measured on live sample NDA document:
- Triage time: 26 seconds
- Estimated manual reading time: 25 minutes
- Document correctly classified: YES (99% confidence)
- Standard clauses confirmed: 6
- Non-standard clauses flagged: 4 (2 HIGH risk, 2 MEDIUM risk)
- Case law cited by agent: Cavendish Square v Makdessi [2015]
- Time saved: ~25 minutes per document

Conclusion: Useful for triage. Not sufficient for review.
The 80% of boilerplate is handled in 26 seconds.
The 20% that matters is surfaced with specific locations,
risk ratings, and review reasons.
That was the goal. That is what it delivers.

**Conclusion: Useful for triage. Not sufficient for review.**

The 80% of boilerplate is handled. The 20% that matters still needs a human.
That was the goal. That is what it delivers.
## Test Results Across All Document Types

| Document | Result | Time |
|----------|--------|------|
| Mutual NDA | SUCCESS — 99% confidence, 4 flags, 25 min saved | 26 sec |
| Customer Order Form | SUCCESS — 97% confidence, 7 flags, 15 min saved | 25 sec |
| Employment Contract | REJECTED at classification — correct type identified | 8 sec |
| Too short / incomplete | REJECTED at validation — 27 words below minimum | <1 sec |

Rejection logic works at both layers.
Valid documents processed. Invalid documents rejected cleanly.
No partial outputs. No silent failures.

## What a Two-Week Sprint Would Look Like
Week 1:
- Classify and process the existing contract backlog
- Identify the top 10 clause types that generate the most redlines
- Build a pattern library from historical decisions
- Measure actual time saved vs baseline

Week 2:
- Evaluate accuracy against legal team's known decisions
- Document every case where the agent got it wrong and why
- Define production governance rules based on failure patterns
- Hand over with a maintenance playbook so it keeps running when I leave

## The Governance Finding
When I first built this agent, it attempted to provide legal conclusions —
not just flag clauses, but assess their acceptability.

I removed that capability deliberately.

An agent that tells you a clause is "acceptable" is an agent
that will eventually tell you something is acceptable when it is not.
The confidence is indistinguishable from the error.

The safer design: name the clause, describe what is unusual,
hand to human. Always.

This is the same pattern I documented in my QA governance framework.
Agents are competent classifiers. They are unreliable judges.
