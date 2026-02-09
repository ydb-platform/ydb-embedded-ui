---
name: UX design request
about: Template for issues that require product designer efforts
title: "[ux] <short use-case summary>"
labels: area/design
assignees: AlinaBelousovaUX

---

### 1. Goal and Context (The most important part!)
Goal/Problem: What business or user problem are we solving? Not "what to draw," but "why."

Example: "As a database developer using query editor I don't understand that this UI provides diagnostics modes where I can check for database parameters like cpu and storage consumption"

**Context:** Why is this task important now? Link to research, user feedback, metrics.
**Users:** Who are we doing this for? (Target audience). What main tasks will the user **solve** with this feature?

Hint: we divide our audience into the following categories:

- core developers (who contribute to YDB itself);
- ydb oncall/sre team who runs managed services and does capacity planning;
- db administrators who diagnose issues with databases, add resources, examine performance bottlenecks
- developers who write SQL queries, create schema objects, diagnose query plans
- security engnieers who review audit logs etc

**Research/Testing Needs**: If this task involves significant UX changes (e.g., new flows, complex interactions), specify required user research, interviews, or usability testing. Propose specific users/stakeholders for testing (e.g., internal Yandex Cloud users, external beta testers, or key customers). If not applicable, mark as N/A.

### 2. Detailed Task Description (What needs to be done)
Task Essence: Detailed textual description of the required outcome.

**Key Requirements:** List of specific points that must be fulfilled (functional, content, technical).
**Related Elements:** Links to related tickets, development tasks, analytics.

### 3. Corner Cases and Special States
Error States: What errors might occur? Under what conditions do they appear?

**Alternative Scenarios:** What if the user accesses an old link to deleted content?

### 4. References and Materials (Examples and Inspiration)
References: Links to design examples (from other products, sites) that illustrate the desired style, approach, or functionality. What you like and dislike about these examples.

**Internal patterns**: Links & screens to already implemented similar screens in YDB or YC products.
**Content for Layout:** Texts, images, logos that should be used. (if applicable)
**Competitor / similar product examples**: Links & screens + short comment «What to take / What to avoid» (ex: CockroachDB, ClickHouse Cloud, Snowflake etc.)

### 5. Acceptance Criteria / DoD (Definition of Done)
The ticket is considered done when all of the following are provided:

- **UX Validation**: Design solution validated with responsible stakeholders (e.g., PM, Tech Lead, devs, or UX group) via walkthrough or review session. Feedback incorporated if needed.
- **User Testing (if applicable)**: If specified in section 1, usability testing/interviews conducted with proposed users. Results documented and any critical issues addressed in the design. If not applicable, mark as N/A with justification.
- Designer walked through the prototype with PM / Tech Lead / dev (optional but strongly recommended before closing).
- All required screens / states are designed (Dark/Light theme, separate scenarios for EM and Cloud installation if applicable).
- Main happy path + all critical error / empty / loading / disabled states.
- All edge cases listed in section.
- Inspectable prototype in Figma (with clickable flows where applicable).
- Tooltips, dropdowns, modals, popovers — positioned and sized correctly.
- Responsive behavior shown for key breakpoints.
- All temporary / exploration frames moved to archive / separate page.
- Link to this ticket added to the Figma file description / cover frame.
