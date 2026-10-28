# Project SEIskolar: Software Design Document

**Activity 1, From SRS to Software Design, written on 28 October 2026**

| Field                 | Details                                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project / System Name | SEIskolar: a system for DOST-SEI undergraduate scholars to file the per-term Periodic Report, and for everyone to see what is outstanding, released and settled         |
| Group / Team Members  | Team **Asph**: Adrian Seth Tabotabo (Project Manager), Genril Theo Soroño, Althea Maeve Kinaadman, Zedric Camilotes, Dorothy Biatriz Capao                              |
| Course & Section      | Software Design, Cebu Institute of Technology – University (CIT-U). Section: _to fill in_                                                                               |
| Instructor            | _To fill in_                                                                                                                                                            |
| Date                  | 28 October 2026                                                                                                                                                         |
| Built from            | [`01-srs/SRS.md`](../01-srs/SRS.md), document version 2.2, and the ten swimlanes in [`02-swimlanes/`](../02-swimlanes/README.md), whose step numbers (`S03.4`) it cites |

## About this document

**What it is.** The course asked each team to turn its finished Software Requirements
Specification (SRS) into a Software Design Document (SDD): the blueprint from which the
UML models come next. This document follows the course's template, _SRS to Software
Design Template_ (Activity 1), part by part, Part I to Part XIX, in the template's order
and with the template's table columns. The template's yellow SAMPLE rows (a Student
Enrollment System) are left out, as the template says to do before submitting.

**Why it is here.** It plans the design rather than being built from the chain of
drawings, like the risk matrix in [`05-risk-matrix-and-gantt/`](../05-risk-matrix-and-gantt/RISK-MATRIX-AND-GANTT.md),
so it is a `repo` deliverable. It is built from the SRS, and where the swimlanes already
broke a requirement into steps, it cites those steps instead of inventing new ones.

**How to read the IDs.** The template numbers requirements `FR-01`, `NFR-01` and so on.
This document keeps the SRS's own IDs instead (`FR-SCH-001`, `NFR-SEC-001`), so every row
can be checked against the SRS without a lookup table. The SRS has no numbered user
requirements, system requirements or acceptance criteria, so this document numbers them
itself: `UR-01` to `UR-19` are taken from the stakeholder table (SRS §1.3) and the use case
diagram (§4.1); `SR-01` to `SR-16` from the scope, product perspective and constraints
(§1.2, §1.4, §2.1, §2.3, §6.1); and `AC-01` to `AC-07` from the Gherkin scenarios (§7.1).
Each row names the section it comes from.

**There is no code here.** Nothing in this repository is implemented, and nothing will be
(AGENTS.md, "There is no code here"). The SRS was written against an earlier prototype and
names its technologies (Next.js on Vercel, Supabase with PostgreSQL 15). This document
treats those as the SRS's operating environment (§2.1, §2.3), which is a constraint on the
design, and designs components, classes and processes from what each requirement says,
not from how the prototype built it. Database function names such as
`app.my_scholar_id()` appear only where the SRS uses them to state a rule.

