# Security Specification for HyperHost

## Data Invariants
1. A user can only access their own profile.
2. A bot can only be read or modified by its owner.
3. A file can only be read or modified by its owner.
4. Admins can read all profiles and bots.
5. `createdAt` fields are immutable.
6. `role` field in profiles can only be updated by `SUPERADMIN`.

## The Dirty Dozen (Attacks to Block)
1. Set another user's role to ADMIN.
2. Read a bot's token belonging to someone else.
3. Delete a file metadata record not owned by the user.
4. Create a bot with a massive description or script path.
5. Update a bot's status once it's in a terminal state (if we had one, but let's prevent status poisoning).
6. Forge a `createdAt` timestamp.
7. Inject a malicious script path.
8. Scrape all bots via a blanket query.
9. Impersonate another user by setting `ownerId` in a new bot document.
10. Update the `email` field in a profile.
11. Create a document in a collection not defined in the schema.
12. Flood the database with empty documents.

## Rules Generation Strategy
- `isValidUser`: Checks profile shape.
- `isValidBot`: Checks bot shape and ownership.
- `isValidFile`: Checks file metadata shape and ownership.
