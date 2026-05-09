export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  practiceAreas: string[];
  prompt: string;
}

/**
 * Seed catalog of legal prompt templates. Each prompt is written as an
 * agentic recipe — it tells the model which tools to call (convert_to_markdown,
 * get_outline, read_section, search_document, drafting tools, export_to_docx)
 * and how to shape the output. A user pastes/uploads, the model executes.
 *
 * Users save their own via the workflows store (`/api/workflows`).
 */
export const PROMPTS: PromptTemplate[] = [
  {
    id: 'draft-legal-memo-docx',
    title: 'Draft a legal memorandum (DOCX)',
    description:
      'TOC-first agentic drafting in markdown, exported as a styled .docx at the end.',
    practiceAreas: ['general', 'business-of-law'],
    prompt: `I'd like to draft a legal memorandum.

Run this drafting flow end to end:

1. Ask me for the subject matter, parties involved, jurisdiction, and any documents I want you to reference.
2. Call create_document with a concise title.
3. Propose a TOC (typical: Issue / Brief Answer / Facts / Discussion / Conclusion). Confirm with me, then call set_outline.
4. Fill each section with write_section. Before writing each section, call read_section on the prior section so the memo stays coherent.
5. Pause for my feedback after the first complete pass. Use revise_section + write_section for edits.
6. When I'm satisfied, call export_to_docx and share the download link as a markdown link in the chat.`,
  },
  {
    id: 'draft-email-from-notes',
    title: 'Draft email from notes',
    description: 'Turn loose notes into a polished email to opposing counsel or a client.',
    practiceAreas: ['general'],
    prompt:
      "I'll paste notes (or attach a document with notes — convert_to_markdown first if so). Draft a professional email from them: concise, neutral, request specific next steps where appropriate. Return the email body inline as markdown — no DOCX export needed unless I ask.",
  },
  {
    id: 'draft-memo-from-notes',
    title: 'Draft memo from notes',
    description: 'Turn case notes or research into a structured internal memo, exported as DOCX.',
    practiceAreas: ['general'],
    prompt: `I'll paste notes (or attach a document — convert_to_markdown first if so).

Run this drafting flow:

1. Read the notes; ask me for any missing context (parties, jurisdiction, audience).
2. Call create_document and set_outline using the standard structure (Issue / Brief Answer / Facts / Discussion / Conclusion).
3. Fill each section via write_section, drawing on the notes; flag where the notes are silent and you're inferring.
4. Call export_to_docx and share the download link as a markdown link.`,
  },
  {
    id: 'rewrite-polish',
    title: 'Rewrite or polish text',
    description: 'Tighten language, fix tone, preserve meaning.',
    practiceAreas: ['general'],
    prompt:
      "Rewrite the text I paste. Tighten language, fix any awkward phrasing, and keep the meaning intact. Default to a professional tone unless I say otherwise. Return the rewritten text inline.",
  },
  {
    id: 'summarize-document',
    title: 'Summarize an uploaded document',
    description: 'Structural read of an attached DOCX or PDF — outline, priority sections, formal summary.',
    practiceAreas: ['general'],
    prompt:
      "I'll attach a document. Summarize it using the document-summarization workflow: convert_to_markdown, get_outline, pick the priority sections to read in full via read_section, and produce a formal summary that fits the document type. Cite heading paths (§, Article, Item) inline.",
  },
  {
    id: 'arbitration-timeline',
    title: 'Prepare arbitration timeline',
    description: 'Extract a chronological timeline of key events from arbitration filings.',
    practiceAreas: ['arbitration', 'litigation'],
    prompt:
      "I'll attach one or more filings (or paste). For each binary, convert_to_markdown then walk the document via get_outline + read_section. Pull every dated event (filings, hearings, awards, communications). Output a markdown table with columns: Date | Event | Source (filename + heading path). Sort chronologically; flag any date conflicts across documents.",
  },
  {
    id: 'arbitral-award-summary',
    title: 'Summarize arbitral award',
    description: 'Reasoning, holdings, and dissent in plain English.',
    practiceAreas: ['arbitration'],
    prompt:
      "I'll attach the award. Run the document-summarization workflow (convert_to_markdown → get_outline → read_section on priority sections), then write a formal summary covering: tribunal composition, seat + rules, parties, claims and counterclaims, jurisdictional rulings, merits reasoning, disposition (who won what), costs, and any dissent or concurring opinion. Cite paragraph numbers or heading paths inline. Close with one paragraph on holdings other tribunals might cite.",
  },
  {
    id: 'arbitration-dispute-terms',
    title: 'Summarize arbitration & dispute resolution terms',
    description: 'Pull out arbitration clauses, governing law, forum, and carve-outs.',
    practiceAreas: ['arbitration', 'transactional'],
    prompt:
      "I'll attach a contract. Convert_to_markdown, then use get_outline + search_document for terms like \"arbitration\", \"dispute\", \"governing law\", \"forum\", \"jury\". Read the matching sections in full. Output a structured summary: forum + seat | rules (ICC/LCIA/AAA/etc.) | language | governing law | number of arbitrators + appointment mechanism | carve-outs (IP, injunctive relief, small claims) | jury-trial waiver | class-action waiver | interim relief | confidentiality. Cite heading paths.",
  },
  {
    id: 'client-prospect-profile',
    title: 'Draft a client or prospect profile',
    description: 'One-page intro brief for a new client meeting.',
    practiceAreas: ['business-of-law'],
    prompt: `Draft a one-page profile of the company I'll name.

1. Use http_request to look up the company on its public site, recent press releases, and SEC EDGAR / regulatory portals as relevant.
2. Use vector_search for any internal context the firm has on this company.
3. Compile a one-page brief: what they do | leadership (CEO/GC if known) | key markets and lines of business | recent news / regulatory events / litigation (last 12 months) | likely legal needs given their stage and sector | counsel of record if disclosed.

Cite each fact to its source URL or document. Flag where you couldn't find authoritative info.`,
  },
  {
    id: 'client-prospect-news',
    title: 'Research client or prospect news',
    description: 'Pull recent news and legal events for a target.',
    practiceAreas: ['business-of-law'],
    prompt:
      "I'll name the company. Use http_request to find recent (last 90 days) news, regulatory actions, lawsuits, or material events. Output a markdown table with: Date | Event | Source URL | Why it matters legally (one line). Sort newest first. Flag any items that could trigger conflicts or merit a client outreach.",
  },
  {
    id: 'engagement-letter-summary',
    title: 'Summarize an engagement letter',
    description: 'Scope, fees, conflicts, and termination terms at a glance.',
    practiceAreas: ['business-of-law'],
    prompt:
      "I'll attach the engagement letter. Run document-summarization (convert_to_markdown → get_outline → read_section on the operative sections). Output a structured summary: client + matter | scope of representation (and any carve-outs) | fee structure (hourly/flat/contingent) and rate sheet if present | retainer / replenishment | billing cadence and dispute period | conflicts disclosure and any waivers | confidentiality | termination + file return | governing law. Cite heading paths. Flag anything non-standard or that requires partner sign-off.",
  },
  {
    id: 'industry-sector-landscape',
    title: 'Summarize industry or sector landscape',
    description: 'Market structure, key players, regulatory exposure, and recent deals.',
    practiceAreas: ['business-of-law'],
    prompt:
      "I'll name the industry or sector. Use http_request and vector_search to compile a landscape brief: market size and growth | top 5–10 players (with rough share if available) | regulatory regime and primary regulators | notable enforcement / litigation in the last 12 months | M&A and capital-markets activity in the last 12 months | likely legal-services demand drivers. Cite each fact. Note any open questions you couldn't resolve.",
  },
  {
    id: 'ocg-summary',
    title: 'Summarize Outside Counsel Guidelines (OCG)',
    description: 'Required staffing, billing rules, and reporting obligations as a checklist.',
    practiceAreas: ['business-of-law'],
    prompt:
      "I'll attach the OCG. Convert_to_markdown, get_outline, read_section on the operative sections. Output a checklist (one item per requirement): Category | Requirement | Source heading path. Cover at minimum: staffing constraints (rates, headcount, diversity) | billing rules (timekeepers, increments, expenses, block billing, AI use) | conflicts policy | matter management (status reports, budgets, write-offs) | confidentiality / IT requirements | governing law / fee disputes. Flag anything non-standard or that conflicts with our usual practice.",
  },
  {
    id: 'closing-checklist-securities',
    title: 'Draft closing checklist for securities offering',
    description: 'Items, owners, and timing for a registered or 144A offering, exported as DOCX.',
    practiceAreas: ['capital-markets'],
    prompt: `I'll describe the offering (issuer, structure, expected pricing date).

Run this drafting flow:

1. Ask me for any missing context (issuer counsel, underwriters' counsel, auditors, listing).
2. create_document, set_outline using closing-checklist sections (Pre-Pricing Conditions / Pricing-Day Items / Closing-Date Items / Post-Closing).
3. Fill each section as a markdown table: Item | Responsible Party | Status | Timing.
4. export_to_docx and share the download link.`,
  },
  {
    id: 'item-101-disclosure',
    title: 'Draft Item 1.01 disclosure',
    description: '8-K Item 1.01 entry into a material definitive agreement, exported as DOCX.',
    practiceAreas: ['capital-markets'],
    prompt: `I'll describe the agreement (or attach it — convert_to_markdown if so).

Run this drafting flow:

1. Ask for missing context (filer, counterparty, signing date, materiality threshold).
2. create_document with title "8-K Item 1.01 — [Agreement Name]".
3. set_outline: Item 1.01 | Material Terms | Exhibit Index | Forward-Looking Statements (if applicable).
4. Fill via write_section. Keep it factual and non-promotional. Flag any items needing further board / counsel review (e.g. value disclosure, attorney-client privileged terms).
5. export_to_docx and share the download link.`,
  },
  {
    id: 'change-of-control-extract',
    title: 'Extract change-of-control provisions',
    description: 'Pull and compare CoC clauses across one or more contracts.',
    practiceAreas: ['mergers-acquisitions', 'transactional'],
    prompt:
      "I'll attach one or more contracts. For each: convert_to_markdown, then search_document for \"change of control\", \"assignment\", \"merger\", and read_section on the matches. Output a markdown table with columns: Contract | Trigger | Consent Required (party + standard) | Notice Period | Consequences (termination / acceleration / put right / amendment) | Source heading path. One row per contract. Below the table, flag any clauses that are unusually broad or counterparty-favorable.",
  },
  {
    id: 'interim-operating-covenants-memo',
    title: 'Draft interim operating covenants memo',
    description: 'Summary of permitted and prohibited acts pre-closing, exported as DOCX.',
    practiceAreas: ['mergers-acquisitions'],
    prompt: `I'll attach the merger agreement.

Run this flow:

1. convert_to_markdown, get_outline.
2. search_document + read_section for \"interim\", \"ordinary course\", \"covenant\", \"consent\".
3. create_document titled "Interim Operating Covenants Memo".
4. set_outline: Background | Ordinary-Course Covenants | Restricted Actions | Consent Thresholds | Practical Reminders for Operations Team.
5. Fill each section. For Restricted Actions and Consent Thresholds, use markdown tables with columns: Action | Threshold / Restriction | Source (heading path).
6. export_to_docx and share the download link.`,
  },
  {
    id: 'court-transcript-key-topics',
    title: 'Analyze court transcript for key topics',
    description: 'Topic map with citations, judge\'s rulings, and preserved objections.',
    practiceAreas: ['litigation'],
    prompt:
      "I'll attach the transcript. convert_to_markdown, get_outline, read_section on each segment. Produce a topic map: each topic gets a heading, then a 1-line summary, page/line citations (e.g. 17:4–18:9), the judge's rulings on that topic, and any preserved objections. Sort by importance, not chronology. Close with a one-paragraph synthesis of how the hearing went strategically.",
  },
  {
    id: 'deposition-transcript-key-topics',
    title: 'Analyze deposition transcript for key topics',
    description: 'Witness admissions, contradictions, and impeachment material.',
    practiceAreas: ['litigation'],
    prompt:
      "I'll attach the deposition transcript. convert_to_markdown, get_outline, read_section through. Output four sections: Key Admissions (with page/line citations) | Contradictions With Prior Statements (cite both sources) | Impeachment Material (gaps, evasions, inconsistencies — cite page/line) | Topics Witness Avoided. Close with a one-paragraph cross-examination strategy note.",
  },
  {
    id: 'complaint-procedural-substantive',
    title: 'Analyze complaint — procedural and substantive',
    description: 'Claims, jurisdiction, prayers for relief, and likely defenses.',
    practiceAreas: ['litigation'],
    prompt:
      "I'll attach the complaint. convert_to_markdown, get_outline, read_section. Output: Caption + parties (with citations of capacity) | Jurisdiction & venue basis (with paragraph cites) | Each cause of action — name | elements | factual support paragraphs | requested relief | Procedural posture (any pending motions, prior proceedings) | Three plausible defenses (each with one-line reasoning + which element it attacks). Cite paragraph numbers throughout.",
  },
  {
    id: 'diligence-request-list-check',
    title: 'Check a diligence request list',
    description: 'Coverage, redundancies, and gaps for a target deal.',
    practiceAreas: ['transactional', 'mergers-acquisitions'],
    prompt:
      "I'll attach the diligence list (or paste). I'll also describe the deal type and target. convert_to_markdown if attached, then walk the list via get_outline + read_section. Output: Coverage matrix (Category | # of items | Adequate? Y/N | Notes) | Redundant requests | Missing categories given this deal type | Items unusual for this deal type. Reference item numbers from the source list.",
  },
  {
    id: 'client-alert-draft',
    title: 'Draft a client alert',
    description: 'Plain-English explainer on a regulatory or court development, exported as DOCX.',
    practiceAreas: ['general'],
    prompt: `I'll describe the development (or attach a court decision / agency release — convert_to_markdown if so, then get_outline + read_section to ground the alert in the actual text).

Run this drafting flow:

1. Confirm the angle and target audience.
2. create_document, set_outline: What Happened | Who It Affects | What To Do Now | Open Questions.
3. Fill each section via write_section. Plain English, under 500 words total. No marketing copy.
4. export_to_docx and share the download link.`,
  },
  {
    id: 'spelling-grammar-proofread',
    title: 'Proofread for spelling and grammar',
    description: 'Catch typos, agreement errors, and inconsistent capitalization.',
    practiceAreas: ['general'],
    prompt:
      "Proofread the text I paste for spelling, grammar, agreement, and inconsistent capitalization. Return a clean version, then a short bullet list of significant changes (skip trivial typos). If I attach a document instead, convert_to_markdown first.",
  },
  {
    id: 'legal-research-case-law',
    title: 'Research case law on a legal issue',
    description: 'Search public case-law databases for the relevant jurisdiction, summarize the leading cases, and cite each holding.',
    practiceAreas: ['litigation', 'general'],
    prompt: `Research case law on the issue I describe below.

1. Pick the right jurisdiction (US, UK, EU, FR, etc.) from context. Run \`legal_search\` with that jurisdiction, type "case_law", and a tightly-scoped query. Apply date_from / date_to when I give them.
2. Pick the 3–6 most on-point hits. For each, call \`legal_get_document\` to read the decision text.
3. Return a markdown table — Case | Court | Year | Holding (1–2 sentences) | URL — followed by a short synthesis of how the cases line up (majority rule vs. splits).

Issue:`,
  },
  {
    id: 'legal-research-statute',
    title: 'Read a specific statute / code provision',
    description: 'Look up the actual text of a statute, regulation, or code article and answer a question about it.',
    practiceAreas: ['litigation', 'transactional', 'general'],
    prompt: `I will name a statute, code article, or regulation. Look up the actual text and answer my question.

1. Identify the jurisdiction from context (mentions of "Code civil" → FR, "ley/decreto" → AR, "USC" → US, "BOE" → ES, "Normattiva" → IT, etc.).
2. Run \`legal_search\` with type "legislation" and a query that includes the law name + relevant keyword.
3. From the top hit, call \`legal_get_document\` for the full text — or \`legal_find_in_document\` with the keyword if it's a long code.
4. Quote the relevant provision verbatim, give its article/section number and date, and link to the source URL. Then answer my question grounded in the cited text.`,
  },

  // ================================================================
  // GENERAL — additional cross-cutting recipes.
  // ================================================================
  {
    id: 'compare-two-documents',
    title: 'Compare two documents',
    description: 'Side-by-side diff of clauses, terms, and structure.',
    practiceAreas: ['general', 'transactional', 'mergers-acquisitions'],
    prompt:
      "I'll attach two documents. convert_to_markdown both, then get_outline on each. For each major section that exists in either doc, output a row: Section | Doc A excerpt | Doc B excerpt | Notes on differences. Cite heading paths. Close with three sentences summarizing the most material differences.",
  },
  {
    id: 'legalese-to-plain-english',
    title: 'Translate legalese to plain English',
    description: 'Rewrite a contract or clause for a non-lawyer.',
    practiceAreas: ['general'],
    prompt:
      "I'll paste or attach legalese. If attached, convert_to_markdown first. Rewrite it in plain English suitable for a sophisticated non-lawyer (CFO/CEO level — keep the substance, drop the latinisms and triple-nested defined terms). Preserve all material rights and obligations. Flag anywhere the original is ambiguous so the plain-English version doesn't paper over it.",
  },
  {
    id: 'build-chronology',
    title: 'Build chronology from documents',
    description: 'Extract dated events from one or more uploads into a timeline.',
    practiceAreas: ['general', 'litigation', 'arbitration', 'business-of-law'],
    prompt:
      "I'll attach one or more documents. For each: convert_to_markdown, walk via get_outline + read_section. Pull every dated event (correspondence, transactions, filings, meetings). Output a markdown table: Date | Event | Source (filename + heading path) | Notes. Sort chronologically. Flag date conflicts across docs.",
  },
  {
    id: 'risk-register-from-doc',
    title: 'Build a risk register from a document',
    description: 'Extract risk-shifting provisions and rate them.',
    practiceAreas: ['general', 'transactional'],
    prompt:
      "I'll attach a contract or policy. convert_to_markdown, walk via get_outline + read_section. Identify each risk-shifting provision (indemnity, limitation of liability, warranty, IP, data, force majeure, termination). Output a table: Risk Area | Provision | Heading Path | Severity (high/med/low) | Notes. Close with three sentences on the overall risk posture.",
  },
  {
    id: 'qa-from-document',
    title: 'Generate Q&A pairs from a document',
    description: 'Useful for training material, FAQs, knowledge-base seeding.',
    practiceAreas: ['general'],
    prompt:
      "I'll attach a document. convert_to_markdown, get_outline. For each major section, generate 2–3 Q&A pairs that someone unfamiliar with the doc might ask, with answers grounded in specific section text. Output as: ### Question | Answer (cite heading path). Aim for 15–25 pairs across the document.",
  },

  // ================================================================
  // ANTITRUST
  // ================================================================
  {
    id: 'hsr-filing-analysis',
    title: 'HSR filing threshold analysis',
    description: 'Determine if a transaction is HSR-reportable and identify exemptions.',
    practiceAreas: ['antitrust', 'mergers-acquisitions'],
    prompt:
      "I'll describe the transaction (parties, structure, value, asset details). Walk through the HSR analysis: size-of-transaction test, size-of-person test, applicable exemptions (passive investor, ordinary-course-of-business, foreign-asset, etc.). Output: Reportable? Y/N | Reasoning by element | Confirmed exemption (if any) | Filing fee tier. Flag where additional facts would change the answer.",
  },
  {
    id: 'merger-clearance-memo',
    title: 'Draft merger clearance memo',
    description: 'Multi-jurisdiction clearance strategy memo, exported as DOCX.',
    practiceAreas: ['antitrust', 'mergers-acquisitions'],
    prompt: `I'll describe the deal and the parties' geographic/product overlap.

Drafting flow:
1. Ask for any missing context (target revenues by jurisdiction, deal value, expected signing/closing).
2. create_document titled "Merger Clearance Strategy Memo".
3. set_outline: Transaction Overview | Jurisdictions Triggered | Substantive Issues by Jurisdiction | Filing Strategy and Timing | Deal Conditions and Risk Allocation.
4. Fill via write_section. Cover at minimum: US (HSR), EU (EUMR), UK (CMA), and any others I flag.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'relevant-market-analysis',
    title: 'Relevant market analysis',
    description: 'Define product and geographic markets for a competition matter.',
    practiceAreas: ['antitrust'],
    prompt:
      "I'll describe the transaction or conduct and the products/services involved. Walk through the relevant-market analysis: candidate product market(s) using SSNIP/hypothetical-monopolist framing, demand-side substitutability, supply-side substitutability, geographic market(s), and price/non-price competition dimensions. Output: Proposed product market | Proposed geographic market | Supporting evidence | Counter-arguments | Open empirical questions.",
  },
  {
    id: 'unilateral-effects-theory',
    title: 'Unilateral effects analysis',
    description: 'Theory of harm for a horizontal merger.',
    practiceAreas: ['antitrust', 'mergers-acquisitions'],
    prompt:
      "I'll describe a horizontal merger. Build the unilateral-effects theory of harm: closeness of competition, diversion ratios, pricing pressure (UPP/GUPPI direction), entry/repositioning, efficiencies. Output: Theory of harm | Evidence supporting | Evidence against | Likely agency posture | Defensive arguments.",
  },
  {
    id: 'vertical-merger-review',
    title: 'Vertical merger review',
    description: "Foreclosure and raising-rivals'-costs theories.",
    practiceAreas: ['antitrust', 'mergers-acquisitions'],
    prompt:
      "I'll describe a vertical (or partial-vertical) merger. Walk through foreclosure analysis: ability + incentive at each affected level, market shares upstream and downstream, share of input/distribution captured, raising-rivals'-costs concerns, customer-foreclosure concerns, EDM/efficiencies offsets. Output a structured memo with each prong addressed.",
  },
  {
    id: 'info-exchange-review',
    title: 'Information exchange compliance review',
    description: 'Pre-merger gun-jumping review or trade-association protocol.',
    practiceAreas: ['antitrust'],
    prompt:
      "I'll describe an information exchange (between merging parties pre-closing, or among trade-association members). Output: Risk Category (price/output/strategy/customer-specific) | Proposed Exchange | Risk Level | Safer Alternative | Clean-team protocol if needed. Cover gun-jumping (Section 1 + HSR ordinary-course) where applicable.",
  },
  {
    id: 'compliance-program-assessment',
    title: 'Antitrust compliance program assessment',
    description: 'Gap analysis against DOJ/FTC + ECN expectations.',
    practiceAreas: ['antitrust'],
    prompt:
      "I'll attach the company's current antitrust compliance materials (or describe them). convert_to_markdown if attached. Assess against DOJ/FTC expectations (training cadence, risk assessment, monitoring, reporting/whistleblower channel, audit, discipline, document-retention, M&A integration). Output: Gap Matrix (Element | Current State | Best Practice | Gap Severity) | Top 5 Remediation Priorities.",
  },
  {
    id: 'dawn-raid-playbook',
    title: 'Draft dawn raid response playbook',
    description: 'Investigation-response procedures, exported as DOCX.',
    practiceAreas: ['antitrust'],
    prompt: `I'll describe the company's footprint (jurisdictions, sites, sensitive functions).

Drafting flow:
1. Ask for outside-counsel contacts and any existing protocol.
2. create_document titled "Antitrust Dawn Raid Response Playbook".
3. set_outline: First 30 Minutes | Reception Procedures | On-Site Counsel and Privilege | Document Holds and IT | Employee Briefings | Communications | Post-Raid Steps.
4. Fill via write_section. Tailor to the jurisdictions I name (DOJ FBI, EC, CMA, BKartA, AGCM, KFTC, JFTC, etc.).
5. export_to_docx and share the download link.`,
  },
  {
    id: 'leniency-application-memo',
    title: 'Leniency application strategy memo',
    description: 'Multi-regime leniency posture and timing.',
    practiceAreas: ['antitrust'],
    prompt:
      "I'll describe what's been uncovered (conduct, jurisdictions, who knew what when). Output a strategy memo: Conduct Summary | Leniency Eligibility by Regime (DOJ Type A/B, EC immunity/reduction, UK no-action, etc.) | Marker Strategy and Timing | Cooperation Obligations | Civil Damages Exposure | Recommended sequencing. Be candid about close calls.",
  },
  {
    id: 'remedies-proposal',
    title: 'Draft merger remedies proposal',
    description: 'Structural and behavioral fixes, exported as DOCX.',
    practiceAreas: ['antitrust', 'mergers-acquisitions'],
    prompt: `I'll describe the deal and the agency's stated concerns.

Drafting flow:
1. Ask for the agency's concern document or reviewer feedback.
2. create_document titled "Proposed Remedies".
3. set_outline: Concerns Addressed | Proposed Divestiture(s) | Buyer-Up-Front Profile | Behavioral Commitments | Monitoring + Compliance | Implementation Timeline.
4. Fill via write_section. Be specific (assets, employees, IP, transition services). Cite the agency's framing back to it.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'gun-jumping-review',
    title: 'Gun-jumping risk review',
    description: 'Pre-closing integration activity vs HSR/Section 1.',
    practiceAreas: ['antitrust', 'mergers-acquisitions'],
    prompt:
      "I'll describe planned pre-closing integration activities. Output a risk matrix: Activity | HSR (ordinary-course) Risk | Section 1 (info-exchange) Risk | Safer Alternative | Required Clean-Team Protocols. Flag any activity that should wait for closing.",
  },
  {
    id: 'cartel-conduct-theory',
    title: 'Cartel conduct theory analysis',
    description: 'Per se vs rule of reason framing for alleged horizontal conduct.',
    practiceAreas: ['antitrust'],
    prompt:
      "I'll describe alleged horizontal conduct (price-fixing, market allocation, bid-rigging, group boycott, tying). Walk through: characterization (per se vs rule of reason vs quick look), evidence framework (parallelism + plus factors, communications, structural facilitators), market-power requirement if applicable, defenses (independent action, ancillary restraint, joint-venture, Noerr-Pennington, foreign sovereign immunity). Output a structured assessment.",
  },

  // ================================================================
  // ARBITRATION — additional submissions and procedural artifacts.
  // ================================================================
  {
    id: 'draft-request-for-arbitration',
    title: 'Draft request for arbitration',
    description: 'ICC-style request for arbitration, exported as DOCX.',
    practiceAreas: ['arbitration'],
    prompt: `I'll describe the dispute (parties, contract, claim, relief sought).

Drafting flow:
1. Ask for the arbitration clause text and seat/rules.
2. create_document titled "Request for Arbitration".
3. set_outline: Parties | Arbitration Agreement | Nature of the Dispute | Claims | Relief Sought | Constitution of the Tribunal | Place + Language + Procedure | Annexes.
4. Fill via write_section, anchoring each section in the contract clause and facts I've given.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'draft-statement-of-claim',
    title: 'Draft statement of claim',
    description: 'Detailed substantive submission, exported as DOCX.',
    practiceAreas: ['arbitration'],
    prompt: `I'll describe the dispute and provide any underlying contracts (attach if so — convert_to_markdown).

Drafting flow:
1. Ask for missing context (factual matrix, prior correspondence, witness identities).
2. create_document titled "Statement of Claim".
3. set_outline: Introduction | Parties | Jurisdiction | Factual Background | Legal Submissions (per claim) | Quantum | Relief Sought.
4. Fill via write_section. Use numbered paragraphs. Cite contract clauses and exhibits.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'draft-statement-of-defense',
    title: 'Draft statement of defense',
    description: 'Mirror submission to a statement of claim, exported as DOCX.',
    practiceAreas: ['arbitration'],
    prompt: `I'll attach the statement of claim. convert_to_markdown, get_outline, read_section through.

Drafting flow:
1. Identify each claim and the factual basis.
2. create_document titled "Statement of Defense".
3. set_outline: Introduction | Response to Claimant's Factual Background | Jurisdictional Objections (if any) | Defense to Each Claim | Counterclaims (if any) | Relief Sought.
4. Fill via write_section, addressing each claim paragraph-by-paragraph where possible.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'draft-witness-statement',
    title: 'Draft witness statement',
    description: 'IBA-style witness statement from notes, exported as DOCX.',
    practiceAreas: ['arbitration', 'litigation'],
    prompt: `I'll provide notes from the witness interview (paste or attach).

Drafting flow:
1. Ask for the witness's role, the topics to cover, and the relevant time period.
2. create_document titled "Witness Statement of [Name]".
3. set_outline: Introduction (witness background) | [Topic 1] | [Topic 2] | … | Statement of Truth.
4. Fill via write_section. First-person, numbered paragraphs, IBA-style. Cite exhibits where the witness references documents.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'redfern-schedule',
    title: 'Build a Redfern schedule',
    description: 'Document production request schedule with objections and responses.',
    practiceAreas: ['arbitration'],
    prompt:
      "I'll describe the dispute and the categories of documents I want produced (or attach the parties' existing positions). Output a Redfern schedule as a markdown table: # | Description of Document(s) | Relevance + Materiality | Anticipated Objection | Response | Tribunal Decision (blank). Aim for 8–15 well-scoped categories — narrow enough to be granted.",
  },
  {
    id: 'procedural-order-outline',
    title: 'Draft Procedural Order No. 1 outline',
    description: 'PO1 covering case management, exported as DOCX.',
    practiceAreas: ['arbitration'],
    prompt: `I'll describe the case and any agreed dates.

Drafting flow:
1. Ask for the parties, seat, rules, and any procedural agreements already reached.
2. create_document titled "Procedural Order No. 1".
3. set_outline: Procedural Calendar | Language + Communication | Submissions | Document Production | Witnesses + Experts | Hearing | Confidentiality | Costs.
4. Fill via write_section. Use neutral, tribunal-friendly drafting.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'jurisdictional-challenge-memo',
    title: 'Jurisdictional challenge memo',
    description: 'Strategy + arguments memo for kompetenz-kompetenz challenges.',
    practiceAreas: ['arbitration'],
    prompt:
      "I'll attach the arbitration agreement and describe the basis for the challenge. convert_to_markdown the agreement. Output a memo: Clause Text + Operative Words | Challenge Theory (existence, validity, scope, arbitrability, capacity, separability) | Governing Law of the Arbitration Agreement | Tribunal's Likely Approach | Recommended Strategy (raise pre-tribunal? in answer? as preliminary issue?) | Risk if Lost.",
  },
  {
    id: 'post-hearing-brief-outline',
    title: 'Draft post-hearing brief outline',
    description: 'Closing-submission structure, exported as DOCX.',
    practiceAreas: ['arbitration'],
    prompt: `I'll describe the hearing record and key issues.

Drafting flow:
1. Ask for the issue list the tribunal flagged (if any) and the evidentiary highlights.
2. create_document titled "Post-Hearing Brief".
3. set_outline: Introduction | Procedural Recap | Issue 1 (Facts | Law | Application) | Issue 2 … | Quantum | Costs | Conclusion.
4. Fill via write_section. Cite hearing transcript page/line and exhibit numbers throughout.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'enforcement-application-memo',
    title: 'Award enforcement strategy memo',
    description: 'New York Convention enforcement planning.',
    practiceAreas: ['arbitration'],
    prompt:
      "I'll attach the award and identify target jurisdictions for enforcement. convert_to_markdown the award. Output a memo: Award Summary (1 paragraph) | Enforcement Forum Analysis (per jurisdiction: NY Convention status, local procedure, asset visibility, defenses likely raised) | Recommended Sequencing | Settlement-Leverage Considerations.",
  },

  // ================================================================
  // BUSINESS OF LAW — additional engagement and BD recipes.
  // ================================================================
  {
    id: 'engagement-letter-draft',
    title: 'Draft an engagement letter',
    description: 'Standard engagement letter from intake notes, exported as DOCX.',
    practiceAreas: ['business-of-law'],
    prompt: `I'll describe the matter (client, scope, fee model, key contacts).

Drafting flow:
1. Ask for any missing context (responsible partner, conflicts already cleared, billing entity).
2. create_document titled "Engagement Letter — [Client] — [Matter]".
3. set_outline: Engagement | Scope of Representation | Fees + Costs | Billing | Conflicts + Waivers | Confidentiality | Termination + File Return | Other Provisions.
4. Fill via write_section. Use the firm's standard language conventions where you can infer them; flag where you're guessing.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'conflict-check-memo',
    title: 'Conflict check memo',
    description: 'Adverse-party check + waiver analysis.',
    practiceAreas: ['business-of-law'],
    prompt:
      "I'll describe the prospective matter and the parties. Output: Direct Adversity Check (the parties + likely affiliates to run) | Subject-Matter Adversity Considerations | Positional Conflicts | Recommended Search Strings for the Conflicts System | Waiver Strategy if Conflict Surfaces | Documentation Required.",
  },
  {
    id: 'afa-pricing-proposal',
    title: 'Draft AFA / pricing proposal',
    description: 'Alternative fee structure proposal, exported as DOCX.',
    practiceAreas: ['business-of-law'],
    prompt: `I'll describe the matter, scope, and client cost-sensitivity.

Drafting flow:
1. Ask for the team composition and historical comparable matter data if available.
2. create_document titled "Fee Proposal — [Matter]".
3. set_outline: Matter Overview | Phases and Assumptions | Fee Structure (fixed/capped/blended/contingent components) | Out-of-Scope and Change-Control | Volume/Performance Discounts | Reporting and Governance.
4. Fill via write_section with concrete numbers and assumptions.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'matter-budget',
    title: 'Build a matter budget',
    description: 'Phase-task budget with assumptions and sensitivities.',
    practiceAreas: ['business-of-law'],
    prompt:
      "I'll describe the matter, team, and expected duration. Output a phase-task budget as a markdown table: Phase | Task | Hours by Timekeeper Class | Rate | Phase Subtotal. Add a final 'Total' row. Below the table, list 5 assumptions and 3 sensitivities (what would push the budget up or down).",
  },
  {
    id: 'legal-hold-notice',
    title: 'Draft a legal hold notice',
    description: 'Preservation notice to custodians, exported as DOCX.',
    practiceAreas: ['business-of-law', 'litigation'],
    prompt: `I'll describe the matter, custodians, and date range to preserve.

Drafting flow:
1. Ask for the categories of materials and any active automated deletion to suspend.
2. create_document titled "Legal Hold Notice — [Matter]".
3. set_outline: Why You Are Receiving This | What to Preserve | What NOT to Delete or Modify | How to Acknowledge | Whom to Contact.
4. Fill via write_section. Plain English; no legalese. Include an acknowledgment receipt block at the end.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'pitch-deck-outline',
    title: 'Draft a pitch deck outline',
    description: 'BD pitch outline tailored to a client opportunity, exported as DOCX.',
    practiceAreas: ['business-of-law'],
    prompt: `I'll name the client/prospect, the matter type, and what we know about their pain points.

Drafting flow:
1. Use http_request + vector_search to gather public + internal intel.
2. create_document titled "[Client] — Pitch".
3. set_outline: Why You / Why Now | Our Understanding of Your Situation | Our Approach | Team | Relevant Experience | Pricing Approach | Next Steps.
4. Fill via write_section. Be specific to this opportunity, not generic firm boilerplate.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'new-matter-intake-memo',
    title: 'New matter intake memo',
    description: 'Intake checklist + risk flags before opening a matter.',
    practiceAreas: ['business-of-law'],
    prompt:
      "I'll describe the matter and client. Output an intake memo: Client Identity (entity type, ultimate beneficial owner if relevant, sanctions screening) | Matter Description | Conflicts Status | Engagement Letter Status | Fee Arrangement | Billing Setup | Team Composition | Required Approvals (PIC sign-off, ethics, sanctions, sector) | Open Items.",
  },

  // ================================================================
  // CAPITAL MARKETS
  // ================================================================
  {
    id: 's1-outline',
    title: 'Draft Form S-1 outline',
    description: 'Registration statement skeleton + responsibility map, exported as DOCX.',
    practiceAreas: ['capital-markets'],
    prompt: `I'll describe the issuer (industry, size, deal type — IPO / follow-on / SPAC).

Drafting flow:
1. Ask for the underwriting structure and any prior-art filings to mirror.
2. create_document titled "Form S-1 — Outline".
3. set_outline mirroring Reg S-K Items: Cover + Inside Front Cover | Prospectus Summary | Risk Factors | Use of Proceeds | Capitalization | Dilution | Selected Financial Data | MD&A | Business | Management | Compensation | Principal Stockholders | Related-Party | Description of Capital Stock | Underwriting | Legal Matters | Experts | Index to Financial Statements.
4. Fill each section heading with: Reg S-K item | Drafting owner | Source documents | Open items.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'mda-outline',
    title: 'Draft MD&A outline',
    description: '10-K / 10-Q MD&A skeleton anchored to the financials.',
    practiceAreas: ['capital-markets'],
    prompt: `I'll describe the issuer and the period (annual or quarterly).

Drafting flow:
1. Ask for prior-period MD&A (attach if so — convert_to_markdown) and the new period's financials.
2. create_document titled "MD&A — [Period]".
3. set_outline: Overview | Results of Operations (period-over-period) | Liquidity and Capital Resources | Critical Accounting Estimates | Recent Accounting Pronouncements | Off-Balance-Sheet Arrangements | Forward-Looking Statements.
4. Fill each via write_section. Anchor every quantitative assertion to a financial-statement line.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'risk-factor-draft',
    title: 'Draft a risk factor',
    description: 'Tailored risk-factor disclosure following SEC Reg S-K Item 105.',
    practiceAreas: ['capital-markets'],
    prompt:
      "I'll describe the risk topic and the issuer's specific exposure. Draft a risk factor following Reg S-K Item 105 conventions: descriptive heading (the risk in 1 sentence) | first sentence stating the risk | facts that make it material to this issuer | possible impacts on the business / results / stock | why mitigations may not work. Aim for 150–250 words. Avoid boilerplate and 'could,' 'may' stacking.",
  },
  {
    id: 'underwriter-agreement-review',
    title: 'Review an underwriting agreement',
    description: 'Markup-ready review of UA reps, conditions, indemnity.',
    practiceAreas: ['capital-markets'],
    prompt:
      "I'll attach the underwriting agreement. convert_to_markdown, walk via get_outline + read_section. Output a structured review: Issuer reps (and any unusual ones) | Conditions to closing | Indemnification + contribution (and any non-standard caps/carve-outs) | Lock-up scope | Force majeure / market-out language | Section 11/12 considerations | Notable redline targets. Cite heading paths.",
  },
  {
    id: 'comfort-letter-checklist',
    title: 'Comfort letter checklist',
    description: 'Auditor comfort items linked to prospectus references.',
    practiceAreas: ['capital-markets'],
    prompt:
      "I'll attach the prospectus (or describe the offering). convert_to_markdown if attached. Output a comfort-letter request checklist: Page/Section in Prospectus | Tickmark Reference | Type of Comfort (negative assurance / agreed-upon procedures / SAS 100 review) | Source Document the Auditor Will Trace To. Cover at minimum: financial statements, capitalization, MD&A figures, recent-period numbers, ratios, non-GAAP measures.",
  },
  {
    id: 'indenture-review',
    title: 'Review an indenture',
    description: 'Trust indenture provisions: covenants, defaults, modifications.',
    practiceAreas: ['capital-markets', 'transactional'],
    prompt:
      "I'll attach the indenture. convert_to_markdown, get_outline. Output a structured review: Issuer + Trustee + Notes | Definitions worth flagging (Permitted Debt, Permitted Liens, Asset Sale, Change of Control, Restricted Payment) | Covenants by category | Events of Default and remedies | Modifications + Waivers | Defeasance | Notable departures from market-standard. Cite heading paths throughout.",
  },
  {
    id: 'reg-d-compliance',
    title: 'Reg D / Reg S offering compliance memo',
    description: 'Exemption analysis for an unregistered offering.',
    practiceAreas: ['capital-markets'],
    prompt:
      "I'll describe the offering (size, investors, geography, marketing). Walk through: Section 4(a)(2) baseline | Reg D Rule 506(b) vs 506(c) eligibility | Bad-actor analysis | Form D timing | Reg S Category 1/2/3 if applicable | State blue-sky | General-solicitation considerations. Output a structured memo with a recommended exemption + compliance steps.",
  },
  {
    id: 'edgar-filing-checklist',
    title: 'EDGAR filing checklist',
    description: 'Pre-filing review before EDGAR submission.',
    practiceAreas: ['capital-markets'],
    prompt:
      "I'll describe the filing type (S-1, 10-K, 10-Q, 8-K, etc.). Output a checklist: Cover page complete (CIK, exchange, file number) | Inline XBRL tagged | Exhibit Index complete + cross-referenced | Hyperlinks | Officer signatures | Auditor consent (if applicable) | EDGAR codes (e.g. 8-K item codes) | Header data | Filing fee table | Confidential treatment redactions cleared. Tailor the checklist to the specific filing type.",
  },
  {
    id: 'esg-climate-disclosure',
    title: 'ESG / climate disclosure review',
    description: 'Map disclosure against SEC + ISSB + CSRD requirements.',
    practiceAreas: ['capital-markets'],
    prompt:
      "I'll attach the filing or sustainability report. convert_to_markdown. Walk via get_outline + read_section on climate / sustainability sections. Output a coverage matrix: Topic | SEC (Reg S-K) | ISSB (S2) | CSRD (ESRS E1) | Disclosure present? | Notes. Cover at minimum: governance, strategy, scenario analysis, Scope 1/2/3 emissions, transition plan, financial impacts.",
  },
  {
    id: 'insider-trading-policy-review',
    title: 'Review an insider trading policy',
    description: 'Compliance against current SEC + exchange expectations.',
    practiceAreas: ['capital-markets'],
    prompt:
      "I'll attach the insider trading policy. convert_to_markdown, get_outline. Compare against current SEC + exchange expectations: scope of covered persons | trading windows + black-out periods | pre-clearance | 10b5-1 plan provisions (cooling-off, single-plan limits, certifications) | hedging + pledging restrictions | tipping prohibitions | enforcement + training. Output a gap analysis with cited heading paths.",
  },

  // ================================================================
  // EMPLOYMENT
  // ================================================================
  {
    id: 'severance-release-agreement',
    title: 'Draft severance + release agreement',
    description: 'Standard separation package, exported as DOCX.',
    practiceAreas: ['employment'],
    prompt: `I'll describe the separation (employee, role, jurisdiction, reason, package).

Drafting flow:
1. Ask for protected-status considerations (age 40+ → OWBPA / 21-day review) and whether group RIF.
2. create_document titled "Severance Agreement and Release — [Employee]".
3. set_outline: Recitals | Separation Date | Severance Payments | Benefits Continuation | Release of Claims (with carve-outs) | Confidentiality + Non-Disparagement | Restrictive Covenants Reaffirmed | Cooperation | Return of Property | Governing Law + Dispute Resolution | Acknowledgments + Review Period | Signatures.
4. Fill via write_section, jurisdiction-aware.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'offer-letter-draft',
    title: 'Draft an offer letter',
    description: 'New-hire offer letter with comp + restrictive covenants, exported as DOCX.',
    practiceAreas: ['employment'],
    prompt: `I'll describe the role, comp package, and start date.

Drafting flow:
1. Ask for jurisdiction and whether equity is being granted.
2. create_document titled "Offer Letter — [Candidate] — [Role]".
3. set_outline: Position + Reporting | Start Date | Compensation (base, bonus, equity, benefits) | At-Will Statement | Conditions to Employment | Confidentiality + IP Assignment | Restrictive Covenants (jurisdiction-aware — flag if CA or other restrictive states) | Acceptance.
4. Fill via write_section.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'non-compete-enforceability',
    title: 'Non-compete enforceability analysis',
    description: 'Jurisdiction-aware enforceability memo.',
    practiceAreas: ['employment'],
    prompt:
      "I'll attach the non-compete clause (or paste). I'll also identify jurisdiction + employee role. convert_to_markdown if attached. Output: Clause Text | Geographic Scope | Temporal Scope | Activity Scope | Consideration | Jurisdiction's Enforceability Framework (e.g. CA ban, MA Garden Leave Act, FTC rule status) | Likely Enforceable Y/N | Modifications That Would Strengthen | Litigation Risk Notes.",
  },
  {
    id: 'internal-investigation-outline',
    title: 'Internal investigation plan',
    description: 'Scoping memo for HR/employment investigations.',
    practiceAreas: ['employment'],
    prompt:
      "I'll describe the allegation (complainant, respondent, conduct, dates). Output an investigation plan: Scope + Investigator | Privilege Assessment (in-house vs outside counsel; Upjohn warnings) | Document Hold | Witness List + Sequence | Interview Outline (per witness) | Confidentiality Protocol | Anti-Retaliation Reminders | Findings Memo Structure | Likely Remedial Actions.",
  },
  {
    id: 'eeoc-position-statement',
    title: 'Draft EEOC position statement',
    description: 'Response to a charge of discrimination, exported as DOCX.',
    practiceAreas: ['employment'],
    prompt: `I'll attach the EEOC charge.

Drafting flow:
1. convert_to_markdown the charge; identify protected basis and alleged conduct.
2. Ask for the personnel-file timeline and the legitimate non-discriminatory reason for the action.
3. create_document titled "Position Statement — Charge No. [###]".
4. set_outline: Introduction | Background (employer, charging party) | Statement of Facts | Legal Standards | Response to Each Allegation | Conclusion | Document Index.
5. Fill via write_section. Cite documents by Bates or filename + heading path.
6. export_to_docx and share the download link.`,
  },
  {
    id: 'handbook-policy-review',
    title: 'Review an employee handbook',
    description: 'Gap analysis against jurisdictional requirements.',
    practiceAreas: ['employment'],
    prompt:
      "I'll attach the handbook. convert_to_markdown, get_outline. Output a gap analysis matrix: Required Policy | Jurisdiction(s) Requiring | Present in Handbook? | Heading Path | Gap. Cover at minimum: at-will + EEO + harassment + accommodation + FMLA/state leave + paid sick + lactation + pay transparency + meal/rest + WPV + AI use + remote work + electronic monitoring + complaint procedure.",
  },
  {
    id: 'wage-hour-classification',
    title: 'Wage-hour classification analysis',
    description: 'Exempt vs non-exempt analysis under FLSA + state law.',
    practiceAreas: ['employment'],
    prompt:
      "I'll describe the role (duties, salary, supervision, decision authority). Walk through: salary-basis test (current threshold) | duties test (executive / administrative / professional / outside-sales / computer / HCE) | state-law overlay (CA, NY, WA salary thresholds; CA quantitative duties test) | misclassification risk + remedies (backpay, liquidated damages, attorney's fees). Output: Classification | Reasoning | Risk Factors | Recommended Position.",
  },
  {
    id: 'reasonable-accommodation-memo',
    title: 'Reasonable accommodation analysis',
    description: 'ADA/Title VII interactive-process documentation.',
    practiceAreas: ['employment'],
    prompt:
      "I'll describe the request (employee, condition, requested accommodation, essential job functions). Output: Disability/Religion Trigger | Essential Functions Identified | Requested Accommodation | Alternative Accommodations Considered | Undue Hardship Analysis (cost, operational impact, safety) | Direct-Threat Analysis if applicable | Recommended Outcome | Interactive-Process Documentation Steps.",
  },
  {
    id: 'warn-notice-draft',
    title: 'Draft WARN / state mini-WARN notice',
    description: 'Plant-closing or mass-layoff notice, exported as DOCX.',
    practiceAreas: ['employment'],
    prompt: `I'll describe the layoff (employer, locations, headcount, dates).

Drafting flow:
1. Ask for state-specific overlays (CA, NY, NJ, IL etc.) and any union obligations.
2. create_document titled "WARN Act Notice".
3. set_outline: Notice Recipients | Description of Action | Affected Employees | Expected Date(s) | Bumping Rights | Contact for Information.
4. Fill via write_section. Use the federal + applicable state requirements (state usually controls).
5. export_to_docx and share the download link.`,
  },
  {
    id: 'restrictive-covenant-review',
    title: 'Review restrictive covenants in an existing agreement',
    description: 'Non-compete + non-solicit + confidentiality assessment.',
    practiceAreas: ['employment'],
    prompt:
      "I'll attach the agreement. convert_to_markdown, search_document for 'compete', 'solicit', 'confidential', 'trade secret'. Output: Each Covenant (text + heading path) | Geographic + Temporal + Activity Scope | Governing Law + Forum | Jurisdiction's Enforceability | Recommended Modifications | Risk Score (high/med/low).",
  },
  {
    id: 'independent-contractor-analysis',
    title: 'Independent contractor classification analysis',
    description: 'ABC test + IRS factors review.',
    practiceAreas: ['employment'],
    prompt:
      "I'll describe the engagement (services, control level, payment structure, exclusivity). Walk through: IRS common-law test | Federal economic-realities test | State ABC test (where applicable) | Industry-specific tests (drivers, gig). Output: Classification under each framework | Misclassification risk by jurisdiction | Recommended structure changes if reclassifying.",
  },
  {
    id: 'rif-planning-memo',
    title: 'RIF planning memo',
    description: 'Process + adverse-impact analysis for a reduction in force.',
    practiceAreas: ['employment'],
    prompt:
      "I'll describe the planned RIF (decisional unit, headcount, business reason). Output a planning memo: Decisional Unit Definition | Selection Criteria | Adverse-Impact Analysis Plan (statistical screen by protected class) | OWBPA Disclosures (if 40+ in group) | WARN / mini-WARN Triggers | Communication Plan | Severance Terms | Documentation Required | Litigation Risk Notes.",
  },

  // ================================================================
  // INTELLECTUAL PROPERTY
  // ================================================================
  {
    id: 'trademark-clearance-memo',
    title: 'Trademark clearance memo',
    description: 'Knock-out + full search analysis for a new mark.',
    practiceAreas: ['intellectual-property'],
    prompt:
      "I'll name the proposed mark, classes, and target jurisdictions. Use http_request for USPTO TESS / EUIPO / WIPO databases. Output: Mark | Distinctiveness Spectrum (generic→fanciful) | Knock-Out Hits by Class + Jurisdiction | Likelihood-of-Confusion Risk | Descriptiveness/Genericness Risk | Recommended Next Steps (file ITU, modify mark, full search). Cite each hit's source URL.",
  },
  {
    id: 'trademark-opposition-strategy',
    title: 'Trademark opposition strategy',
    description: 'TTAB / EUIPO / national opposition planning.',
    practiceAreas: ['intellectual-property'],
    prompt:
      "I'll describe the senior + junior marks and the forum. Output a strategy memo: Mark Comparison | Goods/Services Comparison | DuPont (US) / Sabel + Lloyd (EU) factors applied | Standing | Grounds (likelihood of confusion, dilution, descriptiveness, fraud, abandonment) | Procedural Path + Timing + Costs | Settlement Considerations (consent agreement structure).",
  },
  {
    id: 'patent-claim-chart',
    title: 'Patent claim chart',
    description: 'Element-by-element infringement / validity chart.',
    practiceAreas: ['intellectual-property'],
    prompt:
      "I'll attach the patent and the accused product/spec (or prior art for a validity chart). convert_to_markdown both. For each independent claim, output a markdown table: Claim Element | Limitation Text | Mapped to Accused Product / Prior Art | Citation (column:line for patent; spec section for product) | Note. Then summarize: each claim's overall result (likely infringed/anticipated/obvious or not).",
  },
  {
    id: 'patent-license-review',
    title: 'Review a patent license',
    description: 'Grant scope + economics + conditions analysis.',
    practiceAreas: ['intellectual-property', 'transactional'],
    prompt:
      "I'll attach the license. convert_to_markdown, get_outline. Output a structured review: Grant (field + territory + exclusivity + sublicensability) | Patents Licensed (and any improvements) | Economics (running royalties, milestones, minimums, audit) | Term + Termination + Survival | Reps + Warranties (validity / enforceability / non-infringement) | Indemnities + Liability Caps | Bankruptcy (Section 365(n)) | Most-Favored-Licensee | Notable departures from market.",
  },
  {
    id: 'open-source-compliance-review',
    title: 'Open-source compliance review',
    description: 'License-mix audit + redistribution risk.',
    practiceAreas: ['intellectual-property'],
    prompt:
      "I'll provide an SBOM or describe the codebase. Output: Component | Version | License | Category (permissive / weak copyleft / strong copyleft / network copyleft / unknown) | Distribution Trigger | Compliance Action (notice, source offer, isolation, removal). Add a section on policy gaps and recommended ingestion gating.",
  },
  {
    id: 'ip-due-diligence-memo',
    title: 'IP due diligence memo',
    description: 'Target-IP review for an M&A transaction, exported as DOCX.',
    practiceAreas: ['intellectual-property', 'mergers-acquisitions'],
    prompt: `I'll describe the target's IP profile (or attach the dataroom IP folder).

Drafting flow:
1. convert_to_markdown for any attached docs; walk via outlines.
2. create_document titled "IP Due Diligence — [Target]".
3. set_outline: Inventory + Chain of Title | Registered Rights (patents/TM/copyrights) | Material Inbound + Outbound Licenses | Open-Source + Third-Party Code | Trade Secrets + Confidentiality Programs | Pending Litigation + Office Actions | Employee Assignments | Government Funding (Bayh-Dole) | Risks + Recommendations.
4. Fill via write_section.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'freedom-to-operate-analysis',
    title: 'Freedom-to-operate analysis',
    description: 'Patent FTO scoping memo.',
    practiceAreas: ['intellectual-property'],
    prompt:
      "I'll describe the product/feature and target geographies. Output: FTO Scope (technology + jurisdictions + timeframe) | Search Strategy (CPC classes, keywords, key competitors) | Triage Categories (clearly out / clearly in / requires deeper review) | Risk Mitigation Options (design-around, license, invalidate, indemnity) | Engagement Boundaries (what FTO does + does not certify).",
  },
  {
    id: 'trade-secret-protection-plan',
    title: 'Trade secret protection plan',
    description: 'Reasonable-measures program review.',
    practiceAreas: ['intellectual-property'],
    prompt:
      "I'll describe the company's trade-secret assets. Output a protection plan: Asset Inventory | Access Controls (NTK, RBAC) | Employee Lifecycle (NDA, IP assignment, training, exit interview) | Contractor / Vendor Controls | Physical + IT Security | Marking + Tracking | Incident Response | Litigation-Readiness (DTSA seizure, TRO playbook). Map to UTSA / DTSA reasonable-measures expectations.",
  },
  {
    id: 'dmca-takedown',
    title: 'Draft DMCA takedown notice',
    description: '512(c) compliant notice to a service provider.',
    practiceAreas: ['intellectual-property'],
    prompt: `I'll provide the infringing URL and the rightsholder details.

Drafting flow:
1. Ask for the original work + ownership proof + the platform's designated agent address.
2. create_document titled "DMCA Notice — [Work]".
3. Include all 512(c)(3) elements: physical/electronic signature, identification of the work, identification of the material to be removed, contact info, good-faith statement, accuracy statement under penalty of perjury, signature.
4. export_to_docx and share the download link.`,
  },
  {
    id: 'patent-infringement-analysis',
    title: 'Patent infringement analysis',
    description: 'Direct + DOE infringement assessment.',
    practiceAreas: ['intellectual-property'],
    prompt:
      "I'll attach the patent and describe the accused product. convert_to_markdown the patent. For each asserted claim: claim construction (ordinary meaning + intrinsic evidence + relevant prosecution history) | element-by-element literal infringement | doctrine of equivalents | indirect-infringement bases (induced, contributory) | defenses (non-infringement, invalidity, exhaustion, license, prosecution-history estoppel). Output: claim-by-claim assessment with citations.",
  },
  {
    id: 'copyright-registration-memo',
    title: 'Copyright registration memo',
    description: 'Register-or-not + deposit material analysis.',
    practiceAreas: ['intellectual-property'],
    prompt:
      "I'll describe the work (type, authorship, work-for-hire status, publication status). Output: Registration Recommendation | Form Type (TX/PA/SR/VA/SE/GR) | Deposit Requirements | Authorship + Work-For-Hire Analysis | Effective Date Considerations (statutory damages eligibility, infringement-suit prerequisite) | Foreign-Origin Considerations (Berne formality bar) | Group/Pre-Registration Eligibility.",
  },
  {
    id: 'nda-piia-review',
    title: 'Review NDA / PIIA',
    description: 'Confidentiality + IP-assignment review for an employment context.',
    practiceAreas: ['intellectual-property', 'employment'],
    prompt:
      "I'll attach an NDA or proprietary-information-and-inventions agreement. convert_to_markdown. Output a structured review: Definitions of Confidential Information | Carve-Outs (publicly known, lawfully obtained, independently developed, whistleblower) | Term + Survival | IP Assignment Scope (jurisdiction-aware — CA Labor Code 2870, IL Workplace Transparency Act, etc.) | Restrictive Covenants Bundled In | Defend Trade Secrets Act Notice (required for whistleblower immunity) | Notable issues.",
  },

  // ================================================================
  // LITIGATION — additional motion / discovery / trial recipes.
  // ================================================================
  {
    id: 'motion-to-dismiss-outline',
    title: 'Draft motion to dismiss outline',
    description: '12(b)(6) / 12(b)(1) / 12(b)(2) outline, exported as DOCX.',
    practiceAreas: ['litigation'],
    prompt: `I'll attach the complaint and identify the bases for dismissal.

Drafting flow:
1. convert_to_markdown the complaint; map each count to dismissal theory.
2. create_document titled "Motion to Dismiss — Outline".
3. set_outline: Introduction + Relief Sought | Background (procedural + factual taken as alleged) | Legal Standard | Argument I (per ground) | Argument II … | Conclusion.
4. Fill via write_section. For Twombly/Iqbal arguments, walk through what's conclusory vs factual paragraph-by-paragraph.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'summary-judgment-outline',
    title: 'Draft summary judgment outline',
    description: 'MSJ skeleton with statement of undisputed facts.',
    practiceAreas: ['litigation'],
    prompt: `I'll describe the case posture and target claims.

Drafting flow:
1. Ask for the discovery record citations supporting each undisputed fact.
2. create_document titled "Motion for Summary Judgment — Outline".
3. set_outline: Introduction | Statement of Undisputed Material Facts (numbered, each with record citation) | Legal Standard | Argument (per claim/element) | Conclusion.
4. Fill via write_section.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'discovery-plan',
    title: 'Build a discovery plan',
    description: 'Phase-task discovery plan with proportionality analysis.',
    practiceAreas: ['litigation'],
    prompt:
      "I'll describe the case (claims, defenses, key disputed facts). Output a discovery plan: Issue-by-Issue Proof Map | Custodians + Sources | Document-Production Strategy + Volume Estimate | RFP / RFA / Interrogatory Plan | Deposition Sequence + Topics | Expert Strategy | ESI Protocol Issues | Proportionality Notes (per Rule 26(b)(1) factors) | Schedule + Milestones.",
  },
  {
    id: 'deposition-outline',
    title: 'Draft deposition outline',
    description: 'Topic-and-exhibit-based deposition outline.',
    practiceAreas: ['litigation'],
    prompt:
      "I'll describe the witness (role, connection to facts) and the case theory. Output a deposition outline: Background / Scope / Foundation | Topic 1: Goal | Key Documents (Bates) | Question Threads | Lock-Down Points (admissions you need) | Topic 2 … | Wrap-up + Catch-All. Mark each question with the case theory it serves.",
  },
  {
    id: 'settlement-demand-letter',
    title: 'Draft settlement demand letter',
    description: 'Pre-filing or mid-case demand, exported as DOCX.',
    practiceAreas: ['litigation'],
    prompt: `I'll describe the case (parties, claims, damages, posture).

Drafting flow:
1. Ask for the strongest 3 facts and the negotiation goals.
2. create_document titled "Demand Letter — [Matter]".
3. set_outline: Summary | Facts | Legal Theories + Liability Exposure | Damages | Demand + Deadline | Reservations of Rights.
4. Fill via write_section. Tone: firm, factual, resolution-oriented.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'mediation-statement',
    title: 'Draft mediation statement',
    description: 'Confidential mediation submission, exported as DOCX.',
    practiceAreas: ['litigation'],
    prompt: `I'll describe the dispute and what the mediator should know.

Drafting flow:
1. Ask whether the statement will be exchanged or kept ex parte.
2. create_document titled "Mediation Statement".
3. set_outline: Confidentiality Statement | Parties + Procedural Posture | Statement of Facts | Liability Analysis | Damages | Settlement Posture + Bargaining Range | Issues for the Mediator.
4. Fill via write_section.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'trial-outline',
    title: 'Build a trial outline',
    description: 'Witness order + exhibits + proof matrix.',
    practiceAreas: ['litigation'],
    prompt:
      "I'll describe the case (claims, defenses, witnesses, key exhibits). Output a trial outline: Theme of the Case | Order of Proof (witness sequencing) | Witness-by-Witness (purpose, key Q&A, exhibits introduced) | Exhibit List + Foundation Plan | Stipulations + Pretrial Motions | Closing Themes + Jury Instruction Targets.",
  },
  {
    id: 'legal-hold-memo',
    title: 'Draft litigation legal-hold memo',
    description: 'Internal preservation memo for litigation.',
    practiceAreas: ['litigation'],
    prompt: `I'll describe the matter and reasonably anticipated litigation trigger.

Drafting flow:
1. Ask for the custodian list and data sources.
2. create_document titled "Litigation Hold Memo — [Matter]".
3. set_outline: Trigger | Scope (subject matter + date range + custodians) | Materials to Preserve | IT Auto-Deletion Suspensions | Acknowledgment Procedure | Re-Issuance + Updates | Release Conditions.
4. Fill via write_section.
5. export_to_docx and share the download link.`,
  },

  // ================================================================
  // M&A — additional deal-doc reviews.
  // ================================================================
  {
    id: 'term-sheet-review',
    title: 'Review an M&A term sheet',
    description: 'Markup-ready review of LOI / term sheet.',
    practiceAreas: ['mergers-acquisitions'],
    prompt:
      "I'll attach the term sheet / LOI. convert_to_markdown, get_outline. Output a structured review: Structure (stock vs asset vs merger; cash vs stock vs mixed) | Price + Adjustments (working capital, indebtedness, transaction expenses) | Conditions (financing, regulatory, third-party consents) | Reps Survival + Indemnification | R&W Insurance References | Exclusivity (length + carve-outs) | Expense Reimbursement / Break Fees | Binding vs Non-Binding | Notable Departures from Market.",
  },
  {
    id: 'mae-clause-review',
    title: 'MAE clause review',
    description: 'Material-adverse-effect definition + exclusions analysis.',
    practiceAreas: ['mergers-acquisitions'],
    prompt:
      "I'll attach the MAE definition (or the full agreement). convert_to_markdown if needed; search_document for 'Material Adverse'. Output: Trigger Language | Carve-Outs (industry-wide, market, war, pandemic, change of law, action required by agreement) | Disproportionate-Impact Carve-Backs | Pending Litigation Specific Carve-Outs | Forward-Looking vs Existing Distinction | Comparison to Recent Market Examples | Risk Score (buyer-favorable / seller-favorable / market).",
  },
  {
    id: 'working-capital-adjustment-memo',
    title: 'Working capital adjustment memo',
    description: 'WC mechanism + dispute-process analysis.',
    practiceAreas: ['mergers-acquisitions'],
    prompt:
      "I'll attach the purchase agreement. convert_to_markdown, search_document for 'working capital', 'adjustment', 'closing balance sheet', 'target'. Output: Target / Estimated / Final WC mechanics | Accounting Principles + Hierarchy | Dispute Process + Independent Accountant Scope | Sample Calculation Template | Risk Areas (definitional ambiguities, GAAP/practices conflicts) | Recommended modifications.",
  },
  {
    id: 'rw-insurance-summary',
    title: 'R&W insurance policy summary',
    description: 'RWI coverage, exclusions, and process.',
    practiceAreas: ['mergers-acquisitions', 'transactional'],
    prompt:
      "I'll attach the R&W insurance policy (or the deal binder). convert_to_markdown, get_outline. Output: Insured + Carrier + Limits + Retention | Coverage Period | General Exclusions | Deal-Specific Exclusions | Knowledge Scrape | Subrogation Waivers | Dispute Resolution | Notice + Claim Process | Notable Coverage Gaps vs the indemnification package in the SPA.",
  },
  {
    id: 'indemnification-cap-analysis',
    title: 'Indemnification cap + survival analysis',
    description: 'Survival + cap + basket sizing review.',
    practiceAreas: ['mergers-acquisitions'],
    prompt:
      "I'll attach the SPA. convert_to_markdown, search_document for 'indemnification', 'survival', 'basket', 'cap'. Output: General Reps Survival + Cap | Fundamental Reps Survival + Cap | Tax Rep Survival + Cap | Covenants Survival | Deductible / Tipping Basket / Mini-Basket | Sole-Recourse Provisions | Sandbagging | Set-Off Rights | Comparison to market for deal size + sector.",
  },
  {
    id: 'disclosure-schedule-review',
    title: 'Disclosure schedule review',
    description: 'Schedule completeness + cross-reference check.',
    practiceAreas: ['mergers-acquisitions'],
    prompt:
      "I'll attach the disclosure schedules (and ideally the SPA reps). convert_to_markdown both. Walk schedule by schedule: List the Rep | Schedule Number | Items Disclosed | Issues (vague language, missing detail, items belonging on a different schedule, items that should trigger a closing condition). Close with a list of follow-up requests.",
  },
  {
    id: 'escrow-agreement-review',
    title: 'Escrow agreement review',
    description: 'Indemnity escrow + adjustment escrow mechanics review.',
    practiceAreas: ['mergers-acquisitions'],
    prompt:
      "I'll attach the escrow agreement. convert_to_markdown, get_outline. Output a structured review: Escrow Agent + Funds + Investments | Release Mechanics (joint instruction / unilateral / contested) | Dispute Process + Interpleader | Tax Treatment | Fees | Indemnification of Escrow Agent | Resignation + Successor | Notable Departures from Market.",
  },
  {
    id: 'post-closing-integration-plan',
    title: 'Post-closing integration plan',
    description: 'Day-1 / 30 / 100 integration roadmap.',
    practiceAreas: ['mergers-acquisitions'],
    prompt:
      "I'll describe the deal and the buyer's integration philosophy. Output a roadmap: Day 1 (announcement, leadership, key customer/employee comms, IT cutover) | First 30 Days (governance, financial reporting, comp harmonization start) | First 100 Days (systems consolidation, redundancy decisions, brand decisions, contract assignment confirmation) | Functional Workstreams (HR, IT, Legal, Finance, Tax, Comms, Operations) | Risk + Issues Log Template.",
  },
  {
    id: 'fairness-opinion-review',
    title: 'Fairness opinion review',
    description: 'Banker fairness-opinion structural review.',
    practiceAreas: ['mergers-acquisitions'],
    prompt:
      "I'll attach the fairness opinion. convert_to_markdown, get_outline. Output: Opinion Holder + Engagement | Scope of Fairness (financial point of view, to whom) | Methodologies Used (DCF, comparable companies, precedent transactions, premiums paid) | Ranges Disclosed | Assumptions + Limitations | Conflicts Disclosure (banker fees, prior relationships) | Comparison to Similar Transactions' Opinions.",
  },

  // ================================================================
  // PRIVACY & DATA
  // ================================================================
  {
    id: 'privacy-notice-draft',
    title: 'Draft a privacy notice',
    description: 'GDPR + CCPA compliant external privacy notice, exported as DOCX.',
    practiceAreas: ['privacy-data'],
    prompt: `I'll describe the company's data processing (categories, purposes, jurisdictions, recipients).

Drafting flow:
1. Ask for any sector-specific overlays (HIPAA, COPPA, GLBA).
2. create_document titled "Privacy Notice".
3. set_outline: Who We Are | Data We Collect | Sources | Purposes + Legal Bases | Sharing | International Transfers | Retention | Your Rights | How to Exercise Your Rights | Cookies + Tracking | Children | Changes | Contact + DPO | State-Specific Disclosures (CA/CO/CT/VA/etc.).
4. Fill via write_section.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'dpa-review',
    title: 'Review a data processing agreement (DPA)',
    description: 'Article 28 + sub-processor + transfer review.',
    practiceAreas: ['privacy-data'],
    prompt:
      "I'll attach the DPA. convert_to_markdown, get_outline. Output a structured review: Roles (controller / processor / joint controller) | Subject Matter + Duration + Nature + Purpose | Categories of Data + Data Subjects | Processor Obligations (Art 28(3)) | Sub-Processor Mechanism | Security Measures (TOMs detail or generic?) | Audit Rights | Breach Notification Timing | International Transfer Mechanism (SCCs / DPF / BCRs) | Return + Deletion | Liability Allocation | Notable Departures.",
  },
  {
    id: 'sccs-tia-memo',
    title: 'SCCs + Transfer Impact Assessment',
    description: 'Schrems II analysis for an EU-to-third-country transfer.',
    practiceAreas: ['privacy-data'],
    prompt:
      "I'll describe the transfer (data exporter, data importer, country, data categories, processing purpose). Output: Module Selection (1/2/3/4) | Operative Clauses + Annexes I-III | Country-Surveillance Assessment (per EDPB 01/2020 + recent case-law) | Practical + Legal + Technical Supplementary Measures | Residual Risk Assessment | Conclusion (transfer permissible? conditions?). Cite sources.",
  },
  {
    id: 'breach-notification-draft',
    title: 'Draft breach notifications',
    description: 'Multi-jurisdictional regulator + individual notifications.',
    practiceAreas: ['privacy-data'],
    prompt: `I'll describe the breach (categories of data, individuals, jurisdictions, root cause, remediation).

Drafting flow:
1. Ask for the discovery date and any law-enforcement-delay basis.
2. create_document titled "Breach Notifications — [Incident]".
3. set_outline: Regulator Notice — GDPR (72h) | Regulator Notice — US States | Regulator Notice — Sector (HHS/SEC/etc.) | Individual Notice | Substitute Notice | Mailing-List Tracking.
4. Fill via write_section. Each section includes the recipient(s), required content, and the timing rule.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'dpia-template',
    title: 'Build a DPIA / risk assessment',
    description: 'Article 35 GDPR DPIA template, exported as DOCX.',
    practiceAreas: ['privacy-data'],
    prompt: `I'll describe the processing activity.

Drafting flow:
1. Ask for stakeholders, data flows, and any prior assessments.
2. create_document titled "Data Protection Impact Assessment — [Activity]".
3. set_outline: Description of Processing | Necessity + Proportionality | Risks to Data Subjects | Mitigation Measures | Residual Risk + Sign-Off | Consultation (DPO + supervisory authority).
4. Fill via write_section.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'ai-governance-policy',
    title: 'Draft an AI governance policy',
    description: 'Internal AI use policy + EU AI Act mapping, exported as DOCX.',
    practiceAreas: ['privacy-data'],
    prompt: `I'll describe the company's AI usage (use cases, vendors, data sources).

Drafting flow:
1. Ask for the company's existing privacy + data-security policies.
2. create_document titled "AI Governance Policy".
3. set_outline: Scope + Definitions | Acceptable Use | Risk Classification (EU AI Act tiers) | Data Inputs + Outputs | Human Oversight | Vendor Diligence | Logging + Audit | Incident Response | Training + Acknowledgment.
4. Fill via write_section.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'cookie-banner-review',
    title: 'Review a cookie banner / CMP',
    description: 'Consent UI + cookie inventory review.',
    practiceAreas: ['privacy-data'],
    prompt:
      "I'll provide the website URL and any cookie inventory. Use http_request to load the homepage; describe the consent UX. Output: First-Layer Notice Adequacy | Granular Choice Available? | Reject-All Same Prominence as Accept-All? | Cookie Inventory by Category (necessary / preferences / statistics / marketing) | Pre-Consent Firing | Withdrawal Mechanism | Compliance with GDPR + ePrivacy + state laws. Flag any items likely to draw enforcement.",
  },
  {
    id: 'dsr-response',
    title: 'Draft DSR response',
    description: 'Data subject rights request response.',
    practiceAreas: ['privacy-data'],
    prompt:
      "I'll describe the request (right invoked, requester, applicable regimes). Output: Verification Steps | Scope of Search (systems, custodians, retention) | Applicable Exemptions | Response Format | Substantive Response Letter (draft) | Recordkeeping.",
  },
  {
    id: 'data-inventory',
    title: 'Build a data inventory',
    description: 'RoPA-style data-mapping artifact.',
    practiceAreas: ['privacy-data'],
    prompt:
      "I'll describe a business unit's processing activities. Output a RoPA-style markdown table: Activity | Categories of Personal Data | Categories of Data Subjects | Purpose | Legal Basis | Recipients | International Transfers + Mechanism | Retention | TOMs | DPIA Required?",
  },
  {
    id: 'cross-border-transfer-memo',
    title: 'Cross-border data transfer memo',
    description: 'Pick the right mechanism for a planned transfer.',
    practiceAreas: ['privacy-data'],
    prompt:
      "I'll describe the proposed transfer (origin, destination, data, purpose). Walk through: Source-jurisdiction requirements (GDPR, UK, Swiss, China PIPL Art 38–39, India DPDPA, Brazil LGPD) | Available Mechanisms (adequacy, DPF, SCCs + TIA, BCRs, derogations) | Recommended Mechanism | Implementation Steps | Ongoing Monitoring.",
  },
  {
    id: 'ai-act-classification',
    title: 'EU AI Act risk classification',
    description: 'Classify an AI system under the EU AI Act.',
    practiceAreas: ['privacy-data'],
    prompt:
      "I'll describe the AI system (purpose, deployment, sector). Walk through Articles 5-6 + Annexes I + III: Prohibited / High-Risk / Limited-Risk / Minimal-Risk classification | If high-risk: Article 9-15 obligations checklist (risk management, data governance, technical documentation, logging, transparency, human oversight, accuracy/robustness/cybersecurity) | GPAI considerations (Article 51-55 if applicable) | Timeline obligations.",
  },
  {
    id: 'childrens-privacy-review',
    title: "Children's privacy compliance review",
    description: 'COPPA + Age-Appropriate Design Code + GDPR Article 8 review.',
    practiceAreas: ['privacy-data'],
    prompt:
      "I'll describe the product (target audience, data collected, parental controls). Output: Age Threshold + Verification | Notice + Parental Consent Mechanism (COPPA verifiable parental consent) | Direct-Notice Content | School Authorization Considerations | UK Age-Appropriate Design Code Mapping | GDPR Article 8 (16/13) | California ADCA + similar state laws | Risk Score + Remediation Priorities.",
  },

  // ================================================================
  // REAL ESTATE
  // ================================================================
  {
    id: 'psa-markup',
    title: 'Markup a purchase and sale agreement',
    description: 'Buyer-side or seller-side PSA review.',
    practiceAreas: ['real-estate'],
    prompt:
      "I'll attach the PSA and tell you which side I'm on. convert_to_markdown, get_outline. Output a markup-ready review: Property Description + Excluded Assets | Purchase Price + Adjustments + Prorations | Deposit + Escrow | Due Diligence + Title + Survey | Reps + Survival | Operating Covenants Pre-Closing | Conditions to Closing | Closing Mechanics | Default + Remedies | Casualty + Condemnation | Brokers | Misc. For each, flag market vs non-market positions for my side and recommend specific edits. Cite heading paths.",
  },
  {
    id: 'lease-abstract',
    title: 'Build a lease abstract',
    description: 'One-page abstract of a commercial lease.',
    practiceAreas: ['real-estate'],
    prompt:
      "I'll attach the lease. convert_to_markdown, get_outline. Output a one-page abstract: Parties | Premises (RSF/USF) | Term + Options | Rent Schedule | Additional Rent (CAM/Tax/Insurance methodology) | Use | Alterations | Assignment + Sublet | Insurance + Indemnity | Casualty/Condemnation | Default + Remedies | SNDA + Estoppel | Other Material Terms. Cite heading paths.",
  },
  {
    id: 'title-objection-letter',
    title: 'Draft title objection letter',
    description: 'Objections to title commitment, exported as DOCX.',
    practiceAreas: ['real-estate'],
    prompt: `I'll attach the title commitment.

Drafting flow:
1. convert_to_markdown the commitment; identify Schedule B-I requirements + B-II exceptions.
2. Ask for any matters I want preserved or excluded.
3. create_document titled "Title Objection Letter".
4. set_outline: Introduction | Schedule A Comments | Schedule B-I Requirements (numbered objections) | Schedule B-II Exceptions (numbered objections) | Survey-Related Objections | Endorsements Requested.
5. Fill via write_section. For each objection, state what's required to cure.
6. export_to_docx and share the download link.`,
  },
  {
    id: 'survey-review',
    title: 'Survey review memo',
    description: 'ALTA/NSPS survey review against title.',
    practiceAreas: ['real-estate'],
    prompt:
      "I'll attach the survey + title commitment. convert_to_markdown both. Output: Survey Type + Standards Met (ALTA/NSPS Table A items) | Encroachments | Easements Visible vs Recorded | Setbacks + Building Lines | Access | Acreage | Flood Zone | Parking + Signage | Discrepancies vs Title | Endorsements Survey Supports.",
  },
  {
    id: 'estoppel-certificate',
    title: 'Draft + review estoppel certificate',
    description: 'Tenant or borrower estoppel.',
    practiceAreas: ['real-estate'],
    prompt:
      "I'll describe the deal and the type (tenant / borrower / ground lessor / declarant). Either: (a) draft a clean estoppel for tenant signature with all standard certifications + my client's specific asks, OR (b) review the proposed estoppel and flag risks (modifications I shouldn't certify, knowledge qualifiers I want, dollar-amount accuracy verification needs). Tell me which mode I'm asking for.",
  },
  {
    id: 'snda-review',
    title: 'Review SNDA',
    description: 'Subordination + non-disturbance + attornment review.',
    practiceAreas: ['real-estate'],
    prompt:
      "I'll attach the SNDA. convert_to_markdown. Output a structured review: Subordination Scope | Non-Disturbance Conditions | Attornment Triggers | Lender Cure Rights | Lease Modifications Requiring Lender Consent | Obligations of Successor Landlord | Notice + Cure | Departures from Market for [tenant / lender / landlord] perspective.",
  },
  {
    id: 'loan-document-checklist',
    title: 'Real estate loan document checklist',
    description: 'CMBS / construction / mezz closing-doc checklist.',
    practiceAreas: ['real-estate'],
    prompt: `I'll describe the loan (type, structure, parties).

Drafting flow:
1. Ask for the term sheet.
2. create_document titled "Loan Document Checklist — [Deal]".
3. set_outline: Loan Documents | Borrower Organizational | Property | Title + Survey + Insurance | Financial + Reserves | Opinions | Closing Mechanics | Post-Closing.
4. Fill each as a markdown table: Document | Owner | Status | Notes.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'rent-roll-analysis',
    title: 'Rent roll analysis',
    description: 'Tenant + revenue snapshot from a rent roll.',
    practiceAreas: ['real-estate'],
    prompt:
      "I'll attach the rent roll. convert_to_markdown. Output: Total RSF + Occupancy | Tenant Concentration (top 5 by rent + by SF) | Lease Expiration Schedule (next 12/24/60 months + thereafter) | Below/At/Above Market Indicators | Rollover Risk | Co-Tenancy / Anchor Considerations.",
  },
  {
    id: 'permitted-use-review',
    title: 'Permitted use clause review',
    description: 'Use clause + exclusivity + co-tenancy interplay.',
    practiceAreas: ['real-estate'],
    prompt:
      "I'll attach the lease. convert_to_markdown, search_document for 'use', 'exclusive', 'co-tenancy', 'radius'. Output: Permitted Use scope | Restrictions (continuous-operation, hours, signage) | Exclusive Use granted to this tenant + carve-outs | Other Tenants' Exclusives binding this tenant | Co-Tenancy triggers + remedies | Radius Restrictions | Recommended modifications.",
  },
  {
    id: 'cam-reconciliation',
    title: 'CAM reconciliation review',
    description: 'Year-end CAM reconciliation review for a tenant.',
    practiceAreas: ['real-estate'],
    prompt:
      "I'll attach the CAM reconciliation + the lease. convert_to_markdown both. Walk via outline + sections. Output: Lease CAM Definition | Inclusions vs Exclusions | Allowable + Suspect Charges in This Reconciliation | Caps + Gross-Up Methodology | Audit-Rights Position | Recommended Disputes (with dollar amounts) | Required Tenant Notice Letter.",
  },
  {
    id: 'reciprocal-easement-review',
    title: 'Reciprocal easement agreement review',
    description: 'REA / OEA review for a shopping center or campus.',
    practiceAreas: ['real-estate'],
    prompt:
      "I'll attach the REA. convert_to_markdown, get_outline. Output: Parties + Parcels | Common Areas + Maintenance | Parking + Access | Use Restrictions + Exclusives | Construction + Architectural Controls | Default + Self-Help | Term + Amendment | Notice + Cure | Recommended modifications for [my client's role].",
  },
  {
    id: 'ti-allowance-memo',
    title: 'Tenant improvement allowance memo',
    description: 'TI work-letter + allowance mechanics analysis.',
    practiceAreas: ['real-estate'],
    prompt:
      "I'll attach the work letter / lease TI provisions. convert_to_markdown. Output: Allowance Amount + Calculation | Eligible vs Ineligible Costs | Disbursement Mechanics + Lien-Waiver Requirements | Construction Standards + Approvals | Substantial Completion + Punch List | Force Majeure / Tenant Delay / Landlord Delay | Allowance-Forfeiture Triggers | Recommended modifications.",
  },

  // ================================================================
  // TAX
  // ================================================================
  {
    id: 'tax-memo-general',
    title: 'Draft a tax memo',
    description: 'Issue/analysis/conclusion tax memo, exported as DOCX.',
    practiceAreas: ['tax'],
    prompt: `I'll describe the issue and the relevant transaction.

Drafting flow:
1. Ask for the parties, jurisdictions, and any prior memos.
2. create_document titled "Tax Memo — [Issue]".
3. set_outline: Issue | Short Answer | Facts | Authorities | Analysis | Conclusion | Caveats.
4. Fill via write_section. Cite primary authority by section (IRC §, Treas. Reg. §, Rev. Rul., Notice, case + cite).
5. export_to_docx and share the download link.`,
  },
  {
    id: 'section-368-reorg-memo',
    title: 'Section 368 reorganization memo',
    description: 'Tax-free reorg structuring memo.',
    practiceAreas: ['tax', 'mergers-acquisitions'],
    prompt:
      "I'll describe the proposed transaction. Walk through: Reorg Type Candidate (A/B/C/D/F/G + triangular variants) | Statutory Requirements per Type | Continuity of Interest | Continuity of Business Enterprise | Business Purpose | Plan of Reorganization | Boot Tax Impact | Section 354/356/358/362/381/382 Consequences | Step-Transaction + Sound-Reasons Considerations | Recommended Structure.",
  },
  {
    id: 'section-351-contribution-memo',
    title: 'Section 351 contribution memo',
    description: 'Tax-free contribution + control analysis.',
    practiceAreas: ['tax'],
    prompt:
      "I'll describe the contribution (contributors, property, equity received, post-contribution ownership). Walk through: Section 351 elements (transfer, property, control immediately after) | Disguised-sale risks under §707 | Investment-company exception §351(e) | Boot recognition + character | Basis + Holding Period in stock + assets | §357 liability assumption + §357(c) gain. Output: §351 qualification yes/no | Adjustments + alternate structures.",
  },
  {
    id: 'subpart-f-gilti-memo',
    title: 'Subpart F + GILTI inclusion analysis',
    description: 'CFC inclusion memo for a US shareholder.',
    practiceAreas: ['tax'],
    prompt:
      "I'll describe the CFC structure (US shareholders, foreign subs, income types, jurisdictions). Walk through: CFC determination (§957) | US Shareholder definition (§951(b)) | Subpart F categories (§952 — FBCS, FPHCI, etc.) + carve-outs | High-Tax Exclusion (§954(b)(4) + §951A) | GILTI computation (tested income, QBAI, NDTIR) | §250 deduction | §960 indirect FTC + Section 904 baskets | Recommended planning.",
  },
  {
    id: 'transfer-pricing-analysis',
    title: 'Transfer pricing analysis',
    description: 'TP method selection + documentation framework.',
    practiceAreas: ['tax'],
    prompt:
      "I'll describe the related-party transaction (parties, function, asset, risk profile). Walk through: Best-Method Selection (CUP/CUT, Resale Price, Cost Plus, CPM/TNMM, Profit Split) | Comparables Strategy | Functional Analysis | Documentation Required (Treas. Reg. §1.6662-6 + OECD Master/Local/CbCR) | Risk of Adjustment | APA / MAP Considerations.",
  },
  {
    id: 'irs-audit-response',
    title: 'IRS audit response strategy',
    description: 'Exam strategy + IDR response framework.',
    practiceAreas: ['tax'],
    prompt:
      "I'll describe the audit (tax year, exam team, issues, IDRs received). Output: Issue Triage (likelihood + magnitude) | IDR Response Strategy (privilege + scope objections + facts vs analysis split) | Documentation Plan | Settlement Posture (Appeals vs Tax Court) | Statute Considerations | Penalty Defenses | Recommended Sequencing.",
  },
  {
    id: 'section-1031-exchange-memo',
    title: 'Section 1031 like-kind exchange memo',
    description: 'Real-property 1031 structuring + identification rules.',
    practiceAreas: ['tax', 'real-estate'],
    prompt:
      "I'll describe the relinquished property + intended replacement property. Walk through: Like-Kind Requirement (real property only post-TCJA) | Qualified Use (held for investment / business) | 45-Day Identification + 180-Day Closing | QI Requirements + Constructive-Receipt Rules | Three-Property Rule + 200% Rule + 95% Rule | Boot + Gain Recognition | Reverse-Exchange + Build-to-Suit Variants | State Treatment.",
  },
  {
    id: 'reit-compliance-review',
    title: 'REIT compliance review',
    description: 'Annual REIT income + asset + distribution tests.',
    practiceAreas: ['tax', 'real-estate'],
    prompt:
      "I'll describe the REIT (assets, income, structure). Walk through: 75% Asset Test + 5%/10% individual tests | 75% / 95% Income Tests | Distribution Requirement (90% + Section 4981 excise) | Prohibited Transactions Tax | TRS Limits + UBTI Considerations | Recommended Cleanups Before Year-End.",
  },
  {
    id: 'tax-opinion-outline',
    title: 'Draft a tax opinion outline',
    description: 'Should/will/more-likely-than-not opinion, exported as DOCX.',
    practiceAreas: ['tax'],
    prompt: `I'll describe the transaction + the opinion level requested.

Drafting flow:
1. Ask for the assumptions, representations, and any IRS guidance specifically on point.
2. create_document titled "[Tax-Free / [Other Issue]] Opinion — [Transaction]".
3. set_outline: Engagement + Opinion Level | Facts | Assumptions | Representations | Discussion (issue-by-issue) | Conclusion | Reliance + Limitations.
4. Fill via write_section. Cite primary authority. State the level (will / should / more likely than not / reasonable basis).
5. export_to_docx and share the download link.`,
  },
  {
    id: 'state-nexus-analysis',
    title: 'State tax nexus analysis',
    description: 'Income + sales tax nexus per state.',
    practiceAreas: ['tax'],
    prompt:
      "I'll describe the company's footprint (employees, property, sales, marketing, remote workforce). Output a per-state matrix: State | Income Tax Nexus (P.L. 86-272 status, factor presence, economic nexus) | Sales Tax Nexus (Wayfair thresholds, marketplace facilitator) | Other Triggers (gross-receipts, franchise, BAT) | Action Required. Highlight the 5 highest-risk states.",
  },
  {
    id: 'treaty-position-memo',
    title: 'Tax treaty position memo',
    description: 'Treaty article application analysis.',
    practiceAreas: ['tax'],
    prompt:
      "I'll describe the cross-border payment (payor, payee, amount, character). Walk through: Treaty Identification | Article-by-Article Analysis (Business Profits + PE / Dividends / Interest / Royalties / Other Income / LOB) | Beneficial-Owner Requirement | LOB Test Application | MLI Effects | Form W-8BEN-E / 8233 + Withholding Position | Documentation + Filing Requirements.",
  },
  {
    id: 'section-162-deductibility',
    title: 'Section 162 deductibility analysis',
    description: 'Ordinary-and-necessary + capitalization issues.',
    practiceAreas: ['tax'],
    prompt:
      "I'll describe the expense (nature, business purpose, amount). Walk through: §162(a) ordinary + necessary | §162(c)/(f)/(g) disallowance (illegal payments, fines, lobbying) | Capitalization vs deduction (§263(a) + INDOPCO + Reg §1.263(a)-4/-5) | §162(m) executive comp | §274 limitations (meals/entertainment/transportation) | Substantiation. Output: Deductible Y/N | Year | Risk Issues.",
  },

  // ================================================================
  // TRANSACTIONAL
  // ================================================================
  {
    id: 'msa-sow-review',
    title: 'Review MSA + SOW',
    description: 'Master services agreement + statement-of-work review.',
    practiceAreas: ['transactional'],
    prompt:
      "I'll attach the MSA + SOW. convert_to_markdown both. Output a structured review: Scope + Order-of-Precedence | Fees + Payment | IP (background, foreground, deliverables) | Confidentiality + Data | Reps + Warranties + Disclaimers | Indemnities + Liability Cap (and carve-outs) | Term + Termination + Effects | Service Levels (if applicable) | Subcontracting | Insurance | Governing Law + Dispute Resolution | Notable departures from market for [client side]. Cite heading paths.",
  },
  {
    id: 'nda-draft',
    title: 'Draft an NDA',
    description: 'Mutual or one-way NDA, exported as DOCX.',
    practiceAreas: ['transactional'],
    prompt: `I'll describe the deal context (parties, purpose, sensitivity, mutual/one-way).

Drafting flow:
1. Ask for residual-knowledge stance, term, and dispute-resolution preference.
2. create_document titled "Non-Disclosure Agreement — [Counterparty]".
3. set_outline: Parties + Purpose | Definition of Confidential Information | Permitted Use + Permitted Recipients | Exclusions | Term + Survival | Required Disclosures | Return + Destruction | Equitable Relief | Termination | Misc.
4. Fill via write_section.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'software-license-review',
    title: 'Review a software license',
    description: 'On-prem software license review.',
    practiceAreas: ['transactional', 'intellectual-property'],
    prompt:
      "I'll attach the license. convert_to_markdown, get_outline. Output: License Grant (scope, exclusivity, transferability) | Permitted Users + Affiliates | Source Code Access + Escrow | Reverse-Engineering Restrictions | Open-Source Components | Audit Rights | Updates + Support | Maintenance Term | IP Indemnity | Liability Cap + Carve-Outs | Termination + Wind-Down | Notable departures for [my side].",
  },
  {
    id: 'saas-agreement-review',
    title: 'Review a SaaS agreement',
    description: 'Cloud/SaaS subscription agreement review.',
    practiceAreas: ['transactional', 'privacy-data'],
    prompt:
      "I'll attach the SaaS agreement (and DPA if separate). convert_to_markdown. Output: Service Description + Affiliates Use | Subscription Term + Auto-Renewal | Fees + Increases | SLAs + Service Credits | Data Processing + Security (cross-ref to DPA) | IP + Data Ownership | Customer Data Export + Post-Term Retention | Suspension Rights | Indemnities + Liability Caps + AI-Output Indemnity | Termination + Transition Assistance | Notable departures.",
  },
  {
    id: 'supply-agreement-review',
    title: 'Review a supply agreement',
    description: 'Goods supply agreement review.',
    practiceAreas: ['transactional'],
    prompt:
      "I'll attach the supply agreement. convert_to_markdown, get_outline. Output: Purchase Commitment (firm volume vs forecast) | Pricing + Adjustments + MFN | Lead Times + Forecast Process | Quality + Acceptance | Warranties (express + implied) | Recall + Epidemic-Failure | Force Majeure (incl. material shortage, pandemic) | Allocation in Shortage | Insurance | Limitation of Liability | Term + Termination + Wind-Down. Flag departures.",
  },
  {
    id: 'distribution-agreement-review',
    title: 'Review a distribution agreement',
    description: 'Distributor / channel agreement review.',
    practiceAreas: ['transactional'],
    prompt:
      "I'll attach the agreement. convert_to_markdown, get_outline. Output: Territory + Exclusivity | Products Covered | Minimum Purchase / Performance | Pricing + MFN | Trademark Use + Marketing | Resale Restrictions (antitrust check) | Termination + Post-Termination Buy-Back / Inventory | Compensation on Termination (per Council Directive 86/653 if EU agent) | Compliance (FCPA / sanctions / export). Flag antitrust risk.",
  },
  {
    id: 'jv-term-sheet-draft',
    title: 'Draft a JV term sheet',
    description: 'Joint venture term sheet, exported as DOCX.',
    practiceAreas: ['transactional', 'mergers-acquisitions'],
    prompt: `I'll describe the JV (parties, purpose, contributions, structure).

Drafting flow:
1. Ask for the governance preferences and exit appetite.
2. create_document titled "JV Term Sheet — [Project]".
3. set_outline: Parties + Purpose | Structure + Capital | Governance (board composition, reserved matters) | Funding (initial + future) | Distribution Policy | Transfer Restrictions + ROFRs/Tag-Along/Drag-Along | Deadlock | Exit (IPO, sale, buy-sell, Russian roulette, Texas shootout) | Non-Compete + Non-Solicit | Confidentiality + IP | Conditions Precedent | Binding/Non-Binding.
4. Fill via write_section.
5. export_to_docx and share the download link.`,
  },
  {
    id: 'ip-assignment-review',
    title: 'IP assignment review',
    description: 'Stand-alone or embedded IP assignment review.',
    practiceAreas: ['transactional', 'intellectual-property'],
    prompt:
      "I'll attach the assignment. convert_to_markdown. Output: Assigned IP scope (clear chain of title?) | Carve-outs + Background IP | Moral-Rights Waiver | Further-Assurances | Recordation Obligations (USPTO, USCO) | Inventor Compensation considerations (US + foreign) | Reps + Warranties (validity, sole authorship, no encumbrances) | Survival.",
  },
  {
    id: 'force-majeure-review',
    title: 'Force majeure clause review',
    description: 'FM scope + cure + termination review.',
    practiceAreas: ['transactional'],
    prompt:
      "I'll attach the agreement. convert_to_markdown, search_document for 'force majeure', 'impossible', 'impracticable'. Output: Triggering Events (enumerated + catch-all) | Pandemic / Government Action / Supply Chain Coverage | Notice Requirements + Mitigation Duty | Excused Performance Scope (vs payment) | Cure Period | Termination Threshold | Allocation in Partial Performance. Compare to UCC §2-615 and common-law impracticability for any gaps.",
  },
  {
    id: 'nda-redline',
    title: 'Redline an NDA',
    description: 'Mark up an attached NDA from one side\'s perspective using tracked changes.',
    practiceAreas: ['transactional'],
    prompt: `I'll attach an NDA (.docx). Redline it from one side's perspective using tracked changes.

Before redlining, confirm with me:
- Which side I'm representing — Discloser, Recipient, or Mutual (and if mutual, which side has more sensitive information at stake).
- Counterparty type (commercial bidder, prospective investor, employee/consultant, M&A target, vendor, etc.) — affects how aggressive to be.
- Any deal-specific concerns (e.g. residual-knowledge carve-out is non-negotiable; we need a 3-year max term; standstill must come out).

Then:
1. Read the NDA via \`convert_to_markdown\` so you have the full text.
2. Identify clauses that need editing for the side I'm representing. Typical targets, with the party preference in parentheses:
   - Definition of "Confidential Information" — broaden (discloser) or narrow with marking/identification requirements (recipient).
   - Term of the obligation — extend (discloser) or cap at 2–3 years (recipient).
   - Carve-outs / exceptions — broaden (recipient): public domain, prior knowledge, independently developed, lawfully received from a third party, residual knowledge.
   - Use restriction — broaden permitted use (recipient) or tightly scope to the specific purpose (discloser).
   - Return / destruction — exempt computer-system backups and counsel's archival copies (recipient); require certification of destruction (discloser).
   - Remedies — preserve injunctive relief without bond (discloser); limit to actual damages and require posting bond for injunctive relief (recipient).
   - Standstill (if present) — strike entirely or carve out hostile-tender exceptions (recipient); keep tight (discloser).
   - Non-solicit of employees — narrow to senior personnel, time-limit (recipient); broad and 2-year (discloser).
   - Governing law / venue — favorable forum.
   - No-license clause — make explicit (recipient).
3. For each edit, call \`propose_document_edits\` with content-keyed edits. Include 5–15 words of context_before and context_after taken verbatim from the document so the location is unambiguous. For a deletion, set replace to ""; for a pure insertion, set find to "" and use context_before + context_after to anchor the insertion point. Always include a short \`reason\` for each edit so I can decide what to accept.
4. Group all edits into a single \`propose_document_edits\` call when possible — the tool batches them and returns a single tracked-change .docx.
5. Share the \`download_url\` as a clickable markdown link, plus a one-paragraph summary listing the substantive changes (e.g. "Narrowed Confidential Information to marked materials; capped term at 3 years; added residual-knowledge carve-out; struck standstill; required bond for injunctive relief"). Don't restate every individual edit — the tracked changes in the .docx do that.

If the model can't locate a clause via context disambiguation, surface it in the per-edit \`errors\` and either retry with more context or note it in the summary as a clause we couldn't find — don't silently drop it.`,
  },
];

export function promptsByPracticeArea(promptsList: PromptTemplate[], areaId: string | null): PromptTemplate[] {
  if (!areaId) return promptsList;
  return promptsList.filter((p) => p.practiceAreas.includes(areaId));
}