**What is assumed.** Anything this document had to fill in that the SRS does not say is
marked **assumed** where it appears, and every assumption and open question is listed in
[Still open](#still-open) at the end. The requirements marked "(designed)" in the SRS
(§3.5 and §3.6: release, tuition, benefits and administration) have no data model in the
SRS; their attribute names here are assumed from the requirement text, and the SRS points
to the archived architecture document for the designed entities.

## Learning objectives this document meets

The template lists ten objectives. Each is met by the part named beside it.

| Objective                                                                   | Where                    |
| --------------------------------------------------------------------------- | ------------------------ |
| Analyze all requirements documented in the SRS                              | Part I                   |
| Transform requirements into system functions and responsibilities           | Part II                  |
| Identify the major components and modules of the system                     | Parts IV and V           |
| Define the responsibilities of each component                               | Part VI                  |
| Identify the system's major data and information                            | Part VII                 |
| Determine how components communicate with one another                       | Part X                   |
| Organize the system using an appropriate software architecture              | Part XI                  |
| Apply software design principles                                            | Part XII                 |
| Identify preliminary classes, interfaces, and services needed by the system | Parts VIII and IX        |
| Establish a complete foundation for subsequent UML modeling                 | Parts XIII, XVI and XVII |

---

## Part I. SRS Requirements Review

Every requirement in the SRS is transferred below: all 24 functional requirements (§3)
and all 9 non-functional requirements (§5). None is left out.

### A. Functional Requirements

| ID         | Functional Requirement                                                                                                                                                               | Actor/User                                 | Input                                                                                                                       | Required Processing                                                                                                                                                                                                                                                                                                                                                                 | Expected Output                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| FR-IAM-001 | The system shall put the user's verified role, region and school into the session token when the user signs in.                                                                      | Every user                                 | Email and password                                                                                                          | Check the credentials; check that a profile exists for the account and is active; if the profile is missing or inactive, leave role, region and school empty, so every list is denied by default.                                                                                                                                                                                   | A signed session token carrying `user_role`, `region_id` and `school_id`                |
| FR-IAM-002 | The system shall pick the school portal's screens from the web address, without ever using the address to grant access to data.                                                      | Every user (through the browser)           | The request's `Host` header, such as `citu.seiskolar.ph`                                                                    | Take the subdomain; refuse reserved words (`www`, `app`, `api`, `admin`, `console`, `auth`, `mail`, `static`); send a valid school subdomain to that school's screens (`/s/[school]`); never use the address to decide which rows a user may read.                                                                                                                                  | The request sent to the right school's screens                                          |
| FR-IAM-003 | The database shall filter every query by the session's role, region and school, so no one sees another school's or region's records.                                                 | Every user (enforced by the database)      | Any query from a screen or an action                                                                                        | A scholar reads only their own scholar records; the Regional Office reads only records whose school it supervises; a query outside the scope returns zero rows, without an error.                                                                                                                                                                                                   | A result set already filtered by the database                                           |
| FR-SCH-001 | The scholar dashboard shall show the active term's checklist, each requirement's state, and the deadline countdown in Philippine time.                                               | Scholar                                    | The scholar's session; the active academic term                                                                             | Count the days left in `Asia/Manila`; pick the banner: `open_outstanding`, `open_cleared`, `closed_outstanding` (with "Nothing is forfeited — file now, and what you are owed is released with a later batch.") or `closed_cleared`; show no banner when the term has no deadline.                                                                                                  | The dashboard with every checklist item's status and the banner                         |
| FR-SCH-002 | The system shall give the scholar a short-lived upload link, scoped to their own folder, so the file goes straight to private storage.                                               | Scholar                                    | `termRequirementId`, `fileName`, `mimeType`, `sizeBytes`                                                                    | Allow only PDF, JPEG, PNG, HEIC and WebP; allow sizes above 0 and up to 10 MB (10,485,760 bytes); build the path `{region}/{school}/{scholar}/{term}/{requirement}/v{n}-{uuid}.{ext}`, whose first three folders must be the scholar's own; make the link last 300 seconds or less.                                                                                                 | `{ signedUrl, storagePath }`                                                            |
| FR-SCH-003 | For the Certified Report of Grades, the scholar shall type each subject's code, units and grade, and see the weighted average as they type.                                          | Scholar                                    | Grade lines: `lineNo`, `subjectCode`, `units`, `grade`                                                                      | Line numbers 1 to 30, no duplicates; subject code 2 to 20 characters; units above 0 and up to 15; grade within the school's scale; weighted average = Σ(units × grade) ÷ Σ units, worked out in the browser and again on the server, and empty (`null`) when the units total 0.                                                                                                     | The weighted average, rounded half away from zero to 4 decimal places                   |
| FR-SCH-004 | After the file is uploaded, the scholar shall commit the filing, which saves a new version that is never changed, with its grade lines.                                              | Scholar                                    | `termRequirementId`, `storagePath`, file details, grade lines if any                                                        | Check that the scholar has an active scholarship agreement at the school that owns the requirement; add the version (versions are never updated or deleted); add the grade lines to that version; set the submission's current version and last-submitted time; move it to `submitted`.                                                                                             | The saved version; the submission moves from `not_started` or `returned` to `submitted` |
| FR-CHK-001 | The DOST console shall show a filterable queue of filings waiting for checking, across the schools the Regional Office supervises.                                                   | DOST Regional Office                       | Filters: school, state, requirement, unchecked only                                                                         | Read only the supervised region's filings; "unchecked" keeps scholars with at least one filing not yet verified; show the days left to the deadline and never hide a filing because the deadline passed (ADR-0011).                                                                                                                                                                 | The queue, oldest filing (`last_submitted_at`) first                                    |
| FR-CHK-002 | A checker shall claim a filing before deciding on it, so two checkers never check the same filing.                                                                                   | DOST Regional Office                       | `submissionId`                                                                                                              | The filing must be `submitted`; claiming moves it to `under_review` and records who claimed it and when; the checker may release the claim without deciding, which moves it back to `submitted` and clears the claimant.                                                                                                                                                            | The filing locked to this checker                                                       |
| FR-CHK-003 | The review screen shall show the uploaded document beside the scholar's typed grade lines and the system's weighted average.                                                         | DOST Regional Office                       | `submissionVersionId`                                                                                                       | Make a download link that lasts 300 seconds or less; show the grade lines with their summary: total units, weighted average and line count.                                                                                                                                                                                                                                         | The document and the grade lines side by side                                           |
| FR-CHK-004 | A checker shall verify the filing, or return it with one of eight standard reasons.                                                                                                  | DOST Regional Office                       | `submissionVersionId`, decision (`verified` or `returned`), reason code, remarks if any                                     | Verified: no reason, and the filing becomes `verified` for good. Returned: a reason is required, one of `illegible`, `wrong_document`, `incomplete`, `wrong_term`, `not_certified`, `details_mismatch`, `superseded`, `other`; `other` needs remarks of at least 10 non-space characters. Save the decision for good, update the filing's state and decision time, clear the claim. | The filing's new state, and an audit line                                               |
| FR-MON-001 | The system shall work out each school's progress for the active term (the burn-down).                                                                                                | DOST Regional Office, School Coordinator   | `school_id`, `term_id`                                                                                                      | Staff only. Count the term's active scholars, those cleared (every mandatory requirement verified), those outstanding, the mandatory cells not yet verified, and the oldest unsubmitted filing's age in days since the term opened.                                                                                                                                                 | The burn-down on the Regional Office console and the coordinator's screens              |
| FR-REL-001 | The Regional Office shall build a release batch of cleared scholars for one or more benefits, record each scholar's amount per benefit, and send it to Central Office.               | DOST Regional Office                       | The benefits, the scholars, each scholar's amount per benefit                                                               | Allow only scholars whose every mandatory requirement for the term is verified; take the amounts as entered and calculate none; record a scholar taken off before sending as `removed_by_regional`; a batch moves `draft` → `sent_to_central`, and `returned_to_regional` → `draft`.                                                                                                | A batch sent to Central Office                                                          |
| FR-REL-002 | Central Office shall approve or return a sent batch, remove one scholar from it with a required reason, and record the release of an approved batch.                                 | DOST Central Office                        | The batch, the decision, the scholar and reason for a removal                                                               | A batch moves `sent_to_central` → `approved` or `returned_to_regional`, and `approved` → `released`; a line moves `included` → `removed_by_central`; record who made each change and when.                                                                                                                                                                                          | The batch's new state, with who and when                                                |
| FR-REL-003 | A scholar shall see, for each release they are in, one status with its date.                                                                                                         | Scholar                                    | The scholar's session                                                                                                       | Show only the scholar's own line; pick one of: documents outstanding, cleared, in the Regional Office's list, sent to Central Office, approved, released, moved to a later batch, removed by Central Office (with its reason); predict no date; say on "released" that SEIskolar cannot see the money reach the account; show only recorded amounts (requested, then released).     | The release status, with its date                                                       |
| FR-TUI-001 | The Regional Office shall record a tuition remittance for one school and term.                                                                                                       | DOST Regional Office                       | Reference (check or LDDAP number), amount, proof document, list of scholars                                                 | Save the remittance as `sent`; keep the proof in private storage; a `disputed` remittance goes back to `sent` after the Regional Office corrects it.                                                                                                                                                                                                                                | A remittance in state `sent`                                                            |
| FR-TUI-002 | The coordinator shall confirm that a remittance matches the school's records, then credit scholars one at a time or all at once, or dispute it with a required reason.               | School Coordinator                         | The remittance; match or not; the reason for a dispute; the scholars to credit                                              | `sent` → `received` or `disputed`; `received` → `disputed`; record each credited scholar's date; `received` → `settled` when every listed scholar is credited.                                                                                                                                                                                                                      | The remittance's new state; each scholar's credited date                                |
| FR-TUI-003 | A scholar on a remittance's list shall see when DOST sent their tuition and when the school credited it.                                                                             | Scholar                                    | The scholar's session                                                                                                       | Show the card only to scholars on the list; show the sent date and the credited date; never show an amount.                                                                                                                                                                                                                                                                         | The tuition card                                                                        |
| FR-BEN-001 | Central Office shall keep the list of benefits and the rules that give benefits to an award year and scholarship type.                                                               | DOST Central Office                        | Benefit: name, ceiling, cadence, basis. Rule: award year, scholarship type, optional Agreement §VI conditions               | Save benefits and rules; a rule may be narrowed by year level or term, studying outside the home region, or programme requirements.                                                                                                                                                                                                                                                 | The benefit list and its rules                                                          |
| FR-BEN-002 | Central Office shall add or remove a benefit for one scholar with a reason; the Regional Office may propose any change, which has no effect until Central Office approves it.        | DOST Central Office, DOST Regional Office  | The change and its reason; or a proposal                                                                                    | A Central Office change takes effect at once and keeps its reason; a proposal is saved as `pending` and becomes `approved` (the change takes effect) or `rejected`.                                                                                                                                                                                                                 | The change; or the proposal's state                                                     |
| FR-BEN-003 | A scholar shall see their benefits' ceilings, each labelled "payable subject to availability of funds (Agreement §VI)".                                                              | Scholar                                    | The scholar's session                                                                                                       | Work out the scholar's benefits from their award year, scholarship type, conditions and per-scholar changes; show each ceiling as recorded, with the label; total nothing.                                                                                                                                                                                                          | The scholar's benefits and ceilings                                                     |
| FR-ADM-001 | The Regional Office shall create schools in its region, coordinator accounts, and scholar accounts from applicant emails; the system administrator creates DOST staff accounts only. | DOST Regional Office, System administrator | School: name, code, subdomain. Coordinator account. Scholar accounts: applicant email and first school. DOST staff accounts | The Regional Office creates only schools in its own region and their accounts; the system administrator creates only Regional Office and Central Office staff accounts and makes no program decision.                                                                                                                                                                               | The school and its accounts                                                             |
| FR-ADM-002 | The Regional Office shall record a school transfer as an agreement amendment of type `transfer_of_school`.                                                                           | DOST Regional Office                       | The scholar, the new school, the date                                                                                       | Save the amendment; change the scholar's current school; leave every earlier filing at the school it was filed at. Which office records a move between regions is open question 26.                                                                                                                                                                                                 | The amendment; the scholar's new current school                                         |
| FR-ADM-003 | The coordinator shall set the school's branding, grading scale and passing grade; Central Office shall set each school's Agreement §VII.A threshold in that school's scale.          | School Coordinator, DOST Central Office    | Logo, primary and secondary colours; lowest and highest grade, which end is better, passing grade; the threshold            | Save the settings; the system may show whether a grade line passes and whether a term's average meets the threshold, and never declares standing, probation or termination.                                                                                                                                                                                                         | The school's portal settings and threshold                                              |

### B. Non-Functional Requirements

| ID          | Non-Functional Requirement                                                                                                                                                                        | Category                 | Design Concern                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-SEC-001 | Every database table enforces row-level security; a table with no matching policy returns zero rows; scope comes only from the session token's claims, never from a lookup of the user's profile. | Security                 | Scope checks belong in the data layer, read from the token, so no screen or action can widen them; no policy may query the profiles table.                      |
| NFR-SEC-002 | Private storage is guarded by the same database rules: uploads must be five folders deep, the first three must be the scholar's own, and no file can ever be overwritten.                         | Security                 | Storage access is decided by the path; the path is built only by the system; overwriting is denied for everyone.                                                |
| NFR-SEC-003 | Every change to compliance records writes an audit line by itself; the line's region comes from the record's school, never from whoever acted; audit lines can never be changed or deleted.       | Security                 | Auditing cannot be left to each action; it is a data-layer rule. Region scoping must follow the record, so national staff's changes stay visible to the region. |
| NFR-PER-001 | The review console shows the document within 1.5 seconds on a normal broadband connection.                                                                                                        | Performance              | Make the download link and open the document without a round trip through the web server.                                                                       |
| NFR-PER-002 | The scholar dashboard and the review queue each load in one round trip, from pre-joined views (`compliance_matrix`, `batch_progress`).                                                            | Performance              | Pre-join compliance data in the data layer instead of joining it in the browser.                                                                                |
| NFR-PER-003 | The weighted average in the grade editor updates within 16 milliseconds of a keystroke, with no network request.                                                                                  | Performance, Usability   | The calculation is a small pure function that runs in the browser.                                                                                              |
| NFR-REL-001 | Every date difference, countdown and cutoff is worked out in `Asia/Manila` (UTC+08:00), in calendar days, never from raw UTC timestamps.                                                          | Reliability              | One shared clock for every date rule, so a midnight Philippine deadline never closes 8 hours early.                                                             |
| NFR-REL-002 | If the scholar loses the connection while confirming an upload, trying again makes a new version with a new name, so a left-over file never damages a saved version.                              | Reliability              | Every upload gets a fresh, unique path; the version is saved only after the file is stored.                                                                     |
| NFR-ACC-001 | The scholar's upload areas and status tables work on phones 360 pixels wide and meet WCAG 2.1 Level AA, including the brand guide's status colours.                                               | Usability, Compatibility | Mobile-first screens; colours checked for contrast; nothing that works only with a mouse.                                                                       |

### C. User Requirements

The SRS has no numbered user requirements. These are taken from what each person may do,
in the stakeholder table (§1.3) and the use case diagram (§4.1), written as user stories.

| ID    | User Requirement                                                                                                                                | User/Actor                           | System Capability Needed                                                                                                              |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| UR-01 | As a scholar, I want to file my registration form and certified grades into the right slot each term, so DOST receives my Periodic Report.      | Scholar                              | Requirement slots, direct upload, grade-line editor, saved versions (FR-SCH-002 to 004)                                               |
| UR-02 | As a scholar, I want to see what I still owe and how many days are left, so I file on time.                                                     | Scholar                              | Checklist with states and a deadline banner in Philippine time (FR-SCH-001)                                                           |
| UR-03 | As a scholar, I want to see where my stipend is in the release process, so I am not left guessing.                                              | Scholar                              | Per-release status with dates, without predictions (FR-REL-003)                                                                       |
| UR-04 | As a scholar, I want to see whether DOST sent my tuition and whether my school credited it, so I am not held at enrolment.                      | Scholar                              | Tuition card (FR-TUI-003)                                                                                                             |
| UR-05 | As a scholar, I want to see which benefits I have and their ceilings.                                                                           | Scholar                              | Benefit list with labelled ceilings (FR-BEN-003)                                                                                      |
| UR-06 | As a scholar, I want my records hidden from everyone who has no right to them, including other scholars.                                        | Scholar                              | Session scope and database row filtering (FR-IAM-001, FR-IAM-003, NFR-SEC-001, NFR-SEC-002)                                           |
| UR-07 | As a coordinator, I want to set my school's branding, grading scale, academic calendar and requirement names, so scholars see their own school. | School Coordinator                   | School portal settings, term calendar, requirement labels (FR-ADM-003; §4.1 "Configure Campus Terms", "Customize Requirement Labels") |
| UR-08 | As a coordinator, I want to check a tuition remittance against our records and credit the scholars on it, or dispute it.                        | School Coordinator                   | Remittance confirmation and crediting (FR-TUI-002)                                                                                    |
| UR-09 | As a coordinator, I want to see how many of our scholars are cleared and outstanding this term.                                                 | School Coordinator                   | Burn-down for one school (FR-MON-001)                                                                                                 |
| UR-10 | As the Regional Office, I want to create schools, coordinator and scholar accounts, and record transfers.                                       | DOST Regional Office                 | Provisioning and transfers (FR-ADM-001, FR-ADM-002)                                                                                   |
| UR-11 | As the Regional Office, I want to set each term's checklist and compliance deadline.                                                            | DOST Regional Office                 | Term checklist and deadline (§1.3; swimlane 02, S02.5 to S02.7)                                                                       |
| UR-12 | As the Regional Office, I want to check filings from one queue, without hunting through folders, and return a bad one with a clear reason.      | DOST Regional Office                 | Queue, claim, side-by-side review, decision with reason codes (FR-CHK-001 to 004)                                                     |
| UR-13 | As the Regional Office, I want to build a list of cleared scholars with their amounts and send it to Central Office.                            | DOST Regional Office                 | Release batches (FR-REL-001)                                                                                                          |
| UR-14 | As the Regional Office, I want to send a school its tuition remittance with proof.                                                              | DOST Regional Office                 | Remittances (FR-TUI-001)                                                                                                              |
| UR-15 | As the Regional Office, I want to propose benefit changes for Central Office to decide.                                                         | DOST Regional Office                 | Benefit proposals (FR-BEN-002)                                                                                                        |
| UR-16 | As Central Office, I want to approve, return or release a batch, and remove one scholar from it with a reason.                                  | DOST Central Office                  | Batch decisions (FR-REL-002)                                                                                                          |
| UR-17 | As Central Office, I want to manage benefits, decide on proposals, and set each school's §VII.A threshold.                                      | DOST Central Office                  | Benefit administration and thresholds (FR-BEN-001, FR-BEN-002, FR-ADM-003)                                                            |
| UR-18 | As the system administrator, I want to maintain reference data and DOST staff accounts, without making program decisions.                       | System administrator                 | Reference data and staff accounts (FR-ADM-001; §4.1 "Maintain Reference Data")                                                        |
| UR-19 | As DOST staff (and, through DOST, the Commission on Audit), I want to see who changed a record, when, and what it was before.                   | DOST Regional Office, Central Office | Audit log scoped by the record's region (NFR-SEC-003; §4.1 "Inspect Immutable Audit Logs")                                            |

### D. System Requirements

The SRS has no numbered system requirements. These are the system-wide rules it states
outside §3 and §5, numbered here.

| ID    | System Requirement                                                                                                                                                       | Related User Requirement | Design Implication                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| SR-01 | Row-level security is on for every table, using the role, region and school put into the session token at sign-in (§2.1).                                                | UR-06                    | A Session Scope that every data request carries; policies in the data layer                           |
| SR-02 | Accepted files are PDF, JPEG, PNG, HEIC and WebP, at most 10 MB each, checked when the file is chosen and again when the upload link is made (§2.3).                     | UR-01                    | The same file rule in the screen and in the Document Storage component                                |
| SR-03 | Files go from the browser straight to private storage through a signed link, never through the web server (§1.4 trade-off 1, §2.3; the host limits a request to 4.5 MB). | UR-01                    | An Upload Ticket service; the web server never handles file bytes                                     |
| SR-04 | Files are kept in a private bucket at `{region}/{school}/{scholar}/{term}/{requirement}/v{n}-{uuid}` and are never overwritten (§2.1).                                   | UR-01, UR-06             | The path is built only by the system and doubles as the access key                                    |
| SR-05 | Submission versions, grade lines, reviews and audit lines are append-only (§1.2, §2.2).                                                                                  | UR-12, UR-19             | Those classes have no update or delete operation; corrections are new records                         |
| SR-06 | Every action checks its input against a schema, and an action's request is limited to 1 MB (§2.1).                                                                       | UR-01                    | Validation rules shared by the screen and the server                                                  |
| SR-07 | Requirements have one national code (such as `registration_form`) and a school's own label (such as "Form 5" or "Study Load / COR") (§1.4 trade-off 3).                  | UR-07                    | Separate Requirement Type and School Requirement Label classes                                        |
| SR-08 | Each school stores its own grade scale: lowest, highest, and whether a higher grade is better (§1.4 trade-off 4).                                                        | UR-07                    | A Grade Scale value on School, used by every grade check                                              |
| SR-09 | Checking is open as soon as a filing arrives, not only after the deadline (§1.4 trade-off 2, ADR-0011).                                                                  | UR-12                    | The queue never filters by the deadline                                                               |
| SR-10 | Dates and deadlines are worked out in `Asia/Manila` (§2.3, NFR-REL-001).                                                                                                 | UR-02                    | One Deadline Clock shared by every date rule                                                          |
| SR-11 | Only invented data is used outside production, never a real scholar's (§2.3, ADR-0006).                                                                                  | UR-06                    | Seed data is synthetic; every example in the design uses invented people                              |
| SR-12 | Screens are light enough for phones on mobile data; the weighted average works without a network (§2.3).                                                                 | UR-01, UR-02             | Server-rendered screens; the calculation in the browser                                               |
| SR-13 | Amounts are shown exactly as DOST recorded them; the system never calculates a total or predicts a release date (§1.2, §6.1 "Won't have").                               | UR-03, UR-05             | Amount fields are entered, not derived; no class has a "total" or "expected date" operation           |
| SR-14 | The system records release and tuition milestones and never moves money or calls a bank (§1.2 out of scope, §6.1).                                                       | UR-03, UR-04             | No bank interface; "released" is a recorded event                                                     |
| SR-15 | Supervision follows the school: a scholar is checked by the region of the school they attend; the region that signed the agreement is kept as a record only (§1.3).      | UR-06, UR-10             | Region is resolved through School, not through the agreement                                          |
| SR-16 | Scholars get deadline reminders 7, 3 and 1 days before the deadline (§6.1 "Should have", design 08).                                                                     | UR-02                    | A reminder job reading the Deadline Clock. **No FR and no swimlane covers this yet; see Still open.** |

### E. External Interface Requirements

| Interface               | Requirement                                                                                                                                                                           | External Entity/System                                                            | Design Consideration                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User Interface          | A web portal per school in the school's colours, and one DOST console; works from 360-pixel phones up, meets WCAG 2.1 AA (§1.2, NFR-ACC-001).                                         | Scholars, coordinators, DOST staff, through a web browser                         | Five role-based front ends (Part XI), one per user class; the web address picks the school's look, never the data (FR-IAM-002). The screens are drawn in `03-` and `04-`. |
| Hardware Interface      | No device is connected to the system. Scholars scan or photograph documents with their own phones; the SRS notes phone scans of grades reach 8 to 12 MB (§1.4 trade-off 1).           | The scholar's phone or scanner (outside the system)                               | The system accepts files only; the 10 MB limit and the accepted types are checked before upload.                                                                          |
| Software Interface      | Sign-in through the authentication service, which calls the system to add role, region and school to the token (§2.2); data in PostgreSQL 15; files in private object storage (§2.1). | Authentication service, PostgreSQL database, object storage (Supabase in the SRS) | Kept behind the Identity & Access, Data Access and Document Storage components, so the business logic does not depend on the vendor.                                      |
| Communication Interface | HTTPS for every request; signed upload and download links that last 300 seconds or less; the school is chosen by subdomain (§2.1, FR-SCH-002, FR-CHK-003).                            | Browsers, the hosting edge (Vercel in the SRS), storage                           | Links are short-lived and scoped; the subdomain is only a layout choice.                                                                                                  |

### F. Constraints and Assumptions

| Constraint/Assumption                                                                                                                           | Effect on Software Design                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Constraint: the SRS's environment is Next.js on Vercel and Supabase (PostgreSQL 15, authentication, storage) (§2.1).                            | Three layers map onto it: screens and actions on the host, rules and data in the database. Vendor details stay inside three components (Part XI).                           |
| Constraint: the host limits a request body to 4.5 MB, and an action to 1 MB (§1.4, §2.1).                                                       | Files never pass through the web server; they go straight to storage (SR-03).                                                                                               |
| Constraint: the Data Privacy Act of 2012 (RA 10173) applies to scholars' records (§1.1, §5.1).                                                  | Deny by default; scope in the database; private storage; an audit log; invented data only (SR-11).                                                                          |
| Constraint: out of scope are bank transfers, scholarship applications, return-service tracking, and the scholars' association's chats (§1.2).   | No bank, application-portal or chat interface. Release and tuition are recorded milestones only.                                                                            |
| Constraint: the system never declares standing, probation or termination, never totals amounts, and never predicts a date (FR-ADM-003, §6.1).   | No operation produces a verdict, a total or an expected date; screens show recorded facts with their dates.                                                                 |
| Constraint: supervision follows the school (§1.3, ADR-0010).                                                                                    | A record's region is worked out through its school, for access and for audit lines.                                                                                         |
| Assumption: scholar accounts start from applicant emails that DOST already holds from the national e-Application portal (FR-ADM-001, §1.2).     | Account provisioning takes emails as input; there is no link to the e-Application portal (**assumed** manual entry). How a scholar first sets a password is not in the SRS. |
| Assumption: parents and guardians never sign in; they are only data on the agreement (§1.3).                                                    | Guardian name is an attribute of Scholarship Agreement, not a user class.                                                                                                   |
| Assumption: the Commission on Audit reads the audit log through DOST, not with its own account (the permission matrix in §2.2 has no COA role). | No auditor role is designed; UR-19 is met by the Regional Office and Central Office roles. **Assumed**; see Still open.                                                     |
| Assumption: nothing is built in this repository (AGENTS.md).                                                                                    | This design is checked against the swimlanes and screens, not against code.                                                                                                 |

### G. Acceptance Criteria

The SRS writes its acceptance criteria as Gherkin scenarios (§7.1). Each scenario is one
criterion here. The designed requirements (FR-REL, FR-TUI, FR-BEN, FR-ADM) have no
acceptance criteria in the SRS yet: its traceability matrix (§7.2) lists them as
"Design test matrix (pending design document)". See Still open.

| ID    | Acceptance Criterion                                                                                                                                                                                                                                                                                                        | Requirement Satisfied                | Design Element Needed                                                 |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------- |
| AC-01 | A scholar at CIT-U in Region VII who reads submissions gets only their own; rows from scholars at other schools come back as zero rows.                                                                                                                                                                                     | FR-IAM-003, NFR-SEC-001              | Session Scope, row filtering in the Compliance Database               |
| AC-02 | A checker of Region VI who looks for a CIT-U (Region VII) filing gets exactly zero rows, and cannot read that filing's storage folder.                                                                                                                                                                                      | FR-IAM-003, NFR-SEC-001, NFR-SEC-002 | Session Scope, supervising-region rule, storage path rule             |
| AC-03 | A scholar who tries to set their own `submitted` filing to `verified` is refused, and the filing stays `submitted`.                                                                                                                                                                                                         | FR-SCH-004, FR-CHK-004               | Submission state machine, enforced in the data layer                  |
| AC-04 | A checker who verifies a claimed filing without a reason code moves it to `verified`; the decision time is stamped, the claim is cleared, and no one can move it out of `verified`.                                                                                                                                         | FR-CHK-002, FR-CHK-004               | Review, Submission state machine (`verified` is final)                |
| AC-05 | A checker who returns a filing with reason `other` and remarks "Too dark" (under 10 characters) is refused, by the screen's check and by the database.                                                                                                                                                                      | FR-CHK-004                           | Review rules, shared by the screen and the data layer                 |
| AC-06 | A scholar who tries to replace an existing file in storage is refused, and the file's bytes do not change.                                                                                                                                                                                                                  | NFR-SEC-002, NFR-REL-002, SR-04      | Storage rule "documents are never overwritten"                        |
| AC-07 | A scholar types 3 grade lines (9 units, average 1.8056) and files v1; a checker returns it as `incomplete`; the scholar sees "Pages or subjects are missing", adds a 4th subject (12 units, 1.6667) and files v2 without replacing v1; the checker verifies v2; the checklist shows "1 of 2 cleared" with uploads disabled. | FR-SCH-001 to 004, FR-CHK-001 to 004 | The whole filing and review flow (processes P03 and P04 in Part XIII) |

---

## Part II. Requirements-to-Function Analysis

Every functional requirement becomes one or more system functions. The functions are
named as the swimlanes name the steps, so a function can be found in its swimlane.

| Requirement | System Function                                    | Purpose                                                                                     | Related Data                                                                                      |
| ----------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| FR-IAM-001  | Sign in and build the session scope                | Give each signed-in user exactly their role, region and school, or nothing                  | User Account (role, region, school, is_active), Session Scope                                     |
| FR-IAM-002  | Resolve the school portal from the address         | Show each school's own portal, without the address ever granting access                     | School (subdomain, branding), request address                                                     |
| FR-IAM-003  | Filter every read by scope                         | Keep scholars, schools and regions apart                                                    | Session Scope; every table's school and region                                                    |
| FR-SCH-001  | Show the term checklist and deadline banner        | Tell the scholar what is outstanding and how long is left                                   | Academic Term, Term Requirement, Submission state, School Requirement Label, Deadline Clock       |
| FR-SCH-002  | Issue an upload ticket                             | Let the file go straight to private storage, into the scholar's own folder only             | Upload Ticket, storage path, file type and size                                                   |
| FR-SCH-003  | Enter grade lines and compute the weighted average | Capture grades in a standard form and work out the average the same way everywhere          | Grade Line, Grade Scale, Weighted Average                                                         |
| FR-SCH-004  | Commit a submission version                        | Save the filing for good and move it to `submitted`                                         | Submission, Submission Version, Grade Line, Scholarship Agreement                                 |
| FR-CHK-001  | List the review queue                              | Give checkers one list of what is waiting, oldest first                                     | Compliance Matrix (Submission, Scholar, School, Term Requirement)                                 |
| FR-CHK-002  | Claim, or release a claim on, a filing             | Stop two checkers from checking the same filing                                             | Submission (state, claimed_by, claimed_at)                                                        |
| FR-CHK-003  | Show the evidence side by side                     | Let the checker compare the document with the typed grades                                  | Submission Version, Grade Line, Grade Summary, download link                                      |
| FR-CHK-004  | Record a review decision                           | Verify a filing, or return it with a standard reason                                        | Review (decision, reason code, remarks), Submission, Audit Entry                                  |
| FR-MON-001  | Compute the school burn-down                       | Show each school's progress for the term                                                    | Batch Progress (scholars total, cleared, outstanding, cells outstanding, oldest unsubmitted days) |
| FR-REL-001  | Build and send a release batch                     | List cleared scholars and their recorded amounts for Central Office                         | Release Batch, Release Line, Release Amount, Benefit, Batch Progress (cleared)                    |
| FR-REL-002  | Decide on a release batch                          | Approve, return, remove a scholar from, or record the release of a batch                    | Release Batch, Release Line (reason), who and when                                                |
| FR-REL-003  | Show the scholar's release status                  | Tell the scholar where their stipend is, without predicting                                 | Release Line, Release Batch, Release Amount, Submission states                                    |
| FR-TUI-001  | Record a tuition remittance                        | Tell the school that DOST sent its tuition, with proof                                      | Tuition Remittance, Remittance Scholar, proof file                                                |
| FR-TUI-002  | Confirm, credit or dispute a remittance            | Let the school accept the money and credit each scholar, or object                          | Tuition Remittance (state, dispute reason), Remittance Scholar (credited date)                    |
| FR-TUI-003  | Show the scholar's tuition card                    | Tell the scholar whether their tuition was sent and credited                                | Remittance Scholar, Tuition Remittance (sent date)                                                |
| FR-BEN-001  | Maintain benefits and benefit rules                | Keep one national list of what each kind of scholar receives                                | Benefit, Benefit Rule                                                                             |
| FR-BEN-002  | Change one scholar's benefits, or propose a change | Let Central Office decide changes, and the Regional Office suggest them                     | Scholar Benefit Change, Benefit Proposal                                                          |
| FR-BEN-003  | Show the scholar's benefits and ceilings           | Tell the scholar what they may receive, as a ceiling, not a promise                         | Benefit, Benefit Rule, Scholar Benefit Change, Scholarship Agreement                              |
| FR-ADM-001  | Provision schools and accounts                     | Create schools and the people who use them, each by the office allowed to                   | School, User Account, Scholar, Scholarship Agreement, Region                                      |
| FR-ADM-002  | Record a school transfer                           | Move a scholar to a new school without rewriting their history                              | Agreement Amendment, Scholar (current school), Submission (school at filing)                      |
| FR-ADM-003  | Set the school portal and threshold                | Let each school look and grade like itself, and let Central Office set its §VII.A threshold | School (branding, grade scale, passing grade, §VII.A threshold)                                   |

The stakeholder table (§1.3) and the use case diagram (§4.1) add five functions that have
no FR of their own. They are kept, because the swimlanes draw them:

| Source                                                         | System Function                             | Purpose                                         | Related Data                                     |
| -------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------- | ------------------------------------------------ |
| §4.1 "Configure Campus Terms" (swimlane 02)                    | Add a term to the school calendar           | Give every term its dates and filing window     | Academic Term                                    |
| §4.1 "Customize Requirement Labels" (swimlane 02)              | Name requirements in the school's own words | Show scholars the names their school uses       | School Requirement Label, Requirement Type       |
| §1.3, Regional Office row (swimlane 02, S02.5 to S02.7)        | Set the term checklist and deadline         | Decide what is mandatory this term, and by when | Term Requirement, Academic Term (submission_due) |
| §4.1 "Inspect Immutable Audit Logs", NFR-SEC-003 (swimlane 10) | Write and read audit lines                  | Show who did what to a record                   | Audit Entry                                      |
| §4.1 "Maintain Reference Data" (swimlane 08)                   | Maintain reference data                     | Keep regions, requirement types and other lists | Region, Requirement Type                         |

---

## Part III. Identify System Actors and External Entities

| Actor/External Entity                | Type (Human/System) | Role                                                                     | Interaction with System                                                                                                                                                                                                    |
| ------------------------------------ | ------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scholar                              | Human               | Primary user: a DOST-SEI undergraduate scholar                           | Signs in to their school's portal; files the Periodic Report; types grades; reads the checklist, deadline, release status, tuition card and benefits. Sees only their own records.                                         |
| School Coordinator                   | Human               | Primary user: a university employee who runs "school stuff"              | Sets branding, grading scale, passing grade, the academic calendar and requirement names; confirms, credits or disputes remittances; follows the school's burn-down.                                                       |
| DOST Regional Office (the checker)   | Human               | Primary user: the supervising regional office's staff                    | Creates schools and accounts; records transfers; sets each term's checklist and deadline; checks filings; builds and sends release batches; sends remittances; proposes benefit changes; reads audit lines for its region. |
| DOST Central Office                  | Human               | Primary user: national staff, several people each with their own account | Approves, returns or releases batches; removes a scholar with a reason; manages benefits and decides proposals; sets each school's §VII.A threshold; reads every region.                                                   |
| System administrator                 | Human               | Secondary user: the system's maintainer                                  | Maintains reference data and DOST staff accounts. Makes no program decision.                                                                                                                                               |
| Commission on Audit (state auditors) | Human               | Secondary stakeholder, no account (**assumed**, see Part I.F)            | Relies on the append-only audit log, the saved versions and the remittance timestamps, read through DOST.                                                                                                                  |
| Parent or legal guardian             | Human               | External party, named on the agreement                                   | None: recorded as data on the scholarship agreement, with no account.                                                                                                                                                      |
| Authentication service               | System              | Checks credentials and issues the session token                          | Receives email and password; asks the system for the account's role, region and school; returns a signed token.                                                                                                            |
| Compliance database (PostgreSQL)     | System              | Stores every record and enforces scope, state and append-only rules      | Receives every read and write with the session token; returns only rows in scope; writes audit lines by itself.                                                                                                            |
| Private document storage             | System              | Keeps uploaded documents and remittance proofs                           | Accepts uploads through signed links into allowed paths only; serves downloads through signed links; refuses overwrites.                                                                                                   |
| Hosting edge (web host)              | System              | Serves the screens and runs the actions                                  | Reads the address to pick the school portal; refreshes the session cookie; grants no data access.                                                                                                                          |
| LandBank and bank transfers          | System              | Outside the boundary (§1.2)                                              | None. Central Office records "released" as a milestone after the money moves outside the system.                                                                                                                           |
| DOST-SEI e-Application portal        | System              | Outside the boundary (§1.2): where scholars apply                        | None directly. The Regional Office creates scholar accounts from the applicants' emails it already holds (**assumed** manual entry).                                                                                       |
| DOST Scholars' Association chats     | System              | Outside the boundary (§1.2): announcements                               | None. Officers use ordinary scholar accounts.                                                                                                                                                                              |

---

## Part IV. Group Related Functions

Related functions from Part II are grouped into modules. Each module owns one kind of
record or one kind of decision, so it has one reason to change.

| System Function                             | Related Functions                                                                                | Proposed Module                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------- |
| Sign in and build the session scope         | Resolve the school portal from the address; filter every read by scope                           | Identity & Access               |
| Add a term to the school calendar           | Name requirements in the school's words; set the term checklist and deadline                     | Term & Requirement Setup        |
| Show the term checklist and deadline banner | Issue an upload ticket; enter grade lines and compute the average; commit a submission version   | Periodic Submission             |
| Issue an upload ticket                      | Issue a download link; store remittance proofs; refuse overwrites                                | Document Storage                |
| Claim a filing                              | List the review queue; show the evidence side by side; record a review decision; release a claim | Review                          |
| Compute the school burn-down                | Decide whether a scholar is cleared; feed the queue's "unchecked" filter                         | Compliance Monitoring           |
| Build and send a release batch              | Decide on a release batch; show the scholar's release status                                     | Release Pipeline                |
| Record a tuition remittance                 | Confirm, credit or dispute; show the tuition card                                                | Tuition Settlement              |
| Maintain benefits and rules                 | Change one scholar's benefits; propose and decide changes; show benefits and ceilings            | Benefit Administration          |
| Provision schools and accounts              | Record a transfer; set the school portal and threshold; maintain reference data                  | School & Account Administration |
| Write an audit line                         | Read a record's history                                                                          | Audit                           |

### Example

| System Function                     | Proposed Module                 |
| ----------------------------------- | ------------------------------- |
| Sign in                             | Identity & Access               |
| Set the term checklist and deadline | Term & Requirement Setup        |
| File a Periodic Report              | Periodic Submission             |
| Upload a document                   | Document Storage                |
| Verify or return a filing           | Review                          |
| See a school's burn-down            | Compliance Monitoring           |
| Send a release batch                | Release Pipeline                |
| Credit a tuition remittance         | Tuition Settlement              |
| Approve a benefit proposal          | Benefit Administration          |
| Record a transfer                   | School & Account Administration |
| See who changed a record            | Audit                           |

---

## Part V. Identify Major System Components

Each component has one focused responsibility. The five front ends are listed first
(presentation), then the eleven modules of Part IV (business logic), then the three data
stores (data). Part XI places them in layers.

| Component/Module                    | Main Responsibility                                                                             | Functions Included                                                                                        | Related Requirements                                                                                             |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| P1 Scholar Portal                   | The scholar's screens, in the school's branding                                                 | Dashboard, requirement page with upload and grade editor, release status, tuition card, benefits          | FR-SCH-001 to 004, FR-REL-003, FR-TUI-003, FR-BEN-003, NFR-ACC-001, UR-01 to UR-06                               |
| P2 Coordinator Workspace            | The coordinator's screens                                                                       | Branding and grading settings, calendar, requirement names, remittances, burn-down                        | FR-ADM-003, FR-TUI-002, FR-MON-001, UR-07 to UR-09                                                               |
| P3 DOST Regional Console            | The Regional Office's screens                                                                   | Queue and review, burn-down, term checklist, batches, remittances, proposals, schools and accounts, audit | FR-CHK-001 to 004, FR-MON-001, FR-REL-001, FR-TUI-001, FR-BEN-002, FR-ADM-001, FR-ADM-002, UR-10 to UR-15, UR-19 |
| P4 DOST Central Office Console      | Central Office's screens                                                                        | Batch decisions, benefits and proposals, thresholds, audit                                                | FR-REL-002, FR-BEN-001, FR-BEN-002, FR-ADM-003, UR-16, UR-17, UR-19                                              |
| P5 Administration Console           | The system administrator's screens                                                              | Reference data, DOST staff accounts                                                                       | FR-ADM-001, UR-18                                                                                                |
| B1 Identity & Access                | Who the user is, and which records they may reach                                               | Sign in, session scope, portal resolution, scope rules                                                    | FR-IAM-001 to 003, NFR-SEC-001, SR-01, SR-15, UR-06                                                              |
| B2 Term & Requirement Setup         | What each term asks for, under which names, by when                                             | Calendar, requirement labels, checklist, deadline                                                         | FR-SCH-001 (deadline), SR-07, UR-07, UR-11                                                                       |
| B3 Periodic Submission              | Filing the Periodic Report                                                                      | Checklist and banner, grade lines and average, commit a version                                           | FR-SCH-001, FR-SCH-003, FR-SCH-004, NFR-PER-003, NFR-REL-001, NFR-REL-002, UR-01, UR-02                          |
| B4 Document Storage                 | Where files live, and who may put or read them                                                  | Upload tickets, download links, path building, overwrite refusal                                          | FR-SCH-002, FR-CHK-003, FR-TUI-001 (proof), NFR-SEC-002, NFR-PER-001, NFR-REL-002, SR-02 to SR-04                |
| B5 Review                           | Deciding on filings                                                                             | Queue, claim and release, evidence view, decision                                                         | FR-CHK-001 to 004, SR-09, UR-12                                                                                  |
| B6 Compliance Monitoring            | Whether scholars and schools are cleared                                                        | Burn-down, cleared check, compliance matrix                                                               | FR-MON-001, NFR-PER-002, UR-09                                                                                   |
| B7 Release Pipeline                 | Release batches, from cleared to released                                                       | Build, send, decide, release, scholar status                                                              | FR-REL-001 to 003, SR-13, SR-14, UR-03, UR-13, UR-16                                                             |
| B8 Tuition Settlement               | Tuition remittances, from sent to settled                                                       | Record, confirm, credit, dispute, correct, tuition card                                                   | FR-TUI-001 to 003, UR-04, UR-08, UR-14                                                                           |
| B9 Benefit Administration           | What each scholar may receive                                                                   | Benefits, rules, per-scholar changes, proposals, ceilings                                                 | FR-BEN-001 to 003, SR-13, UR-05, UR-15, UR-17                                                                    |
| B10 School & Account Administration | Schools, people and their settings                                                              | Provisioning, transfers, portal settings, thresholds, reference data                                      | FR-ADM-001 to 003, SR-08, UR-07, UR-10, UR-17, UR-18                                                             |
| B11 Audit                           | A permanent record of every change                                                              | Write audit lines, read a record's history                                                                | NFR-SEC-003, SR-05, UR-19                                                                                        |
| D1 Compliance Database              | Store every record, and enforce scope, state transitions and append-only rules for every caller | Tables, row-level security, transition rules, pre-joined views                                            | FR-IAM-003, NFR-SEC-001, NFR-PER-002, SR-01, SR-05                                                               |
| D2 Document Store                   | Store document files privately, never overwritten                                               | Private bucket, path-based access                                                                         | NFR-SEC-002, SR-04                                                                                               |
| D3 Audit Log Store                  | Store audit lines, never changed or deleted                                                     | Append-only table, region taken from the record                                                           | NFR-SEC-003                                                                                                      |

---

## Part VI. Define Component Responsibilities

One block per component. Each answers the template's questions: what it does, what it
needs, what it produces, and which components it talks to.

### Component P1: Scholar Portal

| Item              | Description                                                                                                                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose           | Shows the scholar their own compliance and money status, in their school's branding, on any phone.                                                                                                                                     |
| Responsibilities  | Show the dashboard and banner; let the scholar choose a file, type grade lines and see the average live; file a requirement; show release status, the tuition card and benefits. Holds no rule of its own beyond checking input early. |
| Input             | The scholar's actions; data from B3, B7, B8 and B9; the school's branding from B1.                                                                                                                                                     |
| Output            | Requests to B3 and B4; screens.                                                                                                                                                                                                        |
| Data Used         | Academic Term, Term Requirement, School Requirement Label, Submission, Grade Line, Release Line, Remittance Scholar, Benefit (read only, through the modules).                                                                         |
| Communicates With | B1, B3, B4, B7, B8, B9.                                                                                                                                                                                                                |

### Component P2: Coordinator Workspace

| Item              | Description                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| Purpose           | Lets the School Coordinator run the school's side of the program.                                             |
| Responsibilities  | Branding and grading settings; the academic calendar; requirement names; remittances; the school's burn-down. |
| Input             | The coordinator's actions; data from B2, B6, B8 and B10.                                                      |
| Output            | Requests to B2, B8 and B10; screens.                                                                          |
| Data Used         | School, Academic Term, School Requirement Label, Tuition Remittance, Remittance Scholar, Batch Progress.      |
| Communicates With | B1, B2, B6, B8, B10.                                                                                          |

### Component P3: DOST Regional Console

| Item              | Description                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose           | Lets the Regional Office supervise its schools.                                                                                                                           |
| Responsibilities  | Queue, claim and review screens; burn-down; term checklist and deadline; release batches; remittances; benefit proposals; schools, accounts and transfers; audit history. |
| Input             | The Regional Office's actions; data from B2, B5 to B11.                                                                                                                   |
| Output            | Requests to those modules; screens.                                                                                                                                       |
| Data Used         | Everything in the supervised region, read through the modules.                                                                                                            |
| Communicates With | B1, B2, B4, B5, B6, B7, B8, B9, B10, B11.                                                                                                                                 |

### Component P4: DOST Central Office Console

| Item              | Description                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| Purpose           | Lets Central Office make the national decisions.                                                         |
| Responsibilities  | Batch decisions and releases; benefits, rules and proposals; §VII.A thresholds; audit history.           |
| Input             | Central Office's actions; data from B7, B9, B10 and B11.                                                 |
| Output            | Requests to those modules; screens.                                                                      |
| Data Used         | Release Batch, Release Line, Benefit, Benefit Rule, Benefit Proposal, School, Audit Entry (all regions). |
| Communicates With | B1, B7, B9, B10, B11.                                                                                    |

### Component P5: Administration Console

| Item              | Description                                                                  |
| ----------------- | ---------------------------------------------------------------------------- |
| Purpose           | Lets the system administrator maintain the system.                           |
| Responsibilities  | Reference data (such as regions and requirement types); DOST staff accounts. |
| Input             | The administrator's actions.                                                 |
| Output            | Requests to B10; screens.                                                    |
| Data Used         | Region, Requirement Type, User Account (DOST staff).                         |
| Communicates With | B1, B10.                                                                     |

### Component B1: Identity & Access

| Item              | Description                                                                                                                                                                                                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose           | Decides who the user is and which records they may reach.                                                                                                                                                                                                                                           |
| Responsibilities  | At sign-in, look up the account's profile and put role, region and school into the token, or nothing if the profile is missing or inactive; resolve the school portal from the address without granting data; define the scope rules D1 enforces (own scholar, own school, supervised region, all). |
| Input             | Email and password (through the authentication service); the request address; the profile.                                                                                                                                                                                                          |
| Output            | A Session Scope (role, region, school) in a signed token; the school whose layout to show.                                                                                                                                                                                                          |
| Data Used         | User Account, School (subdomain, branding), Region.                                                                                                                                                                                                                                                 |
| Communicates With | Authentication service, D1, every front end (P1 to P5).                                                                                                                                                                                                                                             |

### Component B2: Term & Requirement Setup

| Item              | Description                                                                                                                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose           | Fixes what each term asks for, under the school's own names, and by when.                                                                                                                                               |
| Responsibilities  | Save a term to the school calendar (coordinator); save school labels for national requirement types (coordinator); save the term's checklist, which items are mandatory, and the compliance deadline (Regional Office). |
| Input             | Term name, type, dates, filing opening date; labels and instructions; chosen requirements, mandatory flags, deadline.                                                                                                   |
| Output            | Academic Term, School Requirement Label and Term Requirement records.                                                                                                                                                   |
| Data Used         | Academic Term, Requirement Type, School Requirement Label, Term Requirement.                                                                                                                                            |
| Communicates With | P2, P3, B3 (which reads the checklist), D1.                                                                                                                                                                             |

### Component B3: Periodic Submission

| Item              | Description                                                                                                                                                                                                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose           | Takes a scholar's filing from "not started" or "returned" to "submitted".                                                                                                                                                                                                                       |
| Responsibilities  | Work out the banner state with the Deadline Clock; check grade lines against the school's Grade Scale; compute the weighted average (in the browser and again on the server, the same way); check the scholar has an active agreement at the school; commit a new version with its grade lines. |
| Input             | Term requirement, storage path and file details from B4, grade lines.                                                                                                                                                                                                                           |
| Output            | A new Submission Version and its Grade Lines; the Submission in `submitted`; the dashboard data.                                                                                                                                                                                                |
| Data Used         | Academic Term, Term Requirement, Submission, Submission Version, Grade Line, School (grade scale), Scholarship Agreement.                                                                                                                                                                       |
| Communicates With | P1, B4 (ticket first, then the path), B6 (cleared state), D1.                                                                                                                                                                                                                                   |

### Component B4: Document Storage

| Item              | Description                                                                                                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose           | Keeps document files private, in the right folder, never overwritten.                                                                                                                           |
| Responsibilities  | Check file type and size; build the five-folder path with the next version number and a new unique name; issue an upload link (≤ 300 s) and a download link (≤ 300 s); store remittance proofs. |
| Input             | Requirement, file name, type and size, the Session Scope; or a version to view.                                                                                                                 |
| Output            | Upload Ticket (`signedUrl`, `storagePath`); download link.                                                                                                                                      |
| Data Used         | Upload Ticket, Submission Version (storage path), Tuition Remittance (proof path).                                                                                                              |
| Communicates With | P1, P3 (review), B3, B5, B8, D2.                                                                                                                                                                |

### Component B5: Review

| Item              | Description                                                                                                                                                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose           | Lets the Regional Office decide on filings without two checkers colliding.                                                                                                                                                                     |
| Responsibilities  | List the queue (filters, oldest first, days left, nothing hidden after the deadline); claim and release claims; show evidence beside the grade lines and summary; record verify or return with one of eight reasons, with remarks for `other`. |
| Input             | Queue filters; the submission to claim; the decision, reason code and remarks.                                                                                                                                                                 |
| Output            | Claimed filing; a Review; the filing in `verified` or `returned`.                                                                                                                                                                              |
| Data Used         | Submission, Submission Version, Grade Line, Grade Summary, Review, Compliance Matrix.                                                                                                                                                          |
| Communicates With | P3, B4 (download link), B6, D1 (which writes the audit line through B11).                                                                                                                                                                      |

### Component B6: Compliance Monitoring

| Item              | Description                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose           | Says who is cleared and how far each school has come.                                                                                   |
| Responsibilities  | Decide whether a scholar is cleared for a term (every mandatory requirement `verified`); compute the burn-down figures, for staff only. |
| Input             | School and term.                                                                                                                        |
| Output            | Batch Progress: scholars total, cleared, outstanding, cells outstanding, oldest unsubmitted days; each scholar's cleared state.         |
| Data Used         | Submission, Term Requirement, Scholar, Academic Term (pre-joined in the Compliance Matrix and Batch Progress views).                    |
| Communicates With | P2, P3, B3, B5, B7 (which offers only cleared scholars), D1.                                                                            |

### Component B7: Release Pipeline

| Item              | Description                                                                                                                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose           | Carries a release batch from the Regional Office's list to "released", and shows each scholar their own status.                                                                                                                                                           |
| Responsibilities  | Build a draft batch from cleared scholars only; record amounts per scholar per benefit as entered; send; let Central Office approve, return, remove a scholar with a reason, and record the release; record who and when for every change; work out the scholar's status. |
| Input             | Benefits, scholars, amounts; decisions and reasons.                                                                                                                                                                                                                       |
| Output            | Release Batch and Release Line states; the scholar's release status with its date.                                                                                                                                                                                        |
| Data Used         | Release Batch, Release Line, Release Amount, Benefit, cleared state from B6.                                                                                                                                                                                              |
| Communicates With | P1, P3, P4, B6, B9, D1.                                                                                                                                                                                                                                                   |

### Component B8: Tuition Settlement

| Item              | Description                                                                                                                                                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Purpose           | Carries a tuition remittance from "sent" to "settled", and shows each listed scholar their card.                                                                                                                                                                               |
| Responsibilities  | Record a remittance with its reference, amount, proof and list; let the coordinator confirm, credit one or all, or dispute with a reason; let the Regional Office correct a disputed one; settle it when everyone is credited; show the scholar their dates, never the amount. |
| Input             | Remittance details and proof; confirm, credit or dispute; corrections.                                                                                                                                                                                                         |
| Output            | Tuition Remittance states; credited dates; the tuition card.                                                                                                                                                                                                                   |
| Data Used         | Tuition Remittance, Remittance Scholar, School, Academic Term.                                                                                                                                                                                                                 |
| Communicates With | P1, P2, P3, B4 (proof), D1.                                                                                                                                                                                                                                                    |

### Component B9: Benefit Administration

| Item              | Description                                                                                                                                                                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose           | Keeps what each scholar may receive, as Central Office decides it.                                                                                                                                                                                                                      |
| Responsibilities  | Keep benefits and rules; record per-scholar changes with reasons; hold Regional Office proposals as `pending` until Central Office approves or rejects them; work out a scholar's benefits and show ceilings with the label "payable subject to availability of funds (Agreement §VI)". |
| Input             | Benefit and rule details; changes with reasons; proposals and decisions.                                                                                                                                                                                                                |
| Output            | Benefits, rules, changes, proposal states; a scholar's benefit list.                                                                                                                                                                                                                    |
| Data Used         | Benefit, Benefit Rule, Scholar Benefit Change, Benefit Proposal, Scholarship Agreement (type, award year).                                                                                                                                                                              |
| Communicates With | P1, P3, P4, B7 (which benefits a batch is for), D1.                                                                                                                                                                                                                                     |

### Component B10: School & Account Administration

| Item              | Description                                                                                                                                                                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Purpose           | Keeps schools, their people and their settings.                                                                                                                                                                                                                                                                          |
| Responsibilities  | The Regional Office creates schools in its region, coordinator accounts and scholar accounts with a first school, and records transfers; the administrator creates DOST staff accounts and keeps reference data; the coordinator sets branding, grade scale and passing grade; Central Office sets the §VII.A threshold. |
| Input             | School name, code, subdomain; account details and emails; transfer details; settings.                                                                                                                                                                                                                                    |
| Output            | Schools, User Accounts, Scholars, Scholarship Agreements, Agreement Amendments, school settings.                                                                                                                                                                                                                         |
| Data Used         | Region, School, User Account, Scholar, Scholarship Agreement, Agreement Amendment, Requirement Type.                                                                                                                                                                                                                     |
| Communicates With | P2, P3, P4, P5, B1 (accounts and branding feed the session and portal), D1.                                                                                                                                                                                                                                              |

### Component B11: Audit

| Item              | Description                                                                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Purpose           | Keeps a permanent record of every change, readable by the right offices.                                                                                                                                                 |
| Responsibilities  | Write an audit line for every insert, update and delete on compliance records, by itself; take the line's region from the record's school; let the Regional Office read its region's lines and Central Office all lines. |
| Input             | Every change in D1 (who, what, before, after); a record to look up.                                                                                                                                                      |
| Output            | Audit Entries; a record's history, oldest first.                                                                                                                                                                         |
| Data Used         | Audit Entry.                                                                                                                                                                                                             |
| Communicates With | D1 (triggered by it), D3, P3, P4.                                                                                                                                                                                        |

### Component D1: Compliance Database

| Item              | Description                                                                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose           | Stores every record and holds the rules that must hold for every caller.                                                                                                                                            |
| Responsibilities  | Row-level security on every table from the token's claims; allowed state transitions only (`verified` is final); append-only tables; pre-joined Compliance Matrix and Batch Progress views; trigger the audit line. |
| Input             | Reads and writes from the business modules, with the session token.                                                                                                                                                 |
| Output            | Rows in scope; refusals; audit lines.                                                                                                                                                                               |
| Data Used         | Every entity in Part VII.                                                                                                                                                                                           |
| Communicates With | B1 to B11, D3.                                                                                                                                                                                                      |

### Component D2: Document Store

| Item              | Description                                                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Purpose           | Keeps document files and proofs in a private bucket.                                                                               |
| Responsibilities  | Accept uploads only five folders deep in the uploader's own prefix; refuse every overwrite; serve files through signed links only. |
| Input             | Signed uploads and downloads.                                                                                                      |
| Output            | Stored files; file bytes for a valid download link.                                                                                |
| Data Used         | Files, by path.                                                                                                                    |
| Communicates With | B4, browsers (through signed links).                                                                                               |

### Component D3: Audit Log Store

| Item              | Description                                       |
| ----------------- | ------------------------------------------------- |
| Purpose           | Keeps audit lines for good.                       |
| Responsibilities  | Accept new lines; refuse every update and delete. |
| Input             | Audit lines from D1.                              |
| Output            | Audit lines, filtered by the reader's scope.      |
| Data Used         | Audit Entry.                                      |
| Communicates With | D1, B11.                                          |

---

## Part VII. Identify System Data

✓ means the system does that to the record. **No record is ever hard-deleted**: the SRS
makes versions, grade lines, reviews and audit lines append-only (§2.2, NFR-SEC-003), and
everything else is ended by a state or an `is_active` flag (`removed_by_regional`,
`archived`), so the Delete column says how each record is retired instead. Entities
marked _(designed)_ have no data model in the SRS; their contents come from the FR text.

| Data/Entity                         | Description                                                                                                            | Used By                 | Create | Read | Update | Delete                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------ | ---- | ------ | ------------------------------------------------------------ |
| Region                              | A DOST regional office's area: code, name, office, administering body                                                  | B1, B10, B11            | ✓      | ✓    | ✓      | — (`is_active`, effective dates)                             |
| School                              | A university: region, code, name, subdomain, grade scale, passing grade, branding, §VII.A threshold                    | B1, B2, B3, B10         | ✓      | ✓    | ✓      | — (`is_active`)                                              |
| User Account (profile)              | A person who signs in: full name, contact number, role, region, school                                                 | B1, B10                 | ✓      | ✓    | ✓      | — (`is_active`)                                              |
| Scholar                             | A DOST-SEI scholar: scholar number, name, current school, programme, year level, award year, status                    | B3, B6, B7, B8, B9, B10 | ✓      | ✓    | ✓      | — (status `archived`)                                        |
| Scholarship Agreement               | The signed agreement: scholarship type, signatory region, school, programme, academic year, allowance months, guardian | B3, B9, B10             | ✓      | ✓    | ✓      | — (`is_active`)                                              |
| Agreement Amendment                 | A change to an agreement, such as `transfer_of_school`, with its date                                                  | B10                     | ✓      | ✓    | —      | —                                                            |
| Academic Term                       | A school's term: label, academic year, type, dates, filing opens, compliance deadline                                  | B2, B3, B6              | ✓      | ✓    | ✓      | — (`is_active`)                                              |
| Requirement Type                    | A national requirement: code, canonical name, needs grade lines, accepted types, size limit                            | B2, B3, B10             | ✓      | ✓    | ✓      | — (`is_active`)                                              |
| School Requirement Label            | A school's name and instructions for a requirement type                                                                | B2, B3                  | ✓      | ✓    | ✓      | —                                                            |
| Term Requirement                    | One checklist item for a term: requirement type, mandatory or not, its own due date                                    | B2, B3, B6              | ✓      | ✓    | ✓      | — (**assumed**: removed before filing opens; see Still open) |
| Submission                          | A scholar's filing for one checklist item: state, current version, claimant, dates                                     | B3, B5, B6              | ✓      | ✓    | ✓      | —                                                            |
| Submission Version                  | One uploaded file of a filing: number, storage path, name, type, size, checksum, uploader, time                        | B3, B4, B5              | ✓      | ✓    | —      | — (append-only)                                              |
| Grade Line                          | One typed subject on a version: line number, subject code, units, grade                                                | B3, B5                  | ✓      | ✓    | —      | — (append-only)                                              |
| Review                              | A checker's decision on a version: decision, reason code, remarks, reviewer, time                                      | B5, B3                  | ✓      | ✓    | —      | — (append-only)                                              |
| Audit Entry                         | Who changed what, when, with the record before and after, and the record's region and school                           | B11                     | ✓      | ✓    | —      | — (append-only)                                              |
| Release Batch _(designed)_          | The Regional Office's list for one or more benefits: state, dates, who sent, approved, returned, released              | B7                      | ✓      | ✓    | ✓      | —                                                            |
| Release Line _(designed)_           | One scholar on a batch: state, removal reason, who and when                                                            | B7                      | ✓      | ✓    | ✓      | — (`removed_by_regional`, `removed_by_central`)              |
| Release Amount _(designed)_         | One scholar's amount for one benefit on a line: requested, then released                                               | B7                      | ✓      | ✓    | ✓      | —                                                            |
| Tuition Remittance _(designed)_     | Money DOST sent a school for a term: reference, amount, proof, state, dispute reason                                   | B8                      | ✓      | ✓    | ✓      | —                                                            |
| Remittance Scholar _(designed)_     | One scholar on a remittance's list, with the date the school credited them                                             | B8                      | ✓      | ✓    | ✓      | —                                                            |
| Benefit _(designed)_                | A benefit: name, ceiling, cadence, basis                                                                               | B9, B7                  | ✓      | ✓    | ✓      | — (**assumed** `is_active`)                                  |
| Benefit Rule _(designed)_           | Gives benefits to an award year and scholarship type, maybe narrowed by Agreement §VI conditions                       | B9                      | ✓      | ✓    | ✓      | — (**assumed** `is_active`)                                  |
| Scholar Benefit Change _(designed)_ | One scholar's added or removed benefit, with the reason and who made it                                                | B9                      | ✓      | ✓    | —      | —                                                            |
| Benefit Proposal _(designed)_       | The Regional Office's proposed change, waiting for Central Office: state, reason                                       | B9                      | ✓      | ✓    | ✓      | —                                                            |
| Uploaded file                       | The document or proof itself, in private storage                                                                       | B4                      | ✓      | ✓    | —      | — (never overwritten)                                        |

---

## Part VIII. Identify Preliminary Classes

| Proposed Class            | Why Is It Needed?                                                                    | Related Requirement                 | Related Component |
| ------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------- | ----------------- |
| SessionScope              | Carries role, region and school with every request; the only source of access rights | FR-IAM-001, FR-IAM-003, NFR-SEC-001 | B1                |
| UserAccount               | A person who signs in, with one role                                                 | FR-IAM-001, FR-ADM-001              | B1, B10           |
| Region                    | The supervising office's area; the access boundary                                   | FR-IAM-003, SR-15                   | B10               |
| School                    | The tenant: portal, grade scale, threshold, region                                   | FR-IAM-002, FR-ADM-001, FR-ADM-003  | B10               |
| GradeScale                | The school's lowest, highest and better end, and passing grade; checks a grade       | FR-SCH-003, FR-ADM-003, SR-08       | B3, B10           |
| Scholar                   | The person whose compliance is tracked                                               | FR-SCH-001, FR-ADM-001              | B10               |
| ScholarshipAgreement      | Ties a scholar to a school and scholarship type; needed to allow filing and benefits | FR-SCH-004, FR-BEN-003              | B10               |
| AgreementAmendment        | Records a transfer without rewriting history                                         | FR-ADM-002                          | B10               |
| AcademicTerm              | A term's dates and compliance deadline                                               | FR-SCH-001, UR-07, UR-11            | B2                |
| RequirementType           | A national requirement code                                                          | FR-SCH-002, SR-07                   | B2                |
| SchoolRequirementLabel    | A school's name for a requirement                                                    | SR-07, UR-07                        | B2                |
| TermRequirement           | One checklist item for a term                                                        | FR-SCH-001, UR-11                   | B2                |
| DeadlineClock             | Works out days left and the banner state in Asia/Manila                              | FR-SCH-001, NFR-REL-001             | B3                |
| Submission                | A filing and its state machine                                                       | FR-SCH-004, FR-CHK-002, FR-CHK-004  | B3, B5            |
| SubmissionVersion         | One immutable upload                                                                 | FR-SCH-004, NFR-REL-002             | B3                |
| GradeLine                 | One typed subject                                                                    | FR-SCH-003                          | B3                |
| WeightedAverageCalculator | Computes the weighted average the same way in the browser and on the server          | FR-SCH-003, NFR-PER-003             | B3                |
| UploadTicket              | A short-lived upload link with its path                                              | FR-SCH-002, NFR-SEC-002             | B4                |
| Review                    | A checker's decision and reason                                                      | FR-CHK-004                          | B5                |
| ReviewQueue               | The filtered, ordered list of filings to check                                       | FR-CHK-001                          | B5                |
| BatchProgress             | A school's burn-down figures                                                         | FR-MON-001                          | B6                |
| AuditEntry                | One permanent line of who did what                                                   | NFR-SEC-003                         | B11               |
| ReleaseBatch              | A list of cleared scholars sent for release                                          | FR-REL-001, FR-REL-002              | B7                |
| ReleaseLine               | One scholar on a batch, and what the scholar sees                                    | FR-REL-001 to 003                   | B7                |
| ReleaseAmount             | A recorded amount per scholar per benefit                                            | FR-REL-001, FR-REL-003              | B7                |
| TuitionRemittance         | Money sent to a school, with proof                                                   | FR-TUI-001, FR-TUI-002              | B8                |
| RemittanceScholar         | One scholar's credit on a remittance                                                 | FR-TUI-002, FR-TUI-003              | B8                |
| Benefit                   | A benefit and its ceiling                                                            | FR-BEN-001, FR-BEN-003              | B9                |
| BenefitRule               | Who gets which benefits                                                              | FR-BEN-001                          | B9                |
| ScholarBenefitChange      | One scholar's added or removed benefit                                               | FR-BEN-002                          | B9                |
| BenefitProposal           | A Regional Office proposal awaiting Central Office                                   | FR-BEN-002                          | B9                |

---

## Part IX. Preliminary Class Information

Possible attributes and operations only; the UML class diagram comes later. Attribute
names for the compliance classes are the SRS's (§4.3). Attribute names for the
_(designed)_ classes are **assumed** from the requirement text, because the SRS has no
data model for them.

### Class 1: SessionScope

**Purpose:** The role, region and school the signed-in user acts with. Every rule about
who may see what reads this and nothing else (NFR-SEC-001).

| Attribute | Description                                                                 |
| --------- | --------------------------------------------------------------------------- |
| userId    | The signed-in account                                                       |
| role      | `scholar`, `coordinator`, `checker`, `central_office` or `admin`            |
| regionId  | The region the user acts in; empty for a scholar or the administrator       |
| schoolId  | The school the user acts in; empty for the Regional Office or administrator |

| Operation            | Purpose                                                                   |
| -------------------- | ------------------------------------------------------------------------- |
| fromProfile(profile) | Build the scope at sign-in; empty when the profile is missing or inactive |
| canRead(record)      | Whether a record is within this scope                                     |
| isStaff()            | Whether the role is coordinator, checker, central_office or admin         |

**Related Classes:** UserAccount, School, Region.

### Class 2: UserAccount

**Purpose:** A person who signs in, with exactly one role.

| Attribute | Description                         |
| --------- | ----------------------------------- |
| id        | The account                         |
| fullName  | The person's name                   |
| contactNo | Their contact number                |
| role      | One of the five roles               |
| regionId  | Their region, if the role has one   |
| schoolId  | Their school, if the role has one   |
| isActive  | Whether they may sign in with scope |

| Operation       | Purpose                                                                     |
| --------------- | --------------------------------------------------------------------------- |
| create()        | Made by the Regional Office (coordinator, scholar) or administrator (staff) |
| updateContact() | The user changes their own contact details; role and scope never change     |
| deactivate()    | Stop the account from getting a scope                                       |

**Related Classes:** SessionScope, School, Region, Scholar.

### Class 3: Region

**Purpose:** A DOST regional office's area; the access boundary for checking and audit.

| Attribute         | Description                                     |
| ----------------- | ----------------------------------------------- |
| id, code, name    | Identity, such as `VII`                         |
| officeName        | The regional office                             |
| administeringBody | `dost_regional_office` or `autonomous_ministry` |
| isActive          | Whether it is in use                            |

| Operation | Purpose                          |
| --------- | -------------------------------- |
| create()  | Kept by the system administrator |
| schools() | The schools it supervises        |

**Related Classes:** School, UserAccount, AuditEntry.

### Class 4: School

**Purpose:** A university and its portal. Supervision follows the school (SR-15).

| Attribute                            | Description                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| id, code, name                       | Identity, such as `CITU`                                                              |
| regionId                             | Its supervising region                                                                |
| subdomain                            | Its portal address, such as `citu`                                                    |
| gradeScale                           | A GradeScale                                                                          |
| logo, primaryColour, secondaryColour | Its branding                                                                          |
| viiAThreshold                        | Central Office's Agreement §VII.A threshold, in the school's scale (**assumed** name) |
| isActive                             | Whether it is in use                                                                  |

| Operation               | Purpose                                                     |
| ----------------------- | ----------------------------------------------------------- |
| create()                | The Regional Office creates it in its region                |
| setBranding()           | The coordinator sets logo and colours                       |
| setGradeScale()         | The coordinator sets the scale and passing grade            |
| setThreshold()          | Central Office sets the §VII.A threshold                    |
| meetsThreshold(average) | Whether a term average meets the threshold; never a verdict |

**Related Classes:** Region, GradeScale, AcademicTerm, Scholar, SchoolRequirementLabel.

### Class 5: GradeScale

**Purpose:** How a school grades, so grades are checked and compared in its own terms
(§1.4 trade-off 4).

| Attribute      | Description                                         |
| -------------- | --------------------------------------------------- |
| min, max       | The lowest and highest grade, such as 1.00 and 5.00 |
| higherIsBetter | `true` at CIT-U, `false` at UP                      |
| passingGrade   | The passing grade                                   |

| Operation      | Purpose                               |
| -------------- | ------------------------------------- |
| isValid(grade) | Whether a grade is within min and max |
| passes(grade)  | Whether a grade line passes           |

**Related Classes:** School, GradeLine.

### Class 6: Scholar

**Purpose:** The person whose compliance, releases, tuition and benefits are tracked.

| Attribute                       | Description                                                   |
| ------------------------------- | ------------------------------------------------------------- |
| id                              | The scholar                                                   |
| profileId                       | Their account, empty until they claim it                      |
| dostScholarNo                   | Their scholar number (always invented in this design)         |
| fullName                        | Their name                                                    |
| schoolId                        | Their current school                                          |
| programme, yearLevel, awardYear | Their programme, year level and award year                    |
| status                          | `active`, `on_leave`, `graduated`, `terminated` or `archived` |

| Operation          | Purpose                                                |
| ------------------ | ------------------------------------------------------ |
| create()           | The Regional Office creates it from an applicant email |
| transferTo(school) | Change the current school through an amendment         |
| isCleared(term)    | Whether every mandatory requirement is verified        |

**Related Classes:** UserAccount, School, ScholarshipAgreement, Submission, ReleaseLine, RemittanceScholar.

### Class 7: ScholarshipAgreement

**Purpose:** The agreement that makes someone a scholar at a school; filing requires an
active one (FR-SCH-004).

| Attribute                               | Description                                       |
| --------------------------------------- | ------------------------------------------------- |
| scholarId, schoolId                     | Who, and at which school                          |
| signatoryRegionId                       | The region that signed it; a record, never access |
| scholarshipType                         | `ra7687`, `merit`, `ra10612` or `jlss`            |
| programme, effectiveAy, allowanceMonths | Its terms                                         |
| guardianName                            | The parent or guardian (data only)                |
| isActive                                | Whether it is in force                            |

| Operation          | Purpose                            |
| ------------------ | ---------------------------------- |
| amend(type)        | Add an AgreementAmendment          |
| isActiveAt(school) | Whether the scholar may file there |

**Related Classes:** Scholar, AgreementAmendment, BenefitRule.

### Class 8: AgreementAmendment

**Purpose:** A dated change to an agreement; a transfer is one (FR-ADM-002).

| Attribute   | Description                                       |
| ----------- | ------------------------------------------------- |
| agreementId | The agreement                                     |
| type        | Such as `transfer_of_school`                      |
| newSchoolId | The new school, for a transfer (**assumed** name) |
| effectiveOn | Its date                                          |
| recordedBy  | Who recorded it                                   |

| Operation | Purpose                               |
| --------- | ------------------------------------- |
| record()  | Save it and change the current school |

**Related Classes:** ScholarshipAgreement, Scholar, School.

### Class 9: AcademicTerm

**Purpose:** A school's term, its filing window and its compliance deadline.

| Attribute                     | Description                                     |
| ----------------------------- | ----------------------------------------------- |
| schoolId                      | The school                                      |
| label, academicYear, termType | Such as "1st Semester AY 2025-2026", `semester` |
| startsOn, endsOn              | The term's dates                                |
| submissionOpens               | When filing opens                               |
| submissionDue                 | The compliance deadline; may be empty           |
| isActive                      | Whether it is the active term                   |

| Operation     | Purpose                     |
| ------------- | --------------------------- |
| create()      | The coordinator adds it     |
| setDeadline() | The Regional Office sets it |
| checklist()   | Its TermRequirements        |

**Related Classes:** School, TermRequirement, DeadlineClock.

### Class 10: RequirementType and SchoolRequirementLabel

**Purpose:** One national code per requirement, and each school's own name for it
(§1.4 trade-off 3).

| Attribute                         | Description                                     |
| --------------------------------- | ----------------------------------------------- |
| code                              | Such as `registration_form`, `certified_grades` |
| canonicalName                     | DOST's name                                     |
| requiresGradeLines                | `true` for the Certified Report of Grades       |
| acceptedMime, maxSizeMb           | Accepted file types; 10 MB by default           |
| label, instructions (label class) | The school's name and instructions              |

| Operation           | Purpose                                   |
| ------------------- | ----------------------------------------- |
| displayName(school) | The school's label, or the canonical name |

**Related Classes:** TermRequirement, School.

### Class 11: TermRequirement

**Purpose:** One item on a term's checklist.

| Attribute         | Description                    |
| ----------------- | ------------------------------ |
| termId            | The term                       |
| requirementTypeId | The requirement                |
| isMandatory       | Whether it counts for clearing |
| dueAt             | Its own due date, if any       |

| Operation | Purpose                                      |
| --------- | -------------------------------------------- |
| create()  | The Regional Office adds it to the checklist |

**Related Classes:** AcademicTerm, RequirementType, Submission.

### Class 12: DeadlineClock

**Purpose:** The one place every date rule is worked out, in `Asia/Manila` calendar days
(NFR-REL-001).

| Attribute | Description          |
| --------- | -------------------- |
| timeZone  | Always `Asia/Manila` |

| Operation                              | Purpose                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| today()                                | Today's date in Manila                                                                                  |
| daysRemaining(due)                     | `due − today()`, in calendar days                                                                       |
| bannerState(due, allMandatoryVerified) | `open_outstanding`, `open_cleared`, `closed_outstanding`, `closed_cleared`, or none when `due` is empty |

**Related Classes:** AcademicTerm, Submission.

### Class 13: Submission

**Purpose:** A scholar's filing for one checklist item, and its state machine (§4.2).

| Attribute                                    | Description                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| scholarId, termRequirementId                 | Whose, and for what                                                                   |
| state                                        | `not_started`, `submitted`, `under_review`, `verified`, `returned`                    |
| currentVersion                               | The latest version number                                                             |
| claimedBy, claimedAt                         | The checker who claimed it, and when                                                  |
| firstSubmittedAt, lastSubmittedAt, decidedAt | Its dates                                                                             |
| schoolIdAtFiling                             | The school it was filed at, kept after a transfer (**assumed** name, from FR-ADM-002) |

| Operation           | Purpose                                                          |
| ------------------- | ---------------------------------------------------------------- |
| addVersion(version) | `not_started` or `returned` → `submitted`                        |
| claim(checker)      | `submitted` → `under_review`                                     |
| releaseClaim()      | `under_review` → `submitted`, claim cleared                      |
| decide(review)      | `under_review` → `verified` (final) or `returned`; claim cleared |

**Related Classes:** Scholar, TermRequirement, SubmissionVersion, Review.

### Class 14: SubmissionVersion

**Purpose:** One uploaded file of a filing, never changed or deleted.

| Attribute                               | Description                        |
| --------------------------------------- | ---------------------------------- |
| submissionId, versionNo                 | Which filing, and v1, v2, …        |
| storagePath                             | Its unique path in private storage |
| fileName, mimeType, sizeBytes, checksum | The file's details                 |
| uploadedBy, uploadedAt                  | Who uploaded it, and when          |

| Operation      | Purpose                                   |
| -------------- | ----------------------------------------- |
| create()       | Saved once; no update or delete exists    |
| gradeSummary() | Total units, weighted average, line count |

**Related Classes:** Submission, GradeLine, Review, UploadTicket.

### Class 15: GradeLine

**Purpose:** One subject the scholar typed from the Certified Report of Grades.

| Attribute   | Description                    |
| ----------- | ------------------------------ |
| lineNo      | 1 to 30, unique in the version |
| subjectCode | 2 to 20 characters             |
| units       | Above 0, up to 15              |
| grade       | Within the school's scale      |

| Operation       | Purpose                                          |
| --------------- | ------------------------------------------------ |
| validate(scale) | Check every rule above                           |
| passes(scale)   | Whether the line passes (shown, never a verdict) |

**Related Classes:** SubmissionVersion, GradeScale, WeightedAverageCalculator.

### Class 16: WeightedAverageCalculator

**Purpose:** Works out the weighted average one way, so the browser and the server agree
(FR-SCH-003, NFR-PER-003).

| Attribute | Description                       |
| --------- | --------------------------------- |
| (none)    | A pure calculation, with no state |

| Operation      | Purpose                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------- |
| compute(lines) | Σ(units × grade) ÷ Σ units, rounded half away from zero to 4 places; empty when units total 0 |

**Related Classes:** GradeLine, SubmissionVersion.

### Class 17: UploadTicket

**Purpose:** Permission to put one file at one path, for at most 300 seconds
(FR-SCH-002).

| Attribute   | Description                                                          |
| ----------- | -------------------------------------------------------------------- |
| signedUrl   | Where the browser sends the file                                     |
| storagePath | `{region}/{school}/{scholar}/{term}/{requirement}/v{n}-{uuid}.{ext}` |
| expiresAt   | 300 seconds or less from issue                                       |

| Operation                       | Purpose                                      |
| ------------------------------- | -------------------------------------------- |
| issue(scope, requirement, file) | Check type and size, build the path, sign it |

**Related Classes:** SessionScope, SubmissionVersion, TuitionRemittance.

### Class 18: Review

**Purpose:** A checker's decision on one version, never changed (FR-CHK-004).

| Attribute           | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| submissionVersionId | The version decided on                                      |
| reviewerId          | The checker                                                 |
| decision            | `verified` or `returned`                                    |
| reasonCode          | Empty for `verified`; one of the eight for `returned`       |
| remarks             | At least 10 non-space characters when the reason is `other` |
| decidedAt           | When                                                        |

| Operation  | Purpose                            |
| ---------- | ---------------------------------- |
| validate() | Check the reason and remarks rules |
| record()   | Save it and move the Submission    |

**Related Classes:** SubmissionVersion, Submission, UserAccount.

### Class 19: ReviewQueue

**Purpose:** The list of filings for the Regional Office to check (FR-CHK-001).

| Attribute                             | Description |
| ------------------------------------- | ----------- |
| school, state, requirement, unchecked | The filters |

| Operation | Purpose                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------- |
| list()    | Filings in the supervised region, oldest first, with days left; none hidden after the deadline |

**Related Classes:** Submission, School, DeadlineClock.

### Class 20: BatchProgress

**Purpose:** A school's burn-down for a term (FR-MON-001).

| Attribute             | Description                                            |
| --------------------- | ------------------------------------------------------ |
| scholarsTotal         | Active scholars in the term                            |
| scholarsCleared       | Those with every mandatory requirement verified        |
| scholarsOutstanding   | Total minus cleared                                    |
| cellsOutstanding      | Mandatory items not yet verified                       |
| oldestUnsubmittedDays | Days since the term opened, for the oldest unsubmitted |

| Operation               | Purpose                    |
| ----------------------- | -------------------------- |
| forSchool(school, term) | Compute it, for staff only |

**Related Classes:** School, AcademicTerm, Submission.

### Class 21: AuditEntry

**Purpose:** One permanent line of who changed what (NFR-SEC-003).

| Attribute          | Description                                       |
| ------------------ | ------------------------------------------------- |
| actorId, actorRole | Who                                               |
| action             | Insert, update or delete                          |
| entity, entityId   | Which record                                      |
| regionId, schoolId | Taken from the record's school, never the actor's |
| before, after      | The record before and after                       |
| ip, occurredAt     | Where from, and when                              |

| Operation         | Purpose                                            |
| ----------------- | -------------------------------------------------- |
| write(change)     | Made by the data layer itself; no update or delete |
| historyOf(record) | Every line for a record, oldest first              |

**Related Classes:** Region, School, UserAccount.

### Class 22: ReleaseBatch _(designed)_

**Purpose:** The Regional Office's list of cleared scholars for one or more benefits,
sent to Central Office (FR-REL-001, FR-REL-002).

| Attribute                                              | Description                                                                |
| ------------------------------------------------------ | -------------------------------------------------------------------------- |
| regionId, termId                                       | Whose batch, for which term (**assumed**)                                  |
| benefits                                               | The benefits it releases                                                   |
| state                                                  | `draft`, `sent_to_central`, `approved`, `returned_to_regional`, `released` |
| returnReason                                           | Central Office's reason for returning it (**assumed**)                     |
| sentAt/By, approvedAt/By, returnedAt/By, releasedAt/By | Who made each change, and when                                             |

| Operation                | Purpose                                    |
| ------------------------ | ------------------------------------------ |
| addScholar(scholar)      | Only if the scholar is cleared             |
| send()                   | `draft` → `sent_to_central`                |
| approve()                | `sent_to_central` → `approved`             |
| returnToRegional(reason) | `sent_to_central` → `returned_to_regional` |
| reopen()                 | `returned_to_regional` → `draft`           |
| recordRelease()          | `approved` → `released`                    |

**Related Classes:** ReleaseLine, Benefit, Scholar.

### Class 23: ReleaseLine and ReleaseAmount _(designed)_

**Purpose:** One scholar on a batch, with the amounts DOST recorded, and the status the
scholar sees (FR-REL-001, FR-REL-003).

| Attribute                           | Description                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| batchId, scholarId                  | Which batch, which scholar                                                                                                      |
| state                               | `included`, `removed_by_regional`, `removed_by_central`, `moved_to_later_batch` (**assumed** name for "moved to a later batch") |
| removalReason, removedBy, removedAt | Required for a Central Office removal                                                                                           |
| amounts (ReleaseAmount)             | Per benefit: requested amount, then released amount, as entered                                                                 |

| Operation                     | Purpose                                                                    |
| ----------------------------- | -------------------------------------------------------------------------- |
| recordAmount(benefit, amount) | Store the amount as entered; nothing is calculated                         |
| remove(reason)                | Regional before sending, or Central with a reason                          |
| scholarStatus()               | One of the eight statuses in FR-REL-003, with its date; never a prediction |

**Related Classes:** ReleaseBatch, Scholar, Benefit.

### Class 24: TuitionRemittance _(designed)_

**Purpose:** Tuition DOST sent one school for one term, with proof (FR-TUI-001,
FR-TUI-002).

| Attribute                     | Description                               |
| ----------------------------- | ----------------------------------------- |
| schoolId, termId              | Which school and term                     |
| reference                     | Check or LDDAP number                     |
| amount                        | The total sent; never shown to scholars   |
| proofPath                     | The proof document, in private storage    |
| state                         | `sent`, `received`, `disputed`, `settled` |
| disputeReason                 | Required for a dispute                    |
| sentAt, receivedAt, settledAt | Its dates                                 |

| Operation          | Purpose                                               |
| ------------------ | ----------------------------------------------------- |
| record()           | The Regional Office saves it as `sent`                |
| confirm()          | `sent` → `received`                                   |
| dispute(reason)    | `sent` or `received` → `disputed`                     |
| correct()          | `disputed` → `sent`                                   |
| settleIfComplete() | `received` → `settled` when every scholar is credited |

**Related Classes:** RemittanceScholar, School, AcademicTerm.

### Class 25: RemittanceScholar _(designed)_

**Purpose:** One scholar on a remittance's list, and their tuition card (FR-TUI-002,
FR-TUI-003).

