# ai-contract-triage-agent
## Submitted by Adnan Siddiqi | AI Pioneer Application

## What This Is
An AI-assisted contract triage tool that classifies incoming contracts,
identifies standard boilerplate, flags non-standard clauses, and
surfaces items requiring human legal review.

Built in TypeScript using the Anthropic Claude API.

## Setup

1. Install Node.js v20 from https://nodejs.org
2. Clone or unzip this folder
3. Run: npm install
4. Copy .env.example to .env
5. Add your Anthropic API key to .env
6. Run: npm run triage ./sample-docs/sample-nda.txt

## Usage

```bash
npm run triage <path-to-document>
Accepted document types:
•	Mutual NDA (.txt)
•	Customer Order Form (.txt)
All other document types are rejected with a clear console message.
Output
•	JSON output: /data/outputs/[filename]-[timestamp].json
•	Summary: /data/outputs/[filename]-[timestamp]-summary.txt
•	Rejection log: /data/logs/rejections.json
•	All runs log: /data/logs/runs.json
Data Handling
Document content is transmitted to the Anthropic Claude API for classification only. No content is stored externally. Output is written locally to /data/outputs/. For production deployment, review against your DPA obligations.
Sample Documents
Five sample documents included in /sample-docs/ for testing.
GitHub Portfolio
github.com/dan5133 — AI-native testing frameworks with governance layers, CI/CD, Docker, and documented AI findings.
What I Would Build Next in a Two-Week Sprint
See docs/findings.md for the full sprint plan and evaluation.

---

## SAMPLE DOCUMENTS

### sample-docs/sample-nda.txt

MUTUAL NON-DISCLOSURE AGREEMENT
This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of [DATE] between PortSwigger Ltd, a company registered in England and Wales ("Company"), and [COUNTERPARTY NAME] ("Counterparty").
1.	DEFINITION OF CONFIDENTIAL INFORMATION "Confidential Information" means any information disclosed by either party to the other party, either directly or indirectly, in writing, orally or by inspection of tangible objects, that is designated as "Confidential," "Proprietary" or some similar designation.
2.	EXCLUSIONS FROM CONFIDENTIAL INFORMATION Confidential Information does not include information that: (a) is or becomes generally known to the public without breach of any obligation owed to the disclosing party; (b) was known to the receiving party prior to its disclosure; (c) was independently developed by the receiving party without use of any Confidential Information; (d) is received from a third party without restriction.
3.	OBLIGATIONS OF CONFIDENTIALITY Each party agrees to use the Confidential Information of the other party only for the purposes of evaluating a potential business relationship and to protect such Confidential Information using the same degree of care it uses to protect its own confidential information, but in no event less than reasonable care.
4.	TERM This Agreement shall remain in effect for three (3) years from the date of execution unless terminated earlier by mutual written consent.
NON-STANDARD CLAUSE ADDED FOR TESTING: 5. LIQUIDATED DAMAGES In the event of breach of this Agreement, the breaching party shall pay liquidated damages of £500,000 regardless of actual loss suffered.
6.	GOVERNING LAW This Agreement shall be governed by the laws of England and Wales.
[SIGNATURE BLOCKS]

---

## HOW TO RUN AND TEST

```bash
# Test with sample NDA
npm run triage ./sample-docs/sample-nda.txt

# Test rejection with wrong file type
npm run triage ./docs/README.md

# Test with your own document
npm run triage ./path/to/your/contract.txt
Expected output for sample NDA:
•	Standard clauses: Definition, Exclusions, Obligations, Term, Governing Law
•	Non-standard flagged: Liquidated damages clause (HIGH risk)
•	Human review items: 1 (liquidated damages)
•	Time saved: ~22 minutes
