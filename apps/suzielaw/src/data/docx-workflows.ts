import type { UpsertSystemWorkflowInput } from '@teamsuzie/workflows';

/**
 * System workflows that produce a structured Word deliverable via the
 * `generate_docx` chat tool. Each entry declares
 * `outputMode: 'generate_docx'` so the runtime injects the tool and
 * appends a system-prompt nudge on the launch turn.
 *
 * These are distinct from `data/prompts.ts` (free-form prose, default
 * `inline_chat`) and `data/review-templates.ts` (`tabular_review` —
 * launched into a review grid via the `from-workflow` endpoint).
 *
 * Keep this file's prompts narrow and structurally prescriptive: the
 * model gets the section/table shape from the prompt, the user fills
 * in deal-specific context, and the generate_docx tool turns the
 * combination into a Word file. Free-form drafting (memos, letters,
 * agreements) belongs in `data/prompts.ts` with the markdown drafting
 * tools — that path lets the user iterate section-by-section before
 * exporting.
 */
export const DOCX_WORKFLOWS: UpsertSystemWorkflowInput[] = [
  {
    id: 'docx:cp-checklist',
    name: 'Generate CP checklist',
    description:
      'Conditions-precedent checklist for a financing closing — landscape Word doc with one section per category and a four-column table per section.',
    practiceAreas: ['transactional', 'capital-markets'],
    outputMode: 'generate_docx',
    prompt: `Produce a conditions-precedent (CP) checklist for a financing closing as a structured Word document.

Before drafting, confirm with me:
- Deal type (e.g. senior secured term loan, revolving credit facility, bond issuance, real-estate financing)
- Borrower / issuer name and jurisdiction of organization
- Sponsor / parent and any guarantors
- Whether the transaction is sponsor-backed, club, syndicated, or bilateral
- Any deal-specific items I want included (e.g. cross-border KYC, regulatory consents, real-estate diligence)

Once I confirm, call the \`generate_docx\` tool with:
- title: "Conditions Precedent Checklist — <Borrower / Deal Name>"
- orientation: "landscape" (the four-column tables read better wide)
- sections: one per category below, in this order. For each, emit a heading at level 1 and a four-column table.

Sections (use these names verbatim; skip any that aren't applicable to the deal type):
1. Corporate matters — charter docs, good standing certificates, board / member resolutions, secretary's / officer's certificates, incumbency.
2. Borrower & loan-party matters — KYC / beneficial-ownership certifications, perfection certificates, solvency certificates, organizational structure chart.
3. Operational & real-estate matters — property surveys, environmental reports, leases, landlord waivers, where applicable.
4. Financial conditions — audited / interim financial statements, projections / model, no-MAC officer's certificate, pro forma compliance certificate, fee letters.
5. Legal opinions — borrower counsel opinion, special / local counsel opinions, tax opinion, enforceability of security documents.
6. Diligence & third-party deliverables — UCC / lien searches, title reports, insurance certificates, payoff letters for refinanced debt.
7. Documentation — executed credit agreement / indenture, security agreements (pledge, mortgage, account control), guaranties, intercreditor / subordination agreement, fee letters, closing certificates.

For every table, use these four column headers exactly: ["Condition", "Owner", "Status", "Notes"].

Populate rows as follows:
- "Condition" — the specific deliverable, named at the level a paralegal could fetch it (e.g. "Certificate of Incorporation, certified by Delaware Secretary of State within the last 30 days", not just "charter docs").
- "Owner" — the responsible party in your best judgment ("Borrower counsel", "Lender counsel", "Borrower", "Title company", "Local counsel — <state>", etc.).
- "Status" — leave as "Open" for every row by default; the user updates the document later.
- "Notes" — flag anything jurisdiction- or deal-specific, or leave blank.

Be exhaustive within reason — a typical syndicated US credit-agreement closing checklist runs 40–60 line items across the categories. Don't pad with boilerplate that's clearly N/A for the disclosed deal type. Don't inline the document in your reply — only the \`download_url\` from the tool result, as a clickable markdown link, plus a one-sentence summary of what you produced.`,
  },
  {
    id: 'docx:diligence-questionnaire',
    name: 'Generate diligence questionnaire',
    description:
      'Buy-side diligence questionnaire for a target company — sectioned Word doc with three-column tables of questions, response space, and supporting-document references.',
    practiceAreas: ['m-and-a', 'transactional'],
    outputMode: 'generate_docx',
    prompt: `Produce a buy-side diligence questionnaire for a target company as a structured Word document the target's team can fill in.

Before drafting, confirm with me:
- Target company name and primary jurisdiction
- Target's industry / sector (financial services, healthcare, software, manufacturing, etc.) — drives which sections need expansion
- Transaction structure (stock purchase, asset purchase, merger) — drives liability-allocation questions
- Whether this is preliminary diligence (high-level, pre-LOI) or confirmatory (post-LOI, granular)
- Any known sensitive areas I want emphasized (regulatory, IP, key contracts, litigation)

Once I confirm, call the \`generate_docx\` tool with:
- title: "Diligence Questionnaire — <Target Name>"
- orientation: "portrait" (questionnaires read better tall; tables are narrow)
- sections: one per category below, in this order. Each section is one H1 + one three-column table. Skip categories that aren't applicable; expand the ones the target's industry calls for (e.g. healthcare → expand Regulatory; software → expand IP).

Sections (use these names verbatim):
1. Corporate organization — entity formation, capitalization, subsidiaries, prior reorganizations, stockholder agreements.
2. Financial — audited and management financials, debt and credit facilities, off-balance-sheet arrangements, accounting policy changes, related-party transactions.
3. Material contracts — customer contracts above a threshold, supplier contracts, distribution / reseller, licensing in/out, partnership and JV agreements, change-of-control provisions.
4. Litigation & disputes — pending and threatened litigation, regulatory inquiries, settlements (last 5 years), insurance coverage and pending claims.
5. Regulatory & compliance — required licenses and permits, jurisdiction-specific regulators, compliance programs, anti-corruption / sanctions / export controls, data privacy (GDPR/CCPA/etc. as applicable).
6. Intellectual property — registered IP (patents, trademarks, copyrights, domain names), trade secrets and protection measures, employee IP assignments, third-party IP claims, open-source usage and obligations.
7. Employment & benefits — employee headcount and locations, key-person and severance arrangements, benefit plans, equity plans, recent terminations, union / works-council representation, contractor classifications.
8. Real property & operations — owned and leased properties, environmental conditions and reports, material operating equipment, supply-chain dependencies.
9. Tax — recent tax returns and audits, transfer pricing, NOLs and tax attributes, recent restructurings affecting tax position.
10. Information technology & data — IT systems and key vendors, cybersecurity incidents (last 5 years), data-processing agreements, AI/ML use and governance.

For every table, use these three column headers exactly: ["Question", "Response", "Supporting documents"].

Populate "Question" rows with specific, answerable prompts a deal-team paralegal could send to the target's general counsel — not vague topics. Examples:
- Bad: "Material contracts."
- Good: "List all customer contracts with annual revenue > $1,000,000 in the last fiscal year, including the contract term, renewal mechanics, and any change-of-control consent requirement."

Leave "Response" and "Supporting documents" blank in every row — the target fills them in.

Aim for 8–15 questions per applicable section, more in expanded categories. Don't pad with questions that overlap; combine where natural. Don't inline the document in your reply — only the \`download_url\` from the tool result, as a clickable markdown link, plus a one-sentence summary of the deal type and section emphasis you applied.`,
  },
];