| Attribute    | Description                   |
| ------------ | ----------------------------- |
| remittanceId | The remittance                |
| scholarId    | The scholar                   |
| creditedAt   | When the school credited them |

| Operation | Purpose                                        |
| --------- | ---------------------------------------------- |
| credit()  | Record the credited date (one, or all at once) |
| card()    | Sent date and credited date; no amount         |

**Related Classes:** TuitionRemittance, Scholar.

### Class 26: Benefit and BenefitRule _(designed)_

**Purpose:** What scholars may receive, and who receives it (FR-BEN-001, FR-BEN-003).

| Attribute                                | Description                                                                                                     |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| name, ceiling, cadence, basis (Benefit)  | The benefit                                                                                                     |
| awardYear, scholarshipType (BenefitRule) | Who it applies to                                                                                               |
| conditions (BenefitRule)                 | Optional Agreement §VI conditions: year level or term, studying outside the home region, programme requirements |

| Operation            | Purpose                                                    |
| -------------------- | ---------------------------------------------------------- |
| benefitsFor(scholar) | The scholar's benefits from rules and per-scholar changes  |
| ceilingLabel()       | "payable subject to availability of funds (Agreement §VI)" |

**Related Classes:** ScholarBenefitChange, BenefitProposal, ScholarshipAgreement, ReleaseAmount.

