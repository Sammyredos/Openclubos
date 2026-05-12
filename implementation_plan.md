# Build Multi-Step Create Tournament Flow

This plan outlines the steps required to implement the comprehensive Create Tournament wizard, including the necessary backend schema updates to support all the new fields.

## Proposed Changes

### 1. Database Schema Updates
We will update `database/prisma/schema.prisma` to include the new fields on the `Tournament` model and add necessary enums.

**New Enums:**
- `TournamentFormat` (STROKE_PLAY, MATCH_PLAY, STABLEFORD, SCRAMBLE, BEST_BALL)
- `ScoringType` (GROSS, NET)
- `TournamentVisibility` (PUBLIC, PRIVATE, INVITE_ONLY)

**New/Updated Fields on `Tournament`:**
- `description`, `bannerUrl`, `venue`, `location` (Strings)
- `registrationOpenAt`, `registrationCloseAt` (DateTimes)
- `format`, `scoringType`, `holes` (Int)
- `allowRegisteredPlayers`, `allowGuests`, `allowExternalPlayers` (Booleans)
- `hasHandicapRestriction`, `minHandicap`, `maxHandicap`
- `maxPlayers`, `maxPlayersPerGroup`, `enableWaitlist`
- `requiresPayment`, `entryFee`, `currency`, `paymentDeadline`, `isRefundable`
- `divisions` (String array or JSON)
- `autoGrouping`, `teeStartTime`, `teeIntervalMinutes`
- `enableLiveScoring`, `requireMarkerVerification`, `enableHoleScoring`
- `publishImmediately`, `visibility`

After updating the schema, we will run `npx prisma generate` and `npx prisma db push` to sync the changes.

### 2. Shared Types Update
Update `packages/types/src/index.ts` (if applicable) to export the new enums and properties so the frontend and backend can share the type definitions.

### 3. Backend DTO & Service Updates
#### [MODIFY] `apps/backend/src/modules/tournaments/dto/create-tournament.dto.ts`
Update the `CreateTournamentDto` to validate all the new fields using `class-validator`.

#### [MODIFY] `apps/backend/src/modules/tournaments/tournaments.service.ts`
Update the `create` method to correctly map the DTO to the Prisma create call and handle the auto-generated `DRAFT` status unless `publishImmediately` is true.

### 4. Frontend Wizard Implementation
#### [NEW] `apps/web-admin/components/tournaments/CreateTournamentWizard.tsx`
Build a highly interactive, responsive multi-step wizard using conditional rendering:
1. **Basic Details:** Name, Organizer, Banner, Description, Venue, Location
2. **Schedule:** Start/End Date, Registration Open/Close
3. **Format:** Format, Scoring Type, Holes
4. **Eligibility:** Player Types, Handicap Restrictions (conditional)
5. **Player Limits:** Max Players, Max Per Group, Waitlist
6. **Payments:** Requires Payment (conditional -> Entry Fee, Currency, Deadline, Refundable)
7. **Divisions:** Men, Ladies, Juniors, Professionals, Seniors
8. **Grouping:** Auto Grouping, Tee Times, Interval
9. **Scoring:** Live Scoring, Marker Verification, Hole-by-Hole
10. **Publish Settings:** Publish Immediately, Visibility

#### [MODIFY] `apps/web-admin/app/super-admin/tournaments/page.tsx`
Update the "Add Tournament" button to open the `CreateTournamentWizard` modal/overlay.
Update the frontend types to support the new fields.

## User Review Required
> [!IMPORTANT]
> The prompt mentions `organizerId` but the current schema uses `clubId`. I will assume `organizerId` maps to `clubId` in the database.
> The prompt also mentions `divisions` as `Division[]`. I will store `divisions` as a `String[]` or `Json` in Prisma for simplicity unless a new relation `Division` is specifically requested. I will use `String[]` for now (e.g. `["Men", "Ladies"]`).
> Finally, because we are altering the database schema, I will run `pnpm prisma db push` to push these changes to your local database. Please confirm if this is acceptable.

## Verification Plan
1. Ensure `prisma db push` succeeds.
2. Verify that the backend NestJS app restarts without compilation errors.
3. Test the "Add Tournament" button in the frontend.
4. Go through all 8 steps of the wizard and ensure conditional fields (like payment fields) only show when their toggle is active.
5. Create a test tournament and verify it correctly saves to the database with the `DRAFT` (or `PUBLISHED`) status.
