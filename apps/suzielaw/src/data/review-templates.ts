import type { UpsertSystemWorkflowInput } from '@teamsuzie/workflows';

/**
 * System workflows that double as review templates. Each entry has a
 * `columnConfig` so the host can launch it as a tabular review across
 * a matter's documents — one column per question, one row per
 * document, citations and format coercion handled by the existing
 * review runner.
 *
 * Distinct from the free-form `data/prompts.ts` catalog (those are
 * single-document agentic recipes); review templates live here so it
 * stays obvious which workflows are launchable into a review.
 */
export const REVIEW_TEMPLATES: UpsertSystemWorkflowInput[] = [
  {
    id: 'template:credit-agreement-summary',
    name: 'Credit agreement summary',
    description: 'Standard 9-column summary of a credit agreement across one or more loan documents.',
    practiceAreas: ['transactional', 'capital-markets'],
    prompt:
      'Summarize the key economic and legal terms of this credit agreement. The columns capture the standard terms; answer each from the document and quote the relevant language.',
    columnConfig: [
      {
        title: 'Borrower',
        prompt: "Who is the named borrower? Answer with the borrower's legal name only.",
        format: 'short_text',
      },
      {
        title: 'Lenders',
        prompt: "List the lenders or arrangers. One bullet per party.",
        format: 'bullets',
      },
      {
        title: 'Facility size',
        prompt: 'What is the total facility size? Answer with the total committed amount, e.g. "$500,000,000 revolver".',
        format: 'money',
      },
      {
        title: 'Maturity',
        prompt: "What is the maturity date or final maturity term? Answer with the date or duration.",
        format: 'short_text',
      },
      {
        title: 'Interest rate',
        prompt: 'Describe the interest rate / pricing grid. Note benchmark (SOFR/term/etc.), spread, and step-ups.',
        format: 'text',
      },
      {
        title: 'Governing law',
        prompt: "Which jurisdiction's law governs the agreement? Answer with the named state or country only.",
        format: 'short_text',
      },
      {
        title: 'Financial covenants',
        prompt: 'List the financial covenants and their levels. One bullet per covenant.',
        format: 'bullets',
      },
      {
        title: 'Mandatory prepayments',
        prompt: 'Describe the mandatory prepayment events (asset sales, debt issuance, excess cash flow, change of control, etc.).',
        format: 'text',
      },
      {
        title: 'Change of control',
        prompt: 'What constitutes a change of control under the agreement, and what is the consequence?',
        format: 'text',
      },
    ],
  },
  {
    id: 'template:nda-review',
    name: 'NDA review',
    description: 'Six-column review of an NDA — scope, term, carve-outs, governing law, etc.',
    practiceAreas: ['transactional'],
    prompt:
      'Pull out the standard NDA terms. Answer each column from the document; quote the operative language for each answer.',
    columnConfig: [
      {
        title: 'Parties',
        prompt: "List the parties and each party's defined role (e.g. \"Discloser\", \"Recipient\"). One bullet per party.",
        format: 'bullets',
      },
      {
        title: 'Scope of confidentiality',
        prompt: 'What information is protected as confidential? Note any defined-term scope (e.g. "Evaluation Material").',
        format: 'text',
      },
      {
        title: 'Term',
        prompt: 'How long does the confidentiality obligation last? Answer with duration only.',
        format: 'short_text',
      },
      {
        title: 'Carve-outs',
        prompt: 'List the carve-outs / exceptions to the confidentiality obligation (publicly available, independently developed, compelled disclosure, etc.). One bullet per carve-out.',
        format: 'bullets',
      },
      {
        title: 'Permitted purpose',
        prompt: 'What is the permitted purpose for which the recipient may use the information?',
        format: 'short_text',
      },
      {
        title: 'Governing law',
        prompt: "Which jurisdiction's law governs the NDA? Answer with the named state or country only.",
        format: 'short_text',
      },
    ],
  },
  {
    id: 'template:lease-abstract',
    name: 'Lease abstract',
    description: 'Eight-column abstract of a commercial lease — premises, term, rent, options, etc.',
    practiceAreas: ['real-estate', 'transactional'],
    prompt: 'Abstract the key terms of this commercial lease across the standard columns.',
    columnConfig: [
      {
        title: 'Landlord',
        prompt: "Who is the landlord? Answer with the legal name only.",
        format: 'short_text',
      },
      {
        title: 'Tenant',
        prompt: "Who is the tenant? Answer with the legal name only.",
        format: 'short_text',
      },
      {
        title: 'Premises',
        prompt: 'Describe the leased premises (address, suite, square footage if stated).',
        format: 'text',
      },
      {
        title: 'Term',
        prompt: 'What is the initial term? Answer with the commencement and expiration dates (or "X years from <date>").',
        format: 'short_text',
      },
      {
        title: 'Renewal options',
        prompt: 'What renewal options does the tenant have? Note number of renewals, length of each, and notice required.',
        format: 'text',
      },
      {
        title: 'Base rent',
        prompt: 'What is the base rent and how does it escalate?',
        format: 'text',
      },
      {
        title: 'Operating expenses',
        prompt: 'How are operating expenses / common-area maintenance / taxes handled (gross, net, base year, etc.)?',
        format: 'text',
      },
      {
        title: 'Assignment / sublease',
        prompt: "Can the tenant assign or sublease the lease, and under what conditions? Note any consent requirement.",
        format: 'text',
      },
    ],
  },
  {
    id: 'template:ma-diligence-triage',
    name: 'M&A diligence triage',
    description: 'Ten-column triage across a target-company contract — change of control, indemnity, term, etc.',
    practiceAreas: ['m-and-a', 'transactional'],
    prompt: 'Triage this contract for an M&A diligence pass — surface every term that affects the deal.',
    columnConfig: [
      {
        title: 'Parties',
        prompt: "List the parties and each party's defined role. One bullet per party.",
        format: 'bullets',
      },
      {
        title: 'Subject matter',
        prompt: 'In one sentence, what does this contract do?',
        format: 'short_text',
      },
      {
        title: 'Term',
        prompt: 'What is the initial term and how does it renew?',
        format: 'short_text',
      },
      {
        title: 'Termination',
        prompt: "List the events that allow either party to terminate. One bullet per termination right; note which party holds it.",
        format: 'bullets',
      },
      {
        title: 'Change of control',
        prompt: 'What happens upon a change of control of either party?',
        format: 'text',
      },
      {
        title: 'Assignment',
        prompt: 'Can the agreement be assigned, and under what conditions?',
        format: 'text',
      },
      {
        title: 'Indemnification',
        prompt: 'Who indemnifies whom and for which categories of claims? Note any caps or carve-outs.',
        format: 'text',
      },
      {
        title: 'Most-favored-nation',
        prompt: 'Does the contract include any most-favored-nation, exclusivity, or non-compete clauses? If so, summarize.',
        format: 'text',
      },
      {
        title: 'Governing law',
        prompt: "Which jurisdiction's law governs the agreement? Answer with the named state or country only.",
        format: 'short_text',
      },
      {
        title: 'Notice period',
        prompt: 'What notice period is required for termination, breach, or assignment? Note who must give the notice.',
        format: 'short_text',
      },
    ],
  },
];