### Class 27: ScholarBenefitChange and BenefitProposal _(designed)_

**Purpose:** Changes to benefits: made by Central Office at once, or proposed by the
Regional Office and decided by Central Office (FR-BEN-002).

| Attribute                                  | Description                                               |
| ------------------------------------------ | --------------------------------------------------------- |
| scholarId, benefitId, addOrRemove          | The per-scholar change                                    |
| reason, madeBy, madeAt                     | Why, who and when                                         |
| proposal: kind, payload                    | What the proposal changes: the list, a rule, or a scholar |
| proposal: state, decidedBy, decisionReason | `pending`, `approved` or `rejected`                       |

| Operation      | Purpose                                         |
| -------------- | ----------------------------------------------- |
| apply()        | A Central Office change takes effect at once    |
| propose()      | Saved as `pending`; changes nothing yet         |
| approve()      | `pending` → `approved`; the change takes effect |
| reject(reason) | `pending` → `rejected`                          |

**Related Classes:** Benefit, BenefitRule, Scholar.

---

## Part X. Determine Component Communication

| Sender Component          | Information/Request Sent                                                 | Receiver Component                                        | Response                                                                  |
| ------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| Any front end (P1 to P5)  | Email and password                                                       | B1 Identity & Access (through the authentication service) | A signed token with the Session Scope, or an empty scope                  |
| Hosting edge              | The request address                                                      | B1 Identity & Access                                      | The school whose portal to show                                           |
| P1 Scholar Portal         | Show my dashboard                                                        | B3 Periodic Submission                                    | Checklist in the school's words, states, banner state                     |
| B3 Periodic Submission    | Is this scholar cleared? Days left?                                      | B6 Compliance Monitoring, DeadlineClock                   | Cleared state; days remaining                                             |
| P1 Scholar Portal         | Requirement, file name, type, size                                       | B4 Document Storage                                       | Upload Ticket, or a refusal with what to fix                              |
| Browser (P1)              | The file bytes, to the signed link                                       | D2 Document Store                                         | Stored, or refused (wrong path, overwrite)                                |
| P1 Scholar Portal         | Commit: requirement, storage path, file details, grade lines             | B3 Periodic Submission                                    | Saved version; state `submitted`                                          |
| B3 Periodic Submission    | Insert version and grade lines                                           | D1 Compliance Database                                    | Saved; the submission moves to `submitted`; an audit line is written      |
| P3 DOST Regional Console  | Queue filters                                                            | B5 Review                                                 | Filings in the region, oldest first, with days left                       |
| P3 DOST Regional Console  | Claim, or release a claim                                                | B5 Review                                                 | Filing `under_review` for this checker, or back to `submitted`            |
| B5 Review                 | Download link for a version                                              | B4 Document Storage                                       | A link that lasts 300 seconds or less                                     |
| P3 DOST Regional Console  | Decision, reason, remarks                                                | B5 Review                                                 | Filing `verified` or `returned`; or a refusal (missing reason or remarks) |
| D1 Compliance Database    | Every change to a compliance record                                      | B11 Audit / D3 Audit Log Store                            | A permanent audit line, region taken from the record                      |
| P2, P3                    | School and term                                                          | B6 Compliance Monitoring                                  | Burn-down figures                                                         |
| P3 DOST Regional Console  | New batch; scholars; amounts; send                                       | B7 Release Pipeline                                       | Only cleared scholars offered (from B6); batch `sent_to_central`          |
| P4 Central Office Console | Approve, return, remove a scholar with reason, record release            | B7 Release Pipeline                                       | The batch's or line's new state, with who and when                        |
| P1 Scholar Portal         | My release status                                                        | B7 Release Pipeline                                       | One status and its date, with recorded amounts                            |
| P3 DOST Regional Console  | Remittance details and proof                                             | B8 Tuition Settlement, B4                                 | Remittance `sent`; proof stored privately                                 |
| P2 Coordinator Workspace  | Confirm, credit one or all, or dispute with reason                       | B8 Tuition Settlement                                     | `received`, credited dates, `settled`, or `disputed`                      |
| P1 Scholar Portal         | My tuition card                                                          | B8 Tuition Settlement                                     | Sent date and credited date, no amount                                    |
| P3 DOST Regional Console  | Benefit proposal                                                         | B9 Benefit Administration                                 | Proposal `pending`                                                        |
| P4 Central Office Console | Benefit or rule change; per-scholar change; approve or reject a proposal | B9 Benefit Administration                                 | The change in effect, or the proposal's new state                         |
| P1 Scholar Portal         | My benefits                                                              | B9 Benefit Administration                                 | Benefits and ceilings with the §VI label                                  |
| P3, P5                    | New school, accounts, transfer; reference data, staff accounts           | B10 School & Account Administration                       | Saved records                                                             |
| P2, P4                    | Branding, scale, passing grade; §VII.A threshold                         | B10 School & Account Administration                       | Saved settings                                                            |
| P3, P4                    | A record's history                                                       | B11 Audit                                                 | Its audit lines, oldest first, or nothing outside the reader's region     |
| B1 to B11                 | Every read and write, with the session token                             | D1 Compliance Database                                    | Only rows in scope; refusals for forbidden transitions                    |

