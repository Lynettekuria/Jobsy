# Security Specification: JobAgent AI

## Data Invariants
1. A user can only read and write their own profile, preferences, schedules, executions, and applications.
2. The `userId` in the document path MUST match the `request.auth.uid`.
3. Timestamps like `createdAt` or `timestamp` must be validated against `request.time`.
4. Enums for `status` and `frequency` must be strictly enforced.

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Attempt to create a profile for another user.
   - Path: `/users/victim_uid`
   - Payload: `{ name: "Attacker", email: "attacker@evil.com" }`
   - Result: PERMISSION_DENIED

2. **Preference Hijacking**: Attempt to read another user's job preferences.
   - Path: `/users/victim_uid/preferences/main`
   - Result: PERMISSION_DENIED

3. **Schedule Injection**: Attempt to create a schedule for another user.
   - Path: `/users/victim_uid/schedules/bad_sched`
   - Payload: `{ role: "Hacker", frequency: "hourly", active: true }`
   - Result: PERMISSION_DENIED

4. **Status Malware**: Attempt to update an execution log's status to an invalid value.
   - Path: `/users/my_uid/executions/exec_1`
   - Payload: `{ status: "hacked" }`
   - Result: PERMISSION_DENIED

5. **Resource Exhaustion (ID Poisoning)**: Attempt to create a document with a massive ID.
   - Path: `/users/my_uid/applications/` + "A" * 2000
   - Result: PERMISSION_DENIED (via size check)

6. **Timestamp Spoofing**: Attempt to set a `createdAt` date in the future.
   - Path: `/users/my_uid/schedules/sched_1`
   - Payload: `{ role: "VA", frequency: "daily", active: true, createdAt: "2099-01-01T00:00:00Z" }`
   - Result: PERMISSION_DENIED

7. **PII Leakage**: Attempt to list all users' profiles.
   - Path: `/users`
   - Result: PERMISSION_DENIED

8. **Shadow Field Injection**: Attempt to add an `isAdmin` field to a profile.
   - Path: `/users/my_uid`
   - Payload: `{ ..., isAdmin: true }`
   - Result: PERMISSION_DENIED (via hasOnly)

9. **Terminal State Break**: Attempt to modify a 'success' execution log.
   - Path: `/users/my_uid/executions/exec_1` (already exists with status: 'success')
   - Payload: `{ status: 'failure' }`
   - Result: PERMISSION_DENIED

10. **Type Mismatch**: Attempt to send a list instead of a string for a role.
    - Path: `/users/my_uid/schedules/sched_1`
    - Payload: `{ role: ["Hacker"], ... }`
    - Result: PERMISSION_DENIED

11. **Malicious Query Scraping**: Attempt to query all applications where `status` is 'Sent' without a `userId` filter.
    - Result: PERMISSION_DENIED (enforced by rule-side resource check)

12. **Orphaned Execution**: Attempt to create an execution log for a schedule that doesn't exist.
    - Result: PERMISSION_DENIED (via exists check)
