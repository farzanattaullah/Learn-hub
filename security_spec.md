# Security Specification: AI Study Assistant Firestore Rules

## 1. Data Invariants
1. Students can only read, create, update, and delete their own study documents, quizzes, chat sessions, and user profiles.
2. Every document creation must enforce `request.auth.uid == incoming().userId`.
3. Updates cannot reassign resource ownership (`incoming().userId == existing().userId`).
4. Resource IDs must adhere to standard alphanumeric and hyphen patterns (`isValidId()`).
5. Default deny for all unmatched paths.

## 2. Dirty Dozen Threat Vectors
1. Spoofed User ID Injection: Attempt to set `userId` to another user's UID on create -> Denied.
2. Cross-Tenant Document Read: Attempt to fetch another student's uploaded notes -> Denied.
3. Unauthenticated Read/Write: Attempt to list documents without Auth token -> Denied.
4. Ownership Hijack on Update: Modifying `userId` on existing quiz/document -> Denied.
5. Large Junk ID Injection: Supplying 2KB document ID to exhaust resources -> Denied by `isValidId()`.
6. Blanket Read Scrape: Executing unrestricted query without `where('userId', '==', auth.uid)` -> Denied by list rule.
7. Shadow Field Injection: Adding unauthorized admin flags to student profile -> Denied.
8. Cross-User Quiz Score Tampering: Updating quiz results belonging to peer -> Denied.
9. Malformed Document Payload: Uploading non-string title or excessive payload -> Denied.
10. Orphaned Chat Creation: Chat session created with mismatched `userId` -> Denied.
11. Unauthorized Profile Deletion: Deleting another student's account record -> Denied.
12. Update Gap Attack: Sending partial update omitting identity verification -> Denied.
