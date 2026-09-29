# Submission Note

I approached the assignment by testing the service layer directly and the HTTP API through Supertest, with the tests focused on observable behavior rather than implementation details. The test suite covers the existing CRUD, filtering, pagination, completion, statistics, validation, and the new assignment endpoint, including missing-resource and invalid-input cases.

The main issues I found were an off-by-one pagination calculation and substring-based status filtering. I fixed both and also identified an additional behavior worth clarifying before production: completing a task currently resets its priority to `medium` even though the completion operation does not document that behavior.

For the new assignment endpoint, I validate that the assignee is a non-empty string, trim surrounding whitespace, return 404 for an unknown task, and return 409 rather than silently replacing an existing assignment.

## What I would test next

- Pagination with invalid, zero, negative, and very large page/limit values.
- More date boundary cases for overdue tasks and timezone handling.
- PUT behavior for unknown fields and immutable fields such as `id` and `createdAt`.
- Repeated completion and assignment behavior.
- API-level error handling for malformed JSON and unexpected service failures.
- Concurrency behavior if the in-memory store were replaced by a database.

## What surprised me

The API was small, but several behaviors were implicit rather than documented. In particular, pagination used a one-based API convention but a zero-based array offset incorrectly, and status filtering accepted partial strings.

## Questions before production

- Should assigning an already-assigned task be rejected or should reassignment be allowed?
- Are task IDs and creation timestamps immutable on PUT?
- Should the API reject unknown fields?
- What are the exact pagination validation rules?
- Should completing a task ever change its priority?
- What authentication and authorization rules should apply to creating, updating, completing, deleting, and assigning tasks?
