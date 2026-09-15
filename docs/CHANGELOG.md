# Changelog

Notable changes to FitDiary. Entries describe behavior as it exists in the product.

## 2026-09-15

### Added

- **Persistent, date-aware diary.** Every tracked day is stored and read back for the signed-in user: meals, water, weight, and exercise are real records rather than seeded placeholder values, and the dashboard totals are derived from the selected day's data. Day boundaries are handled consistently in UTC.
- **Diary as its own surface.** `/diary` is a dedicated page with day navigation, food search and selection, manual entry, and persisted edit and delete.
- **Progress as its own surface.** `/progress` shows a bounded weight history (last 90 days by default) with summaries and persisted create, edit, and delete.
- **Foods and Settings surfaces.** Custom foods can be created and removed; profile and daily goals can be updated. Both pages handle loading, empty, saving, and error states.
- **Private meal photos.** A diary entry can carry a meal photo that is uploaded, viewed, and deleted only by its owner. Photos are capped at 5 MiB and must be a genuine JPEG, PNG, or WebP by both declared type and file signature. Files are stored outside any public path, under a per-user directory with randomly generated names and restrictive permissions. Retrieval is owner-checked and served `private, no-store`, and no durable public photo URL is issued. Deleting a diary entry also deletes its photo.
- **Day summary endpoint.** A single authenticated request returns the totals, goals, remaining calories, diary entries, and latest weight needed to render a day.

### Changed

- **Dashboard uses real data.** The protected dashboard previously rendered fixed sample totals; it now reads the selected day from the API and writes through the same forms used on the dedicated surfaces.
- **Login accepts username or email.** Accounts are reachable by either the unique username or the verified email address, and the sign-in form reflects this.
- **Mobile navigation.** The mobile product navigation lays out as a three-column grid so every label stays readable, and logout is placed in the page header on the dashboard and on its own row on the other pages. Dashboard section items are real links.
- **Diary JSON exposes `hasPhoto`.** API responses signal whether a photo exists instead of returning internal storage keys.

### Fixed

- **Editing a diary entry no longer discards its other items.** An edit replaces the item being changed and preserves the rest of the entry.
- **Food data is taken from the trusted record.** When a diary entry references an existing food, nutrition values are copied server-side from that food, and client-supplied snapshot values are ignored. Only the user's serving amount is accepted from the request.
- **Food references are checked.** A referenced food must be the user's own custom food or a verified global food; unknown, unverified, and other users' foods are rejected.
- **Photo replacement and deletion are reliable.** Concurrent photo mutations on the same entry are serialized, interrupted uploads are cleaned up, a failed cleanup restores the previous state instead of losing it, and a deletion that cannot remove the file reports an error rather than silently leaving the record inconsistent.
- **Meal photos render in the app.** The photo response now permits the web app's origin to embed it. Previously the browser refused the image, so a successfully uploaded meal photo appeared broken; upload and retrieval were working, but the picture was never painted.

### Security

- **Meal photo analysis stays off.** No AI or third-party request is triggered by saving or uploading. The previous `/analysis` endpoint is removed and returns 404, and analysis is reported as disabled.
- **Accounts require email verification before they exist.** Registration creates an expiring pending record holding only an Argon2id password hash and a hashed verification token; the account is created when the emailed link is consumed. Registration responses stay generic so account existence is not disclosed, registration is rate limited by source IP, username, and email, and a failed email delivery removes the pending record so an identity cannot be reserved.
- **Sessions are revocable** and password recovery is available. Verification, recovery, and delivery logging never record secrets, passwords, raw tokens, or recipient addresses.

## Earlier

Initial work covered the authentication experience, sign-up, email verification, password recovery, and the database schema. An earlier pre-account verification-token table was retired in favour of the pending-registration model described above.
