# Software Design Document

This folder holds the Software Design Document (SDD) for **SEIskolar**, created for
Activity 1 ("From SRS to Software Design") in the Software Design course at Cebu
Institute of Technology – University by team **Asph**.

Like the risk matrix and schedule in [`05-risk-matrix-and-gantt/`](../05-risk-matrix-and-gantt/RISK-MATRIX-AND-GANTT.md),
this deliverable plans the design rather than being built from the chain of visual
drawings, so it uses the `repo` scope.

## Deliverables in this folder

- [`SOFTWARE-DESIGN-DOCUMENT.md`](SOFTWARE-DESIGN-DOCUMENT.md): The full software design
  specification written in Markdown, structured part-by-part (Parts I to XIX) according
  to the course's SDD template.
- [`SEIskolar-Software-Design-Document.docx`](SEIskolar-Software-Design-Document.docx): The
  compiled Word document for course and LMS submission.

## What this document covers

The document transforms the system requirements into an architectural blueprint that
establishes the foundation for subsequent UML modeling (use case, class, activity,
sequence, and state machine diagrams):

1. **Part I. SRS Requirements Review:** Exhaustive inventory of all 24 Functional
   Requirements (`FR-IAM-001` through `FR-ADM-003`), 9 Non-Functional Requirements
   (`NFR-SEC-001` to `NFR-ACC-001`), User Requirements (`UR-01` to `UR-19`), System
   Requirements (`SR-01` to `SR-16`), External Interfaces, Constraints, Assumptions, and
   Acceptance Criteria (`AC-01` to `AC-07`).
2. **Parts II to VI. Functions, Actors, and Components:** Requirements-to-function
   mapping, stakeholder and entity catalog, functional grouping into 11 business modules,
   definition of 19 major components across three layers (5 presentation front ends, 11
   business logic components, 3 data stores), and detailed responsibility blocks for each.
3. **Parts VII to IX. Data and Class Architecture:** 25 data entities with CRUD and
   lifecycle definitions under an append-only audit model, followed by 31 preliminary
   classes with full attribute and operation signatures.
4. **Parts X to XII. Communication and System Architecture:** Inter-component request and
   response contracts with seven end-to-end communication flows, layered architecture with
   vendor isolation rationale, and application of seven core software design principles.
5. **Part XIII. Major System Processes:** 10 end-to-end process specifications directly
   aligned with the 10 workflow swimlanes in [`02-swimlanes/`](../02-swimlanes/README.md),
   citing all 107 swimlane steps (`S01.1` to `S10.8`).
6. **Parts XIV to XVI. Quality, Interfaces, and Object States:** NFR technical designs,
   detailed external interface protocols, and state machines for 10 core domain objects.
7. **Part XVII. Requirements-to-Design Traceability:** A comprehensive 75-row matrix
   verifying that every FR, NFR, UR, SR, and AC maps to concrete system functions,
   components, data entities, and architectural decisions.
8. **Parts XVIII & XIX. Design Specification and Review:** Synthesis of system
   architecture and design decisions, accompanied by a verified 15-point review checklist.

## Built from

- [`01-srs/SRS.md`](../01-srs/SRS.md) (version 2.2)
- [`02-swimlanes/`](../02-swimlanes/README.md) (Workflows 01 to 10)
- Course template: _SRS to Software Design Template_ (Activity 1)