### Main communication flows

- **Sign in:** front end → authentication service → B1 (profile → Session Scope) →
  signed token → front end; then the hosting edge → B1 (address → school portal).
- **File a Periodic Report:** P1 → B3 (checklist, banner via DeadlineClock and B6) → B4
  (Upload Ticket) → D2 (file) → B3 (commit) → D1 (version, grade lines, state) → D3
  (audit line).
- **Check a filing:** P3 → B5 (queue from D1's Compliance Matrix) → B5 (claim) → B4
  (download link) → B5 (decision) → D1 (review, state) → D3 (audit line) → P1 (the
  scholar sees the result).
- **Release a batch:** P3 → B7 (B6 offers cleared scholars) → B7 (send) → P4 → B7
  (approve or return; release) → D1 → P1 (release status).
- **Settle tuition:** P3 → B8 and B4 (remittance and proof) → P2 → B8 (confirm, credit,
  dispute) → D1 → P1 (tuition card).
- **Change a benefit:** P3 → B9 (proposal) → P4 → B9 (approve or reject), or P4 → B9
  (direct change) → D1 → P1 (benefits and ceilings).
- **See who did what:** any change → D1 → D3; P3 or P4 → B11 → D3 (scoped by the
  record's region).

---

## Part XI. Organize the System Architecture

The system uses a **three-layer architecture**, with one deliberate overlap: the rules
that must hold for every caller (scope, state transitions, append-only records, audit)
are checked in the business logic layer **and enforced again** in the data layer, so a
mistake or a bypass in one action can never break them. The SRS asks for exactly this:
row-level security on every table (NFR-SEC-001), transition and append-only triggers
(FR-SCH-004, FR-CHK-004), and audit triggers (NFR-SEC-003).

```text
┌───────────────────────────── Presentation Layer ─────────────────────────────┐
│ P1 Scholar Portal · P2 Coordinator Workspace · P3 DOST Regional Console       │
│ P4 DOST Central Office Console · P5 Administration Console                    │
│ (one school portal per subdomain; the address picks the layout, never data)   │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │ actions and reads, with the session token
┌─────────────────────────── Business Logic Layer ─────────────────────────────┐
│ B1 Identity & Access · B2 Term & Requirement Setup · B3 Periodic Submission   │
│ B4 Document Storage · B5 Review · B6 Compliance Monitoring                    │
│ B7 Release Pipeline · B8 Tuition Settlement · B9 Benefit Administration       │
│ B10 School & Account Administration · B11 Audit                               │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │ scoped queries; signed file links
┌──────────────────────────────── Data Layer ──────────────────────────────────┐
│ D1 Compliance Database (row-level security, transitions, views)               │
│ D2 Document Store (private bucket, path-scoped, never overwritten)            │
│ D3 Audit Log Store (append-only)                                              │
└───────────────────────────────────────────────────────────────────────────────┘
```

In the SRS's environment (§2.1), the presentation layer and the actions run on the web
host, and the data layer is the PostgreSQL database, its authentication hook and its
storage. Nothing here is built.

### Architecture Summary

| Layer          | Components                                                                                                                                                                                                                                                 | Main Responsibility                                                                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Presentation   | P1 Scholar Portal, P2 Coordinator Workspace, P3 DOST Regional Console, P4 DOST Central Office Console, P5 Administration Console                                                                                                                           | Show each role its own screens in its school's branding; collect input and check it early; never decide access.                                                     |
| Business Logic | B1 Identity & Access, B2 Term & Requirement Setup, B3 Periodic Submission, B4 Document Storage, B5 Review, B6 Compliance Monitoring, B7 Release Pipeline, B8 Tuition Settlement, B9 Benefit Administration, B10 School & Account Administration, B11 Audit | Apply the SRS's rules: validate input against shared schemas, run each workflow, move records between states, and coordinate the front ends with the data.          |
| Data           | D1 Compliance Database, D2 Document Store, D3 Audit Log Store                                                                                                                                                                                              | Store records and files; enforce scope, allowed transitions, append-only records and overwrite refusal for every caller; write audit lines; serve pre-joined views. |

---

## Part XII. Apply Software Design Principles

| Principle              | How Your System Applies the Principle                                                                                                                                                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Abstraction            | Each school's differences are reduced to a few values: a GradeScale (min, max, which end is better, passing grade), a SchoolRequirementLabel per national code, and branding. Every other component works with the abstraction and never asks "which school is this?".           |
| Modularity             | The system is split into eleven business modules, each owning one kind of record or decision (Part IV), so the designed parts (release, tuition, benefits) can be added without touching the proven compliance core.                                                             |
| Encapsulation          | A Submission's state can change only through `addVersion()`, `claim()`, `releaseClaim()` and `decide()`; nothing sets `state` directly, and the data layer refuses any other transition (AC-03). Likewise a ReleaseBatch's state, a TuitionRemittance's and a BenefitProposal's. |
| Separation of Concerns | The address picks the layout (FR-IAM-002) and the token picks the data (FR-IAM-003): presentation never decides access. Files are handled by Document Storage, records by the database. Auditing is a data-layer concern, not something each action must remember.               |
| Information Hiding     | Scholars never see amounts on the tuition card, other scholars' lines, or audit lines. The storage path layout is known only to Document Storage. The vendor's authentication and storage are hidden behind B1, B4 and D1/D2.                                                    |
| High Cohesion          | Each module's operations serve one purpose: Review only queues, claims and decides; Release Pipeline only moves batches and lines; the DeadlineClock only works out dates in Manila; the WeightedAverageCalculator only computes the average.                                    |
| Low Coupling           | Modules talk through narrow questions: Release Pipeline asks Compliance Monitoring only "is this scholar cleared?", and Periodic Submission asks Document Storage only for a ticket. A change to how filings are checked does not change how batches are built.                  |

### Design Questions

1. **Are related functions grouped together?** Yes. Part IV groups every function by the
   record or decision it serves; for example, the queue, claim, evidence view and
   decision are all in Review.
2. **Does each module have a clear responsibility?** Yes. Part V gives each one sentence,
   and Part VI's blocks show none does two unrelated things.
3. **Are unnecessary dependencies avoided?** Yes. The front ends depend on modules, not on
   each other; modules depend on the data layer and on at most two other modules (Part X).
   Release Pipeline depends on Compliance Monitoring only for the cleared check.
4. **Is important internal information hidden from other components?** Yes. Storage
   paths, the token's claims and the vendor are each known to one component; amounts and
   audit lines are hidden from scholars by the data layer, not only by the screens.
5. **Can one component be modified without unnecessarily changing others?** Yes. The
   designed modules (B7 to B10) can be built or changed without touching B3 and B5, and a
   school's scale or names change through data, not code.

---

## Part XIII. Design the Major System Processes

One process per swimlane. Each process's steps cite its swimlane's step numbers, so the
activity and sequence diagrams can be drawn from either.

### Process P01: Sign in, and reach only your own screens

Swimlane [01](../02-swimlanes/01-sign-in.html), steps S01.1 to S01.12. FR-IAM-001 to 003.

| Item                             | Description                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Trigger                          | A user opens their school's portal address, or the DOST console's (S01.1).                                                                                                                                                                                                                                                                                               |
| Precondition                     | The user has an account.                                                                                                                                                                                                                                                                                                                                                 |
| Input                            | The address; email and password.                                                                                                                                                                                                                                                                                                                                         |
| Main Processing (numbered steps) | 1. Show the school's portal, or the DOST console, from the address (S01.2). 2. Take email and password (S01.3). 3. Check them (S01.4). 4. Check the account is active with a profile (S01.5). 5. Put role, region and school into the session (S01.7). 6. Open the role's home (S01.8). 7. On every record the user opens, check it is within the scope (S01.9, S01.10). |
| Output                           | The role's home; the records in scope.                                                                                                                                                                                                                                                                                                                                   |
| Postcondition                    | The session carries the scope, or an empty one.                                                                                                                                                                                                                                                                                                                          |

| Decision                                | Condition                                       | If Yes                               | If No                                                                 |
| --------------------------------------- | ----------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------- |
| Email and password correct? (S01.4)     | The authentication service accepts them         | Check the profile                    | Stay on the sign-in screen                                            |
| Active account, with a profile? (S01.5) | A profile exists and `is_active` is true        | Put the scope in the session (S01.7) | Signed in with no role, region or school: every list is empty (S01.6) |
| Within the session's scope? (S01.10)    | The record's school or region matches the scope | Show the record (S01.11)             | Return no rows, and no error (S01.12)                                 |

### Process P02: Set up a term

Swimlane [02](../02-swimlanes/02-set-up-a-term.html), steps S02.1 to S02.11. §1.3; §4.1
"Configure Campus Terms", "Customize Requirement Labels"; FR-SCH-001's deadline.

| Item                             | Description                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trigger                          | A new term is coming.                                                                                                                                                                                                                                                                                                                                                                                           |
| Precondition                     | The school exists, with a coordinator; the Regional Office supervises it.                                                                                                                                                                                                                                                                                                                                       |
| Input                            | Term name, type and dates; when filing opens; school labels and instructions; the checklist and mandatory flags; the deadline.                                                                                                                                                                                                                                                                                  |
| Main Processing (numbered steps) | 1. The coordinator adds the term (S02.1) and sets when filing opens (S02.2). 2. The coordinator names each requirement in the school's words (S02.3). 3. Save (S02.4). 4. The Regional Office chooses the checklist and mandatory items (S02.5) and sets the deadline (S02.6). 5. Save (S02.7). 6. A scholar opens the dashboard (S02.8) and sees the checklist, with or without a countdown (S02.9 to S02.11). |
| Output                           | The term, its labels, its checklist and deadline.                                                                                                                                                                                                                                                                                                                                                               |
| Postcondition                    | Scholars at the school can file for the term.                                                                                                                                                                                                                                                                                                                                                                   |

| Decision                           | Condition                     | If Yes                                | If No                                |
| ---------------------------------- | ----------------------------- | ------------------------------------- | ------------------------------------ |
| Deadline set for the term? (S02.9) | `submission_due` is not empty | Checklist with the countdown (S02.10) | Checklist with no countdown (S02.11) |

### Process P03: File a Periodic Report

Swimlane [03](../02-swimlanes/03-file-a-periodic-report.html), steps S03.1 to S03.10.
FR-SCH-001 to 004.

| Item                             | Description                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trigger                          | The scholar opens a requirement that is not started, or was returned (S03.3).                                                                                                                                                                                                                                                                                                                                                                     |
| Precondition                     | The scholar is signed in, has an active agreement at the school, and the term's checklist exists.                                                                                                                                                                                                                                                                                                                                                 |
| Input                            | The file; for the Certified Report of Grades, each subject's code, units and grade.                                                                                                                                                                                                                                                                                                                                                               |
| Main Processing (numbered steps) | 1. Show the checklist, states and banner (S03.1, S03.2). 2. The scholar chooses the file and types grade lines (S03.4). 3. Work out the weighted average as each line is typed (S03.5). 4. Check the file and lines (S03.6). 5. The scholar files it (S03.7). 6. Issue an Upload Ticket and send the file to private storage (S03.8). 7. Save a new version with its grade lines, never replacing the last (S03.9). 8. Show "submitted" (S03.10). |
| Output                           | Status "submitted"; the new version.                                                                                                                                                                                                                                                                                                                                                                                                              |
| Postcondition                    | The submission is `submitted`, with the new current version; an audit line exists.                                                                                                                                                                                                                                                                                                                                                                |

| Decision                                              | Condition                                                                                                 | If Yes                       | If No                                                                       |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------- |
| File and grade lines allowed? (S03.6)                 | Accepted type, size above 0 and up to 10 MB; lines 1 to 30, codes 2 to 20, units 0 to 15, grades in scale | Let the scholar file (S03.7) | Say what to fix and return to S03.4                                         |
| Upload confirmed? (**assumed** decision, NFR-REL-002) | The file reached storage and the commit succeeded                                                         | Show "submitted"             | Try again: a new ticket gives a new path and version, so nothing is damaged |

### Process P04: Check a filing

Swimlane [04](../02-swimlanes/04-check-a-filing.html), steps S04.1 to S04.12.
FR-CHK-001 to 004, FR-MON-001.

| Item                             | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trigger                          | The Regional Office opens the console (S04.1).                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Precondition                     | A filing in the supervised region is `submitted`.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Input                            | Queue filters; the filing to claim; the decision, reason and remarks.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Main Processing (numbered steps) | 1. Show each school's burn-down (S04.1). 2. Filter the queue, oldest first, with days to the deadline (S04.2). 3. Claim a filing (S04.3); save it as under review (S04.4). 4. Compare the document with the grade lines and average (S04.5). 5. Decide (S04.6). 6. Save verified (S04.7) or returned with the reason (S04.8, S04.9). 7. The scholar sees verified (S04.10) or reads the reason and files a correction (S04.11, process P03). 8. The coordinator follows the burn-down (S04.12). |
| Output                           | The filing `verified` or `returned`; updated burn-down.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Postcondition                    | A Review is saved for good; the claim is cleared; an audit line exists.                                                                                                                                                                                                                                                                                                                                                                                                                         |

| Decision                        | Condition                                                | If Yes                                   | If No                                    |
| ------------------------------- | -------------------------------------------------------- | ---------------------------------------- | ---------------------------------------- |
| Can it be claimed? (FR-CHK-002) | The filing is `submitted` and not claimed                | Claim it (S04.3, S04.4)                  | Refuse; another checker has it           |
| Correct and complete? (S04.6)   | The document matches the typed lines and the requirement | Verify (S04.7): final                    | Return with one of eight reasons (S04.8) |
| Reason `other`? (FR-CHK-004)    | The chosen reason is `other`                             | Require remarks of 10 or more characters | Save with the reason alone               |
| Decide now? (FR-CHK-002)        | The checker is ready to decide                           | Continue to S04.6                        | Release the claim: back to `submitted`   |

### Process P05: Release a batch

Swimlane [05](../02-swimlanes/05-release-a-batch.html), steps S05.1 to S05.13.
FR-REL-001 to 003.

| Item                             | Description                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trigger                          | The Regional Office starts a release batch for one or more benefits (S05.1).                                                                                                                                                                                                                                                                                                                                                                |
| Precondition                     | Some scholars are cleared for the term.                                                                                                                                                                                                                                                                                                                                                                                                     |
| Input                            | Benefits; scholars; each scholar's amount per benefit; Central Office's decisions and reasons.                                                                                                                                                                                                                                                                                                                                              |
| Main Processing (numbered steps) | 1. Offer only cleared scholars (S05.2). 2. Add scholars and record amounts as entered (S05.3). 3. Send to Central Office (S05.4); save with the date (S05.5). 4. Central Office reviews and may remove one scholar with a reason (S05.6). 5. Decide (S05.7). 6. Save approved (S05.9) or returned (S05.8). 7. Record the release (S05.10); save released (S05.11). 8. The scholar sees "Released by Central Office" with its date (S05.12). |
| Output                           | The batch `released`; each scholar's status.                                                                                                                                                                                                                                                                                                                                                                                                |
| Postcondition                    | Every change is recorded with who and when.                                                                                                                                                                                                                                                                                                                                                                                                 |

| Decision                                 | Condition                                            | If Yes                                                          | If No                                                                         |
| ---------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Scholar cleared? (S05.2)                 | Every mandatory requirement for the term verified    | Offer the scholar                                               | Not offered; their status stays "documents outstanding"                       |
| Approve the batch? (S05.7)               | Central Office accepts the list                      | Approved (S05.9)                                                | Returned to the Regional Office with the reason (S05.8), then back to `draft` |
| Remove a scholar? (S05.6)                | Central Office finds a problem with one line         | `removed_by_central`, reason required                           | The line stays `included`                                                     |
| Scholar left out of this batch? (S05.13) | The scholar was not on, or was taken off, this batch | "Moved to a later batch", with the reason; nothing is forfeited | Continue to release                                                           |

### Process P06: Settle a school's tuition

Swimlane [06](../02-swimlanes/06-settle-tuition.html), steps S06.1 to S06.13.
FR-TUI-001 to 003.

| Item                             | Description                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Trigger                          | The Regional Office records a remittance for one school and term (S06.1).                                                                                                                                                                                                                                                                                                                                    |
| Precondition                     | The school and term exist; DOST has sent the money outside the system.                                                                                                                                                                                                                                                                                                                                       |
| Input                            | Reference, amount, proof, list of scholars; the coordinator's confirmation, credits or dispute reason.                                                                                                                                                                                                                                                                                                       |
| Main Processing (numbered steps) | 1. Save as sent, the proof in private storage (S06.2). 2. The coordinator compares it with the school's records (S06.3, S06.4). 3. Save received (S06.6) or disputed (S06.5). 4. The coordinator credits scholars, one or all (S06.7); save each credited date (S06.8). 5. When everyone is credited, save settled (S06.9, S06.10). 6. The scholar's card shows sent and credited dates, no amount (S06.12). |
| Output                           | The remittance `settled`, or `disputed`.                                                                                                                                                                                                                                                                                                                                                                     |
| Postcondition                    | Every listed scholar has a credited date, or the dispute is recorded with its reason.                                                                                                                                                                                                                                                                                                                        |

| Decision                                | Condition                                       | If Yes                              | If No                                                                                      |
| --------------------------------------- | ----------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------ |
| Does it match? (S06.4)                  | The remittance agrees with the school's records | Received (S06.6)                    | Disputed with the reason (S06.5); the Regional Office corrects it and it returns to `sent` |
| Everyone on the list credited? (S06.9)  | Every Remittance Scholar has a credited date    | Settled (S06.10)                    | Stays received until the rest are credited (S06.11)                                        |
| Problem found after receiving? (S06.13) | The coordinator finds a mismatch later          | Disputed after all, with the reason | Continue crediting                                                                         |

### Process P07: Change a benefit, or propose a change

Swimlane [07](../02-swimlanes/07-change-a-benefit.html), steps S07.1 to S07.9.
FR-BEN-001 to 003.

| Item                             | Description                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trigger                          | The Regional Office proposes a change (S07.1), or Central Office makes one (S07.7).                                                                                                                                                                                                                                                                            |
| Precondition                     | The benefit list exists.                                                                                                                                                                                                                                                                                                                                       |
| Input                            | The change to the list, a rule, or one scholar's benefits, with its reason.                                                                                                                                                                                                                                                                                    |
| Main Processing (numbered steps) | 1. Save the proposal as pending; it changes nothing yet (S07.2). 2. Central Office decides (S07.3). 3. Save rejected with the reason (S07.4, S07.5), or approved and in effect (S07.6). 4. Or Central Office changes it directly, in effect at once (S07.7), saved with who and why (S07.8). 5. The scholar sees their benefits and labelled ceilings (S07.9). |
| Output                           | The change in effect, or the proposal rejected.                                                                                                                                                                                                                                                                                                                |
| Postcondition                    | Every change keeps who made it and why.                                                                                                                                                                                                                                                                                                                        |

| Decision                      | Condition                         | If Yes                            | If No                                                                 |
| ----------------------------- | --------------------------------- | --------------------------------- | --------------------------------------------------------------------- |
| Approve the proposal? (S07.3) | Central Office accepts the change | Approved; it takes effect (S07.6) | Rejected with the reason (S07.4); the Regional Office sees it (S07.5) |

### Process P08: Set up a school and its people, and record a transfer

Swimlane [08](../02-swimlanes/08-set-up-schools-and-people.html), steps S08.1 to S08.13.
FR-ADM-001, FR-ADM-002; §4.1 "Maintain Reference Data".

| Item                             | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trigger                          | The administrator sets up DOST staff, or the Regional Office adds a school, or a scholar changes school.                                                                                                                                                                                                                                                                                                                                                                                  |
| Precondition                     | Reference data, such as regions, exists.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Input                            | Reference data; staff accounts; school name, code, address; coordinator; applicant emails with first schools; transfer details.                                                                                                                                                                                                                                                                                                                                                           |
| Main Processing (numbered steps) | 1. The administrator keeps reference data (S08.1) and creates DOST staff accounts (S08.2, S08.3). 2. The Regional Office creates a school (S08.4), its coordinator (S08.5) and scholar accounts (S08.6); save (S08.7). 3. The new user signs in (S08.8, process P01). 4. For a transfer, record the amendment (S08.9), check the region (S08.10), change the current school and keep earlier filings at their school (S08.11). 5. The scholar files next term at the new school (S08.12). |
| Output                           | The school and its accounts; the transfer.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Postcondition                    | Every account has its role and scope; filings keep the school they were filed at.                                                                                                                                                                                                                                                                                                                                                                                                         |

| Decision                                     | Condition                                      | If Yes                       | If No                                                                                          |
| -------------------------------------------- | ---------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------- |
| New school in this office's region? (S08.10) | The new school's region is the office's region | Record the transfer (S08.11) | Not settled by the SRS: which office records a move between regions (S08.13, open question 26) |

### Process P09: Set up the school portal

Swimlane [09](../02-swimlanes/09-set-up-the-school-portal.html), steps S09.1 to S09.6.
FR-ADM-003.

| Item                             | Description                                                                                                                                                                                                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trigger                          | A school's portal is set up, or its settings change.                                                                                                                                                                                                                                                                                  |
| Precondition                     | The school exists, with a coordinator.                                                                                                                                                                                                                                                                                                |
| Input                            | Logo and colours; scale and passing grade; the §VII.A threshold.                                                                                                                                                                                                                                                                      |
| Main Processing (numbered steps) | 1. The coordinator sets branding (S09.1) and the grading scale and passing grade (S09.2); save (S09.3). 2. Central Office sets the §VII.A threshold in the school's scale (S09.4); save (S09.5). 3. Scholars see the portal in the school's colours, each grade line's pass mark and each term average against the threshold (S09.6). |
| Output                           | The school's settings.                                                                                                                                                                                                                                                                                                                |
| Postcondition                    | Every grade check at the school uses its scale.                                                                                                                                                                                                                                                                                       |

| Decision                                  | Condition                                                          | If Yes                     | If No                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------ | -------------------------- | --------------------------------------------------------------------------------- |
| Scale valid? (**assumed**, SR-08)         | Lowest below highest; passing grade and threshold within the scale | Save                       | Say what to fix                                                                   |
| Term average meets the threshold? (S09.6) | Compared in the scale's own direction                              | Show "meets the threshold" | Show "below the threshold"; never a verdict of standing, probation or termination |

### Process P10: Look up who did what to a record

Swimlane [10](../02-swimlanes/10-look-up-who-did-what.html), steps S10.1 to S10.8.
NFR-SEC-003; §4.1 "Inspect Immutable Audit Logs".

| Item                             | Description                                                                                                                                                                                                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trigger                          | Anyone changes a record (S10.1); later, DOST staff open its history (S10.5).                                                                                                                                                                                                             |
| Precondition                     | None for writing; a DOST role for reading.                                                                                                                                                                                                                                               |
| Input                            | The change; the record to look up.                                                                                                                                                                                                                                                       |
| Main Processing (numbered steps) | 1. The data layer writes an audit line by itself: who, what, when, before and after (S10.2). 2. Take the line's region from the record's school (S10.3). 3. Save it for good (S10.4). 4. A reader opens the history (S10.5); check scope (S10.6); show every line, oldest first (S10.7). |
| Output                           | The record's history, or nothing.                                                                                                                                                                                                                                                        |
| Postcondition                    | No audit line has changed.                                                                                                                                                                                                                                                               |

| Decision                                           | Condition                                                          | If Yes                  | If No                |
| -------------------------------------------------- | ------------------------------------------------------------------ | ----------------------- | -------------------- |
| In the reader's region, or Central Office? (S10.6) | The line's region is the reader's, or the reader is Central Office | Show every line (S10.7) | Show nothing (S10.8) |

---

## Part XIV. Design Non-Functional Requirements

| NFR         | Design Requirement                                                               | Design Decision                                                                                                                                                                                                      | Affected Component        |
| ----------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| NFR-SEC-001 | Row-level security on every table; deny by default; scope from token claims only | Every table has scope rules in D1 that read only the SessionScope's claims; the claims are put into the token once, at sign-in, so no rule queries the profiles table; a table without a rule returns nothing.       | B1, D1                    |
| NFR-SEC-002 | Storage access by path; five folders; own prefix; never overwritten              | Only B4 builds paths, from the SessionScope; D2 checks depth and prefix on every upload and refuses every overwrite; every upload gets a new version number and unique name.                                         | B4, D2                    |
| NFR-SEC-003 | Audit every change; region from the record; append-only                          | Audit lines are written by D1 itself on every insert, update and delete of compliance records, not by the actions; the region is looked up through record → scholar → school → region; D3 refuses update and delete. | B11, D1, D3               |
| NFR-PER-001 | Document preview within 1.5 seconds                                              | The browser fetches the file straight from D2 through a short-lived download link, so the bytes never pass through the web host; the link is made in the same request that loads the review screen.                  | B4, B5, P3, D2            |
| NFR-PER-002 | Dashboard and queue in one round trip                                            | D1 keeps two pre-joined views, Compliance Matrix and Batch Progress, that run with the reader's own scope; the dashboard and queue each read one view once.                                                          | B3, B5, B6, D1            |
| NFR-PER-003 | Weighted average within 16 ms, no network                                        | The WeightedAverageCalculator is a pure function that runs in the browser on each keystroke; the server runs the same function once at commit to confirm it.                                                         | B3, P1                    |
| NFR-REL-001 | Every date rule in Asia/Manila calendar days                                     | One DeadlineClock is used for banners, queue days, cutoffs and reminders; it compares calendar dates in Manila, never raw UTC times.                                                                                 | B3, B5, B7, DeadlineClock |
| NFR-REL-002 | A broken upload never damages saved versions                                     | The file is stored before the version is saved; a retry gets a new ticket, path and version number; a left-over file is never referenced by a version.                                                               | B3, B4                    |
| NFR-ACC-001 | Works at 360 px; WCAG 2.1 AA                                                     | Every screen is designed phone-first and drawn for phone, tablet and desktop (`03-`, `04-`); status colours are checked for contrast; states are shown in words as well as colour.                                   | P1 to P5                  |

---

## Part XV. Design the External Interfaces

| External Interface                  | Purpose                                                | Information Exchanged                                                                                   | System Component                       |
| ----------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Authentication service              | Check credentials and issue the session token          | Email and password in; the account's role, region and school added at sign-in; a signed token out       | B1 Identity & Access (Business Logic)  |
| Compliance database (PostgreSQL 15) | Store records and enforce scope, transitions and audit | Scoped queries and writes with the token; rows in scope, refusals, audit lines                          | D1 Compliance Database (Data)          |
| Private object storage              | Keep documents and proofs                              | Signed upload of file bytes to a path; signed download of file bytes; refusals                          | B4 Document Storage, D2 Document Store |
| Hosting edge                        | Serve screens; pick the school portal                  | The request address in; the school's screens out; the session cookie refreshed                          | B1, P1 to P5 (Presentation)            |
| Web browser                         | Show the screens and run the in-browser average        | Pages and actions over HTTPS                                                                            | P1 to P5 (Presentation)                |
| LandBank and bank transfers         | Out of the boundary: money moves outside the system    | None. Central Office records "released"; the Regional Office records the remittance reference and proof | B7, B8 (record only)                   |
| DOST-SEI e-Application portal       | Out of the boundary: where scholars apply              | None directly; applicant emails are entered by the Regional Office (**assumed**)                        | B10                                    |
| Reminder delivery (SR-16)           | Send deadline reminders at 7, 3 and 1 days             | Not specified by the SRS: no channel (email or in-app) is named. **Open**                               | B3 (would read the DeadlineClock)      |

---

## Part XVI. Identify States of Important Objects

| Object                               | Initial State                    | Possible States                                                                                                                                                                                         | Final State                                  |
| ------------------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Submission (§4.2)                    | `not_started`                    | `not_started` → `submitted` → `under_review` → `verified`; `under_review` → `submitted` (claim released); `under_review` → `returned` → `submitted` (correction)                                        | `verified` (no way out, for anyone)          |
| Deadline banner (FR-SCH-001)         | none, while there is no deadline | none; `open_outstanding` ↔ `open_cleared`; after the deadline `closed_outstanding` → `closed_cleared`                                                                                                   | `closed_cleared`                             |
| Release Batch (FR-REL-001, 002)      | `draft`                          | `draft` → `sent_to_central` → `approved` → `released`; `sent_to_central` → `returned_to_regional` → `draft`                                                                                             | `released`                                   |
| Release Line (FR-REL-001, 002)       | `included`                       | `included` → `removed_by_regional` (before sending); `included` → `removed_by_central` (with a reason); moved to a later batch (**assumed** state name)                                                 | `included` on a released batch, or a removal |
| Scholar release status (FR-REL-003)  | documents outstanding            | documents outstanding → cleared → in the Regional Office's list → sent to Central Office → approved → released; exits: moved to a later batch, removed by Central Office (with its reason)              | released, or an exit                         |
| Tuition Remittance (FR-TUI-001, 002) | `sent`                           | `sent` → `received` → `settled`; `sent` → `disputed`; `received` → `disputed`; `disputed` → `sent` (after correction)                                                                                   | `settled`                                    |
| Remittance Scholar (FR-TUI-002)      | listed, not credited             | not credited → credited                                                                                                                                                                                 | credited                                     |
| Benefit Proposal (FR-BEN-002)        | `pending`                        | `pending` → `approved`; `pending` → `rejected`                                                                                                                                                          | `approved` or `rejected`                     |
| User Account (FR-IAM-001)            | active                           | active ↔ inactive (an inactive account signs in with no scope)                                                                                                                                          | none fixed                                   |
| Scholar (§4.3)                       | `active`                         | `active`, `on_leave`, `graduated`, `terminated`, `archived`. The SRS lists these values but not who changes them or in what order (**open**); the system never decides `terminated` itself (FR-ADM-003) | `graduated`, `terminated` or `archived`      |

---

## Part XVII. Requirements-to-Design Traceability

Every FR, NFR, UR, SR and AC is mapped below to a function, a component, its data and a
design decision. Nothing is left out: 24 FR, 9 NFR, 19 UR, 16 SR and 7 AC rows.

| Requirement | System Function                             | Component          | Data/Class                                                     | Design Decision                                                                                                           |
| ----------- | ------------------------------------------- | ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| FR-IAM-001  | Sign in and build the session scope         | B1                 | UserAccount, SessionScope                                      | Claims are added once, at sign-in; a missing or inactive profile gives an empty scope (deny by default).                  |
| FR-IAM-002  | Resolve the school portal from the address  | B1, P1 to P5       | School (subdomain, branding)                                   | The address chooses only the layout; reserved words are refused; data access never depends on it.                         |
| FR-IAM-003  | Filter every read by scope                  | B1, D1             | SessionScope, every table                                      | Scope rules live in D1 and return zero rows, not errors, outside the scope.                                               |
| FR-SCH-001  | Show the checklist and banner               | B3, P1             | AcademicTerm, TermRequirement, Submission, DeadlineClock       | Banner state comes from one DeadlineClock in Manila; labels come from the school.                                         |
| FR-SCH-002  | Issue an upload ticket                      | B4, D2             | UploadTicket                                                   | Only B4 builds paths from the scope; links last 300 s or less; type and size are checked first.                           |
| FR-SCH-003  | Enter grade lines and compute the average   | B3, P1             | GradeLine, GradeScale, WeightedAverageCalculator               | One pure calculator runs in the browser and again at commit; grades are checked against the school's scale.               |
| FR-SCH-004  | Commit a submission version                 | B3, D1             | Submission, SubmissionVersion, GradeLine, ScholarshipAgreement | Versions and lines are append-only; the state change happens in D1, not in the screen.                                    |
| FR-CHK-001  | List the review queue                       | B5, P3, D1         | ReviewQueue, Compliance Matrix                                 | One scoped view, oldest first; the deadline never hides a filing.                                                         |
| FR-CHK-002  | Claim, or release a claim                   | B5, D1             | Submission (claimedBy, claimedAt)                              | Claiming is a state transition D1 allows only from `submitted`, so two checkers cannot claim one filing.                  |
| FR-CHK-003  | Show the evidence side by side              | B5, B4, P3         | SubmissionVersion, GradeLine, grade summary                    | The document loads straight from storage beside the typed lines and summary.                                              |
| FR-CHK-004  | Record a review decision                    | B5, D1, B11        | Review, Submission, AuditEntry                                 | Reason rules are checked in the screen and in D1; reviews are append-only; `verified` is final.                           |
| FR-MON-001  | Compute the school burn-down                | B6, P2, P3, D1     | BatchProgress                                                  | A pre-joined view, readable by staff only, that runs with the reader's scope.                                             |
| FR-REL-001  | Build and send a release batch              | B7, B6, P3         | ReleaseBatch, ReleaseLine, ReleaseAmount                       | Only cleared scholars can be added (asked of B6); amounts are entered, never calculated.                                  |
| FR-REL-002  | Decide on a release batch                   | B7, P4             | ReleaseBatch, ReleaseLine                                      | Every transition records who and when; a removal needs a reason.                                                          |
| FR-REL-003  | Show the scholar's release status           | B7, P1             | ReleaseLine, ReleaseAmount                                     | Status is worked out from recorded states and dates only; no prediction; the scholar's own line only.                     |
| FR-TUI-001  | Record a tuition remittance                 | B8, B4, P3         | TuitionRemittance, RemittanceScholar                           | The proof goes to private storage through B4; the remittance starts as `sent`.                                            |
| FR-TUI-002  | Confirm, credit or dispute                  | B8, P2             | TuitionRemittance, RemittanceScholar                           | Crediting one or all records each date; settlement happens by itself when everyone is credited; a dispute needs a reason. |
| FR-TUI-003  | Show the tuition card                       | B8, P1             | RemittanceScholar                                              | The card shows dates only; the amount is hidden from scholars by the data layer.                                          |
| FR-BEN-001  | Maintain benefits and rules                 | B9, P4             | Benefit, BenefitRule                                           | Only Central Office writes benefits and rules.                                                                            |
| FR-BEN-002  | Change one scholar's benefits, or propose   | B9, P3, P4         | ScholarBenefitChange, BenefitProposal                          | Proposals have no effect until approved; direct changes keep their reason.                                                |
| FR-BEN-003  | Show benefits and ceilings                  | B9, P1             | Benefit, BenefitRule, ScholarBenefitChange                     | Ceilings are shown as recorded, labelled "payable subject to availability of funds (Agreement §VI)"; nothing is totalled. |
| FR-ADM-001  | Provision schools and accounts              | B10, P3, P5        | School, UserAccount, Scholar, ScholarshipAgreement             | The Regional Office creates only in its region; the administrator creates only DOST staff.                                |
| FR-ADM-002  | Record a transfer                           | B10, P3            | AgreementAmendment, Scholar, Submission                        | A transfer is an amendment; earlier filings keep their school; cross-region moves are open (question 26).                 |
| FR-ADM-003  | Set the school portal and threshold         | B10, P2, P4        | School, GradeScale                                             | The system shows pass marks and threshold comparisons, never a verdict.                                                   |
| NFR-SEC-001 | Scope rules on every table                  | B1, D1             | SessionScope                                                   | Scope from token claims only; no rule queries profiles.                                                                   |
| NFR-SEC-002 | Path-based storage access                   | B4, D2             | UploadTicket                                                   | Five folders, own prefix, no overwrites.                                                                                  |
| NFR-SEC-003 | Audit every change                          | B11, D1, D3        | AuditEntry                                                     | Written by the data layer; region from the record; append-only.                                                           |
| NFR-PER-001 | Preview within 1.5 s                        | B4, B5, D2         | SubmissionVersion                                              | The browser loads the file straight from storage.                                                                         |
| NFR-PER-002 | One round trip for dashboard and queue      | B3, B5, B6, D1     | Compliance Matrix, BatchProgress                               | Pre-joined views with the reader's scope.                                                                                 |
| NFR-PER-003 | Average within 16 ms                        | B3, P1             | WeightedAverageCalculator                                      | A pure function in the browser.                                                                                           |
| NFR-REL-001 | Dates in Asia/Manila                        | B3, B5, B7         | DeadlineClock                                                  | One shared clock comparing calendar days.                                                                                 |
| NFR-REL-002 | Upload idempotency                          | B3, B4             | UploadTicket, SubmissionVersion                                | New path and version on every try; the version is saved after the file.                                                   |
| NFR-ACC-001 | Mobile-first and accessible                 | P1 to P5           | —                                                              | Phone-first screens at 360 px; contrast-checked colours; states in words.                                                 |
| UR-01       | File the Periodic Report                    | B3, B4, P1         | Submission, SubmissionVersion, GradeLine                       | Slots per requirement; direct upload; saved versions (process P03).                                                       |
| UR-02       | Know what is owed and the days left         | B3, P1             | DeadlineClock, TermRequirement                                 | Four-state banner in Manila time.                                                                                         |
| UR-03       | See the stipend's progress                  | B7, P1             | ReleaseLine                                                    | One status with its date, never a prediction.                                                                             |
| UR-04       | See tuition sent and credited               | B8, P1             | RemittanceScholar                                              | Dates only, no amount.                                                                                                    |
| UR-05       | See benefits and ceilings                   | B9, P1             | Benefit, BenefitRule                                           | Labelled ceilings, no totals.                                                                                             |
| UR-06       | Keep records private                        | B1, B4, D1, D2     | SessionScope                                                   | Deny by default in the data layer and in storage.                                                                         |
| UR-07       | Set the school's portal, calendar and names | B2, B10, P2        | School, AcademicTerm, SchoolRequirementLabel                   | The coordinator owns school settings; national codes stay fixed.                                                          |
| UR-08       | Confirm and credit remittances              | B8, P2             | TuitionRemittance, RemittanceScholar                           | Confirm, credit one or all, or dispute with a reason (process P06).                                                       |
| UR-09       | See the school's progress                   | B6, P2             | BatchProgress                                                  | The burn-down view, scoped to the coordinator's school.                                                                   |
| UR-10       | Create schools and accounts; transfers      | B10, P3            | School, UserAccount, Scholar, AgreementAmendment               | Region-limited provisioning (process P08).                                                                                |
| UR-11       | Set the term checklist and deadline         | B2, P3             | TermRequirement, AcademicTerm                                  | The Regional Office sets the checklist and deadline (process P02).                                                        |
| UR-12       | Check filings from one queue                | B5, P3             | ReviewQueue, Review                                            | Queue, claim, side-by-side evidence, eight reasons (process P04).                                                         |
| UR-13       | Build and send release batches              | B7, P3             | ReleaseBatch                                                   | Cleared scholars only; entered amounts (process P05).                                                                     |
| UR-14       | Send tuition remittances                    | B8, B4, P3         | TuitionRemittance                                              | Reference, amount, proof and list (process P06).                                                                          |
| UR-15       | Propose benefit changes                     | B9, P3             | BenefitProposal                                                | Pending until Central Office decides (process P07).                                                                       |
| UR-16       | Decide on batches                           | B7, P4             | ReleaseBatch, ReleaseLine                                      | Approve, return, remove with reason, release (process P05).                                                               |
| UR-17       | Manage benefits and thresholds              | B9, B10, P4        | Benefit, BenefitRule, School                                   | Central Office owns benefits and §VII.A thresholds.                                                                       |
| UR-18       | Maintain reference data and staff accounts  | B10, P5            | Region, RequirementType, UserAccount                           | The administrator makes no program decision.                                                                              |
| UR-19       | See who did what                            | B11, P3, P4, D3    | AuditEntry                                                     | History scoped by the record's region (process P10).                                                                      |
| SR-01       | Scope on every table                        | B1, D1             | SessionScope                                                   | As NFR-SEC-001.                                                                                                           |
| SR-02       | File types and size                         | B4, P1             | UploadTicket                                                   | Checked when chosen and when signing.                                                                                     |
| SR-03       | Direct upload                               | B4, D2             | UploadTicket                                                   | File bytes never pass through the web host.                                                                               |
| SR-04       | Path layout; no overwrite                   | B4, D2             | UploadTicket, SubmissionVersion                                | The path is the access key; overwrites refused.                                                                           |
| SR-05       | Append-only records                         | D1, D3             | SubmissionVersion, GradeLine, Review, AuditEntry               | No update or delete operation exists for these classes.                                                                   |
| SR-06       | Schema-checked actions, 1 MB limit          | B1 to B11          | —                                                              | Every action validates input with the same rules the screen uses.                                                         |
| SR-07       | National codes, school labels               | B2                 | RequirementType, SchoolRequirementLabel                        | Two classes, so labels change without changing codes.                                                                     |
| SR-08       | Per-school grade scale                      | B10, B3            | GradeScale                                                     | A value on School used by every grade check.                                                                              |
| SR-09       | Review open at once                         | B5                 | ReviewQueue                                                    | The queue has no deadline gate.                                                                                           |
| SR-10       | Manila time                                 | B3, B5, B7         | DeadlineClock                                                  | As NFR-REL-001.                                                                                                           |
| SR-11       | Invented data only                          | All                | —                                                              | Every example and seed uses invented people and `@example.test` addresses.                                                |
| SR-12       | Light screens; offline average              | P1, B3             | WeightedAverageCalculator                                      | Server-rendered screens; the calculation in the browser.                                                                  |
| SR-13       | Recorded amounts only                       | B7, B9             | ReleaseAmount, Benefit                                         | No total or expected-date operation anywhere.                                                                             |
| SR-14       | No bank execution                           | B7, B8             | ReleaseBatch, TuitionRemittance                                | "Released" and "sent" are recorded events.                                                                                |
| SR-15       | Supervision follows the school              | B1, D1, B11        | School, Region, ScholarshipAgreement                           | Region always through School; signatory region is a record only.                                                          |
| SR-16       | Deadline reminders                          | B3                 | DeadlineClock                                                  | Would read the shared clock; channel and owner are open.                                                                  |
| AC-01       | Scholar sees only own filings               | B1, D1             | SessionScope                                                   | Scope rules in D1.                                                                                                        |
| AC-02       | Other region sees nothing                   | B1, D1, D2         | SessionScope, UploadTicket                                     | Supervising-region rule in D1 and in storage.                                                                             |
| AC-03       | Scholar cannot verify own filing            | D1                 | Submission                                                     | Transitions enforced in D1.                                                                                               |
| AC-04       | Verify is final                             | B5, D1             | Review, Submission                                             | `verified` has no outgoing transition.                                                                                    |
| AC-05       | `other` needs remarks                       | B5, D1, P3         | Review                                                         | The same rule in the screen and in D1.                                                                                    |
| AC-06       | No overwrite                                | B4, D2             | UploadTicket                                                   | Storage refuses every update.                                                                                             |
| AC-07       | Full filing and review journey              | B3, B4, B5, P1, P3 | Submission, SubmissionVersion, GradeLine, Review               | Processes P03 and P04 end to end.                                                                                         |

---

## Part XVIII. Preliminary Software Design Specification

### 1. System Architecture

SEIskolar uses a three-layer architecture. The presentation layer is five role-based
front ends: the Scholar Portal and Coordinator Workspace, served per school under the
school's subdomain and branding, and the DOST Regional, Central Office and
Administration consoles. The business logic layer is eleven modules that run the SRS's
workflows. The data layer is the compliance database, private document storage and the
audit log. Rules that must hold for every caller (scope, state transitions, append-only
records, audit) are enforced again in the data layer, so no action can bypass them. In
the SRS's environment, the front ends and actions run on the web host and the data layer
is PostgreSQL with its authentication and storage; nothing is built in this repository.

### 2. Major Components

Presentation: Scholar Portal, Coordinator Workspace, DOST Regional Console, DOST Central
Office Console, Administration Console. Business logic: Identity & Access, Term &
Requirement Setup, Periodic Submission, Document Storage, Review, Compliance Monitoring,
Release Pipeline, Tuition Settlement, Benefit Administration, School & Account
Administration, Audit. Data: Compliance Database, Document Store, Audit Log Store.

### 3. Component Responsibilities

Identity & Access gives each user a role, region and school at sign-in, or nothing.
Periodic Submission takes a filing to `submitted` through Document Storage, which alone
builds file paths and signed links. Review lets the Regional Office claim and decide
filings with eight standard reasons. Compliance Monitoring says who is cleared and how
each school is doing. Release Pipeline carries batches of cleared scholars from draft to
released; Tuition Settlement carries remittances from sent to settled; Benefit
Administration keeps benefits, rules, changes and proposals. School & Account
Administration keeps schools, people, transfers and settings. Audit records every change
for good.

### 4. Major Data/Classes

SessionScope, UserAccount, Region, School, GradeScale, Scholar, ScholarshipAgreement,
AgreementAmendment, AcademicTerm, RequirementType, SchoolRequirementLabel,
TermRequirement, DeadlineClock, Submission, SubmissionVersion, GradeLine,
WeightedAverageCalculator, UploadTicket, Review, ReviewQueue, BatchProgress, AuditEntry,
ReleaseBatch, ReleaseLine, ReleaseAmount, TuitionRemittance, RemittanceScholar, Benefit,
BenefitRule, ScholarBenefitChange, BenefitProposal.

### 5. Component Communication

The Scholar Portal asks Periodic Submission for the checklist (which asks Compliance
Monitoring and the DeadlineClock), asks Document Storage for an Upload Ticket, sends the
file straight to the Document Store, and commits through Periodic Submission to the
Compliance Database, which writes the audit line. The DOST Regional Console asks Review
for the queue, claims, gets a download link from Document Storage, and records a
decision. Release Pipeline asks Compliance Monitoring only whether a scholar is cleared.
Every module reads and writes through the Compliance Database with the user's token.

### 6. Major System Processes

P01 Sign in; P02 Set up a term; P03 File a Periodic Report; P04 Check a filing; P05
Release a batch; P06 Settle a school's tuition; P07 Change a benefit, or propose a change;
P08 Set up a school and its people, and record a transfer; P09 Set up the school portal;
P10 Look up who did what to a record. Each matches the swimlane with the same number.

### 7. Important Design Decisions

- **Access is decided in the data layer, from token claims only.** The address picks the
  layout, never the data. Why: the legacy Drive failed because "the link is the
  credential" (SRS §1.1, W1).
- **Files never pass through the web host.** Why: the host's 4.5 MB limit, and phone
  scans of 8 to 12 MB (§1.4 trade-off 1).
- **Evidence is append-only.** Versions, grade lines, reviews and audit lines are never
  changed; a correction is a new version. Why: DOST must hold its own records for
  auditors (W2, §1.3).
- **`verified` is final.** Why: a cleared document must stay cleared for release (§4.2).
- **One clock, in Manila.** Why: a midnight deadline must not close 8 hours early in UTC
  (NFR-REL-001).
- **Schools differ by data, not by code.** Grade scale, labels and branding are values on
  the school. Why: CIT-U and UP grade in opposite directions and name requirements
  differently (§1.4 trade-offs 3 and 4).
- **The system records money milestones and amounts; it never pays, totals or predicts.**
  Why: amounts must not read as promises, and payment is out of scope (§1.2, §6.1).
- **Rejected:** a server proxy for uploads (body limit); gating review behind the
  deadline (scholars could not fix errors in time); one national grade scale (schools
  differ); checking scope in the screens (any bug would leak data).

---

## Part XIX. Design Review

| Question                                          | Yes | No  | Explanation                                                                                                                                                                                                        |
| ------------------------------------------------- | --- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Are all SRS requirements represented?             | ☒   | ☐   | All 24 FRs and 9 NFRs of the SRS are in Part I and mapped in Part XVII, with the 19 URs, 16 SRs and 7 ACs drawn from the SRS.                                                                                      |
| Are all major actors identified?                  | ☒   | ☐   | Part III: the five user roles, the Commission on Audit and guardians (no accounts), four system entities and three out-of-boundary ones.                                                                           |
| Are all major system functions identified?        | ☒   | ☐   | Part II: one or more functions per FR, plus the five §4.1 functions with no FR.                                                                                                                                    |
| Are functions grouped into appropriate modules?   | ☒   | ☐   | Part IV: eleven modules, each owning one kind of record or decision.                                                                                                                                               |
| Does every component have a clear responsibility? | ☒   | ☐   | Part V gives each one sentence; Part VI gives each a full block.                                                                                                                                                   |
| Are major data entities identified?               | ☒   | ☐   | Part VII: 25 entities with their create, read, update and retirement.                                                                                                                                              |
| Are preliminary classes identified?               | ☒   | ☐   | Parts VIII and IX: 31 classes with attributes and operations. The designed classes' attribute names are assumed.                                                                                                   |
| Are component interactions identified?            | ☒   | ☐   | Part X: every request between components, and seven main flows.                                                                                                                                                    |
| Is the architecture defined?                      | ☒   | ☐   | Part XI: three layers, with the data layer enforcing the rules every caller must obey.                                                                                                                             |
| Are NFRs reflected in the design?                 | ☒   | ☐   | Part XIV: a design decision and components for each of the 9 NFRs.                                                                                                                                                 |
| Are external interfaces considered?               | ☒   | ☐   | Part XV, including out-of-boundary systems and the open reminder channel.                                                                                                                                          |
| Are constraints reflected in the design?          | ☒   | ☐   | Part I.F, each with its effect; Part XVIII.7 lists the decisions they drive.                                                                                                                                       |
| Are major processes defined?                      | ☒   | ☐   | Part XIII: ten processes, one per swimlane, each with its decisions.                                                                                                                                               |
| Are important object states identified?           | ☒   | ☐   | Part XVI: ten objects, including the four state machines the SRS names.                                                                                                                                            |
| Is the design ready for UML modeling?             | ☒   | ☐   | Yes for the use case, class, activity, sequence and state diagrams. The open items below should be settled first where they touch a diagram (cross-region transfers, reminders, the designed classes' attributes). |

---

## Still open

These are the gaps this document had to fill, or could not. Each needs a decision from
Adrian, who owns the SRS, before the UML that depends on it.

1. **Section and instructor** in the header are blank; the team fills them in.
2. **The designed entities' attributes** (Release Batch, Release Line, Release Amount,
   Tuition Remittance, Remittance Scholar, Benefit, Benefit Rule, Scholar Benefit Change,
   Benefit Proposal) are assumed from the FR text. The SRS (§4.3) points to the archived
   architecture document §2 for them; they should be checked against it.
3. **"Moved to a later batch"** (FR-REL-003, S05.13) is modelled as a Release Line state
   named `moved_to_later_batch`, which the SRS does not name. The SRS also lists
   "returned to the Regional Office" as an exit in §1.2 but not among the scholar's
   statuses in FR-REL-003; this design shows a returned batch's scholars as "in the
   Regional Office's list" again.
4. **Cross-region transfers** (FR-ADM-002): which office records them is the SRS's open
   question 26.
5. **Deadline reminders** (SR-16, from §6.1 "Should have") have no FR, no swimlane, no
   channel and no owner.
6. **The Commission on Audit** has no role in the permission matrix; this design assumes
   it reads the audit log through DOST.
7. **Scholar status** (`active`, `on_leave`, `graduated`, `terminated`, `archived`): the
   SRS does not say who changes it or in what order.
8. **First sign-in for a new scholar**: the SRS says accounts are made from applicant
   emails but not how the scholar first sets a password, or whether an email is sent.
9. **Removing a checklist item** (Term Requirement) after scholars have filed against it
   is not covered by the SRS; this design assumes items are only removed before filing
   opens.
10. **Acceptance criteria for the designed requirements** (FR-REL, FR-TUI, FR-BEN,
    FR-ADM): the SRS lists them as pending; none are written here.
