# Bug Report — The Untested API

## Bug 1: Pagination skips the first page

**Location:** `task-api/src/services/taskService.js`, `getPaginated()`.

**Expected behavior:** `page=1&limit=2` should return the first two tasks, and `page=2&limit=2` should return tasks three and four.

**Actual behavior:** The implementation calculates `offset = page * limit`, so page 1 starts at index 2 and skips the first two tasks.

**How discovered:** The service test for one-based pagination exposed the incorrect slice offset.

**Fix:** Calculate the offset as `(page - 1) * limit`.

## Bug 2: Status filtering performs substring matching

**Location:** `task-api/src/services/taskService.js`, `getByStatus()`.

**Expected behavior:** A status filter should match the requested status exactly.

**Actual behavior:** `t.status.includes(status)` allows partial values such as `to` to match `todo`, even though `to` is not a valid task status.

**How discovered:** A unit test using a partial status value returned a task unexpectedly.

**Fix:** Compare with strict equality: `t.status === status`.

## Bug 3: Completing a task unexpectedly changes its priority

**Location:** `task-api/src/services/taskService.js`, `completeTask()`.

**Expected behavior:** Marking a task complete should change its completion state without silently changing unrelated task data such as priority.

**Actual behavior:** Completing a task always changes its priority to `medium`.

**How discovered:** Reviewing the business logic while writing service behavior tests.

**Suggested fix:** Remove the `priority: 'medium'` assignment unless product requirements explicitly state that completion resets priority.

## Design decision for assignment

An empty/whitespace-only assignee is rejected with HTTP 400. If a task is already assigned, the API returns HTTP 409 rather than silently overwriting the existing assignment. This makes accidental reassignment explicit and keeps the first assignment intact.
