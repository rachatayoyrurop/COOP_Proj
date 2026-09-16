---
description: 
---

# QA Test Workflow

## Objective

Perform a complete QA inspection of the PEA Meeting Room Booking System.

## Phase 1 — Project Discovery

First inspect the project without modifying code.

Identify:

* Frontend framework
* Backend framework
* Database
* Authentication mechanism
* Authorization mechanism
* User roles
* API endpoints
* Booking-related files
* Room-related files
* User-management files
* Configuration files

Do not assume anything that cannot be verified from the project.

---

## Phase 2 — Architecture Review

Analyze:

* Frontend architecture
* Backend architecture
* API architecture
* Database structure
* Authentication flow
* Authorization flow
* Booking flow

Document important findings.

---

## Phase 3 — Static Analysis

Inspect the source code for:

* Logic errors
* Validation problems
* Authentication problems
* Authorization problems
* Booking conflicts
* Duplicate submission
* Data consistency issues
* Security issues
* Error handling problems
* Race conditions
* Incorrect API usage

Do not modify code.

---

## Phase 4 — Start the Application

Determine how the project should be started.

Inspect:

* package.json
* README
* environment configuration
* backend startup configuration

Start the application only when the required environment is available.

Do not change configuration unless explicitly requested.

---

## Phase 5 — Runtime Testing

If Browser testing is available, test the running application.

Test:

1. Login
2. Logout
3. Page access
4. Role permissions
5. Booking
6. Edit booking
7. Cancel booking
8. Room availability
9. Double booking
10. Overlapping booking
11. Invalid input
12. Duplicate submission
13. Refresh
14. Browser Back/Forward
15. Direct URL access

Record actual runtime behavior.

---

## Phase 6 — API Testing

Inspect and test relevant APIs.

Check:

* Authentication
* Authorization
* Validation
* HTTP method
* HTTP status
* Request body
* Response body
* Unauthorized access
* Duplicate requests
* Invalid parameters

Pay special attention to:

* IDOR
* Privilege escalation
* Authorization bypass
* Booking conflicts

---

## Phase 7 — Security Testing

Check for:

* XSS
* SQL Injection
* IDOR
* Privilege Escalation
* Authentication bypass
* Authorization bypass
* Sensitive data exposure
* Password exposure
* Token exposure

Only perform safe security testing appropriate for the local development environment.

---

## Phase 8 — Booking Logic

Test:

* Same room / same time
* Same room / overlapping time
* Same room / adjacent time
* Different rooms / same time
* Multiple users booking simultaneously
* Duplicate submission
* Cancel and rebook
* Edit booking into an occupied time

The most important objective is to determine whether double booking can occur.

---

## Phase 9 — Edge Cases

Test unusual input and system states:

* Empty values
* Null
* Undefined
* Zero
* Negative values
* Invalid dates
* Invalid times
* Extremely long text
* Special characters
* Duplicate requests
* Empty database results
* Missing API fields

---

## Phase 10 — Report Findings

For every confirmed issue create:

BUG-ID

Title

Severity

Priority

Category

Location

Evidence Type

Root Cause

Example Scenario

Expected Result

Actual Result

Impact

Recommendation

Evidence

---

## Phase 11 — Limitations

Create a separate section for limitations.

Do not classify limitations as bugs unless there is evidence that the behavior violates a requirement.

---

## Phase 12 — Final QA Summary

Report:

Overall Status

Critical Issues

High Issues

Medium Issues

Low Issues

Limitations

Untested Areas

Top 5 Risks

Final Verdict

Use one of:

READY

READY WITH CONDITIONS

NOT READY

---

## Important

Do not fix bugs during this workflow.

The purpose of this workflow is to inspect and report.

Wait for explicit instructions before modifying source code.
