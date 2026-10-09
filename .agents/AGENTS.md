## Font Weight Ceiling Rule
- Never use a font-weight greater than 700 (`font-bold`, `FontWeight.w700`, `FontWeight.bold`) anywhere in the application (web admin and mobile app).
- `font-bold` (700) is the absolute upper limit for boldness. Never use `font-extrabold` (800), `font-black` (900), `FontWeight.w800`, or `FontWeight.w900`. Always use `font-bold` (700) or `font-semibold` (600) instead.

## Number Formatting Rules
- Always use the global \formatNumber\ or \formatCurrency\ utilities from \lib/utils.ts\ to format large numbers.
- When formatting millions, use lowercase 'm' (e.g. 1.5m), lowercase 'b' for billions, and lowercase 'k' for thousands.
- This applies to all major page stat cards.

## Modal Design Rules
- Follow the specific font size, weight, and modal size for all modals based on the user's reference design.
- **Modal Size**: Use a compact maximum width (e.g., `max-w-md` or `max-w-sm` in Tailwind).
- **Typography & Weights**: Unlike the general admin page rule, modals **should** use heavier font weights (`font-semibold` or `font-bold`) for Titles, Subtitles, button text, and emphasizing critical words in body text.
- **Font Sizes**: Titles should be prominent (e.g., `text-lg`), secondary headings/questions standard size (`text-base`), and description text slightly smaller (`text-sm`).

## Page Titles
Always ensure that every page has a distinct title shown in the browser tab.

1. The root `layout.tsx` must define a title template:
   ```tsx
   export const metadata: Metadata = {
     title: {
       template: "%s | Openclub Admin",
       default: "Openclub Admin",
     }
   };
   ```

2. **Server Components (`page.tsx`)**: Directly export `metadata`:
   ```tsx
   export const metadata = {
     title: "Dashboard",
   };
   ```

3. **Client Components (`page.tsx` with `"use client"`)**: Client components cannot export metadata. You MUST create a `layout.tsx` file in the exact same directory to provide the metadata:
   ```tsx
   import { Metadata } from "next";

   export const metadata: Metadata = {
     title: "Login",
   };

   export default function Layout({ children }: { children: React.ReactNode }) {
     return <>{children}</>;
   }
   ```

## Workspace Cleanup
- delete any x.py,test.tsc, fix.tsc,x.tsc,x.script and others that is not needed in my code .

## Code Review Rule
- After writing code, you must always run a syntax/type check and perform a senior-level stability review. You must then explain your corrections conceptually without using code.

## Admin UI Synchronization
- Whenever modifying features, modal states, or UI components within the `organizer-admin` directory, you must immediately verify if the equivalent file exists in the `super-admin` directory.
- Apply structural and feature changes to both views synchronously to prevent divergent user experiences.

## NextLink Button Styling
- When styling a Next.js `<NextLink>` component to look like a button, always append the `no-underline` Tailwind class to ensure default browser link decorations do not override the button aesthetics.

## Error Notification & Toaster Rules
- Never display access denial, role restrictions, server connection failures, or authentication errors as static inline banner cards inside forms or pages.
- Always display these notifications in a floating toaster across the entire app:
  - In Web Admin pages: Dispatch using `toast.error(message, { description: ... })` (Sonner).
  - In the Mobile Preview Simulator: Dispatch using `showToast(message, "error", "ACCESS DENIED (ROLE RESTRICTED)")`.
- Error toasts must feature a prominent bold uppercase heading (e.g. `ACCESS DENIED (ROLE RESTRICTED)`), a clear informative description, the `ShieldAlert` or dedicated error indicator icon, and auto-dismiss / manual dismiss capabilities.
- **No Toaster on Routine Login**: Never dispatch generic floating success toasts upon routine login (e.g., "Welcome back, admin" or "Successfully Logged into your Account"). Routine sign-in must seamlessly navigate the user directly into the Dashboard or Tournament Hub without intrusive, unpolished toast notifications. Reserve toasters exclusively for critical errors, security alerts, and explicit asynchronous actions.

## Mobile Back Button & Navigation Bar Rules
- All mobile screens (in both the Web Admin Mobile Preview Simulator and the Flutter native app) that contain a back button must strictly adhere to the unified navigation header system established by the registration/signup screen:
  - **Button Design**: Circular white pill button (`h-8 w-8 rounded-full` / `36x36`), thin subtle border (`border-slate-200` / `#E5E7EB`), soft drop shadow (`shadow-2xs`), and dark icon (`ChevronLeft` in React / `Icons.arrow_back_rounded` in Flutter, color `#0F172A` / `#374151`, size 16-18px).
  - **Horizontal Gutter Alignment**: Must always be placed at exactly `24px` (`px-6` / `EdgeInsets.symmetric(horizontal: 24)`) from the screen edges so the button aligns flush with form fields, headers, and body content beneath it. Never use default unpadded or 8px `AppBar` leading insets that break alignment.
  - **Uniform Vertical Rhythm**: Navigation bars must use a consistent `16px` (`pt-4` / `16dp`) top offset from the safe area and a standardized `44px`-`48px` navigation row height, completely preventing vertical displacement or jumping during screen transitions.
  - **Content Separation**: Maintain a standard `16px` to `24px` vertical spacing between the navigation header and the first content element (title, banner, or brand badge).

## Mobile Screen Layout, Icon Badge & Spacing Standardization Rules
- **Icon Badge Standardization**:
  - All screens featuring a hero/brand icon badge (Forgot Password, Verify Email, Check Your Inbox, Set New Password) must use an identical container footprint of **76×76px** (`w-[76px] h-[76px]` / `76x76`) with unified **squircle geometry** (`rounded-[24px]` / `BorderRadius.circular(24)`). Never use circular `rounded-full` for hero badges.
  - Container styling: soft-mint tint (`#EAF7EE` or `bg-[#EAF7EE]`), delicate border (`#C6F0DB`), and subtle elevation shadow (`shadow-xs`).
  - Core Icon Dimension: standardized at **32×32px** (or 32-36px) centered inside the badge with brand emerald color (`#009A60`).
  - Status Indicators (top-right check badge on Verify/Check Inbox): standardized **24×24px** circle (`#009A60`), 2px white border, and 14px white check icon (`Check`).
- **Screen Layouts & Alignment**:
  - **Natural Top-Anchored Screens** (Forgot Password, Verify Email, Check Your Inbox, Set New Password): All flow naturally from the upper portion below the navigation bar with standard top spacing (`pt-4` / 16px), followed by the centered badge, heading, body/inputs, and primary action buttons. Pinned footers (e.g., "Remember your password? Back to Login", "VERIFICATION EXPIRES IN 10 MINUTES") remain anchored at the bottom baseline with safe-area spacing. Never force artificial vertical middle centering.
- **Unified Spacing & Sizing Scale**:
  - **Horizontal Gutters**: Exactly **24px** (`px-6` / `EdgeInsets.symmetric(horizontal: 24)`) on all viewports, flush with the back button.
  - **Badge Spacing**: Exactly **16px-20px** top separation below the navigation row and **24px** (`mb-6` / `24dp`) bottom margin to the title.
  - **Typography Rhythm**: Title (26px font-black/bold) with **8px-10px** bottom margin. Description (13px-13.5px font-normal, 1.45 line-height, max-width 285px-300px) with **24px-28px** bottom margin.
  - **Inputs & Action Buttons**: Standardized **48px height**, **12px rounded corner radii** (`rounded-xl`), and **16px gap** between form elements.
  - **Screen Footers**: Pinned bottom footers must maintain a consistent baseline with **16px-24px** padding and safe-area alignment.

## Form Screen Width Standardization & Multi-Device Container Rules
- All screens containing form elements, credential inputs, or authentication flows (Login, Registration Steps 1-4, Forgot Password, Set New Password / Reset Password, Verify Email OTP, Check Your Inbox):
  - **Standardized Maximum Width**: Must strictly use `w-full max-w-sm mx-auto` (384px maximum width, horizontally centered) in Web Preview, and `BoxConstraints(maxWidth: 440)` with `Center()` in Flutter native screens. This prevents forms from stretching excessively when viewed on tablets (iPad Pro, iPad Mini, Galaxy Tab) or larger viewports.
  - **Header & Progress Bar Alignment**: Navigation headers, progress indicators (e.g., Step 1 of 4, 4-segment progress bars), and back buttons must also be enclosed within `w-full max-w-sm mx-auto` so that the navigation elements align flush with the centered form card rather than drifting to the outer display edges on wide screens.
  - **Scrollable Form Body & Content**: The scrollable body (`flex-1 overflow-y-auto`) must wrap its form fields, headings, social auth buttons, and primary action buttons inside `w-full max-w-sm mx-auto` with `space-y-3.5` or `space-y-4`.
  - **Bottom Sheet Modals**: All bottom sheets and selector modals (e.g., Select Home Golf Club, Select Player Classification, Country Picker, State Picker, City Picker, Menu Drawer, Settings & Preferences, Bookings, Active Players, Tournament Filters, Forfeit Dialog, Unfriend/Block/Report Modals) must display full width across tablet screens (using `${isTablet ? "" : "max-w-sm mx-auto"}` in Web Preview, and full width in Flutter) rather than being constrained with side margins on tablets.
  - **Category Filter Pills Centering**: Category filter pills (e.g. "All", "Ongoing", "Upcoming", "Completed") across tournament screens must be centered horizontally on both mobile and tablet viewports while preserving horizontal scrollability when overflow occurs.

## In-App Input Styling Rules
- All form inputs, search fields, credential inputs, and modal search bars across mobile screens and modals (including Add Golf Friends search, Country/State/City pickers, and authentication inputs) must strictly use the unified soft-mint background `bg-[#f5faf6]` (`Color(0xFFF5FAF6)` in Flutter) with a subtle mint border `border-[#e1efe5]` (`Color(0xFFE1EFE5)` in Flutter).
- Input focus states must apply `focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20` and remove default browser outlines with `focus:outline-hidden`.
- Input text must use dark slate `text-[#0F172A]` and placeholder text must use `placeholder:text-[#8CA0BA]`.
- Never use generic gray `bg-slate-50` or `border-slate-200` for in-app inputs.

## Mobile Screen Background Color Standardization
- All mobile screens across the mobile application (in both the Web Admin Mobile Preview Simulator and the Flutter native app) must strictly use the unified daylight background color established by the Competitor Profile & Tournament Hub home screen:
  - **Color Value**: `#F4F6F3` (`bg-[#f4f6f3]` in Tailwind CSS / `const Color(0xFFF4F6F3)` in Flutter).
  - **Application**: Must be applied to the primary screen outer container / `Scaffold(backgroundColor: const Color(0xFFF4F6F3))` as well as background wrappers across all mobile screens (including Notifications, Add Friends, Leaderboard, Tournament Details, etc.).
  - **Top Navigation Bars**: Pinned/fixed top navigation header bars retain their former crisp white background (`bg-white` in Tailwind CSS / `Colors.white` in Flutter) with subtle bottom borders (`border-b border-slate-100` / `border-slate-200/60` / `Color(0xFFF1F5F9)`), providing clear optical anchoring above the daylight scrollable body.
  - **Contrast Separation**: Distinct from the soft-mint input background `bg-[#f5faf6]` (`Color(0xFFF5FAF6)`) and pure white cards (`bg-white` / `Colors.white`), ensuring a clean, elevated daylight appearance throughout the mobile experience. Never use pure white (`bg-white` / `Colors.white`) or blue-tinted grays (`bg-[#F8FAFC]` / `Color(0xFFF8FAFC)`) for overall screen backgrounds.

## Segmented Control & Filter Tab Pill Rules
- All segmented controls, range selectors, and status filter tab bars across the application (Dashboard Trends filters, Payments & Withdrawal status tabs, Transactions tabs):
  - **Container Styling**: Must strictly use the soft-mint background `bg-[#f5faf6]` with subtle mint border `border border-[#e1efe5]`. Never use cool slate `bg-slate-100` or gray containers.
  - **Active White Pill Border**: The active tab must always be an elevated white pill card (`bg-white shadow-xs` or `shadow-sm`) and MUST include the subtle mint border `border border-[#e1efe5]` around the white card.
  - **Inactive Pill Border**: Inactive tabs must apply `border border-transparent` to prevent 1px layout shift during selection state transitions.
  - **Active Typography**: Dark slate or brand emerald (`text-slate-900` or `text-openclub-700`) with medium or semibold weight (`font-semibold` or `font-medium`). Inactive tabs use `text-slate-500 hover:text-slate-900 font-medium`.

## Mobile Button Typography & Capitalization Rules
- **Universal Capitalize Text Transform**: All interactive action buttons, CTAs, submit triggers, navigation controls, and state indicator buttons throughout the mobile application (in both the Web Admin Mobile Preview Simulator and the Flutter native app) must strictly use **Capitalized letters** (`capitalize` / Title Case, e.g., `Join Tournament`, `View Info`, `Register Now`, `Registration Closed`, `Official Registration Closed`, `Apply Filters`, `Clear Search & Filters`, `Reset All`, `Sign In`, `Verify Email`, `Continue to Contact →`, `Resend Code`).
- **No All-Caps or All-Lowercase on Mobile Buttons**: Never use all-uppercase uppercase (`JOIN TOURNAMENT`) or all-lowercase (`join tournament`) for action button text in mobile views. Buttons must consistently use `capitalize` styling.
- **Optical Typography Scale & Weights**: Button typography should combine semibold or bold font weights (`font-semibold` or `font-bold`) with normal tracking (`tracking-normal`) for clean, elegant readability on mobile screens.
- **Icon Alignment**: Trailing icons (such as `ArrowRight`) and leading icons (such as `CalendarPlus` or `Share2`) must maintain vertical optical centering with capitalized button labels.

## Cancel Button Styling Rules
- All Cancel buttons across mobile bottom sheets, modals, confirmation dialogs, and forms must strictly use a subtle red background tint with soft red borders:
  - **Styling**: `bg-red-50 hover:bg-red-100 border border-red-200/70 text-red-600 active:scale-[0.98]` (`Color(0xFFFEF2F2)` background, `Color(0xFFFECACA)` border, `Color(0xFFDC2626)` text in Flutter).
  - Never use generic gray `bg-[#F1F5F9]` or white borders for Cancel buttons.
  - Cancel buttons must strictly use `capitalize` styling (e.g. `Cancel`, `Cancel, Stay in Play`, `Cancel, Keep Friend`, `Cancel, Keep Unblocked`).

## Section Eyebrow Label & Inter-Section Spacing Standardization Rules
- **Section Eyebrow Typography**: All section eyebrow headers, filter category titles, and detail tab section labels across the application (e.g., `ABOUT THE EVENT`, `COURSE SPECS`, `LOCATION & PROXIMITY`, `HOST GOLF CLUB`, `WHEN`, `EVENT TYPE`, `GAME FORMAT`, `ENTRY FEE`, `YOUR HANDICAP RANGE`, `TOURNAMENT SCHEDULE`, `ORGANIZER`, `COMPETITION RULES`, `REGISTERED PLAYERS`, `OFFICIAL PURSE & HONORS`):
  - Must strictly use `text-[11px] font-bold tracking-[0.14em] text-[#64748B] uppercase block` (`Color(0xFF64748B)` in Flutter).
  - Never use low-contrast `#8CA0BA`, lighter font weights, unspaced tracking, or mixed casing for section eyebrow labels.
  - **Label Bottom Margin**: Maintain a uniform `12px-14px` (`mb-3` or `mb-3.5`) bottom separation to the input, control, or card grid below it.
- **Inter-Section Vertical Rhythm**:
  - Major section groups in forms, sheets, and filter modals must strictly maintain a generous vertical spacing of `28px` to `32px` (`space-y-7` or `space-y-8` in container layout) to provide distinct optical separation between sections.
  - Never collapse major sections together with cramped 16px (`space-y-4`) spacing.

## Faint Green Metric & Spec Display Background Standardization Rules
- **Display Card Backgrounds**: All tournament metric cards (`ENTRY FEE`, `DURATION`, `FORMAT`) and course spec summary cards (`PAR`, `HOLES`, `HCP LIMIT`):
  - **Color & Border**: Must strictly use the soft-mint faint green background `bg-[#f5faf6]` (`Color(0xFFF5FAF6)` in Flutter) paired with delicate border `border border-[#e1efe5]` (`Color(0xFFE1EFE5)` in Flutter) and zero shadow (`shadow-none`).
  - **Internal Dividers**: Multi-column spec displays (e.g., `PAR | HOLES | HCP LIMIT`) must use matching subtle dividers `divide-[#e1efe5]` (`Color(0xFFE1EFE5)` in Flutter).
  - Never use generic off-white `bg-[#F8F9FA]`, cool gray `bg-slate-50`, or bright pure white containers for these spec and metric displays.

## Tournament Players Tab Card Standardization Rules
- **Player Card Data Display**: On the tournament details `PLAYERS` tab (in both the Web Admin Mobile Preview Simulator and the Tournament details page):
  - **Container & Geometry**: Fainted green background `bg-[#f5faf6]` (`Color(0xFFF5FAF6)` in Flutter), replicated friend request card border radius `rounded-2xl` (`BorderRadius.circular(16)` in Flutter), delicate border `border border-[#e1efe5]` (`Color(0xFFE1EFE5)` in Flutter), compact padding `p-3.5`, and soft drop shadow `shadow-2xs` (`shadow-xs` / `shadow-2xs`).
  - **Avatar & Verification Indicators**: Avatar image with initials fallback, bottom-right 16px green check status indicator badge (`w-4 h-4 rounded-full bg-[#009A60] border-2 border-white`), and a right-anchored green `Verified` pill badge with reduced font size (`px-2.5 py-0.5 rounded-full bg-[#EAF7EE] border border-[#C6F0DB]/80 text-[10.5px] font-bold text-[#009A60] capitalize`).
  - **Typography & Subtitle Layout**: Player name in dark slate (`text-[14.5px] font-bold text-[#0F172A] leading-tight`). Subtitle displays `{player.club} | {player.hcp} HCP` with the club name truncated, separated by a light slate demarcation pipe `|` (`mx-1.5 text-slate-300 font-normal shrink-0`) and handicap index (`shrink-0 font-medium text-[#64748B] text-[12px]`).

## Tournament Rules Tab Standardization Rules
- **Header**: Section eyebrow label `COMPETITION RULES` using `text-[11px] font-bold tracking-[0.14em] text-[#64748B] uppercase block mb-4`.
- **List Layout & Geometry**: Clean list structure with `space-y-5` vertical rhythm directly on the daylight body (no heavy enclosing card borders or dividers).
- **Numbered Badge Indicator**: Standardized circular badge `w-7 h-7 rounded-full bg-[#EAF7EE] text-[#009A60] font-bold text-[12px] flex items-center justify-center shrink-0 mt-0.5` displaying zero-padded numbers (`01`, `02`, `03`).
- **Rule Typography**: Bold dark slate `text-[14.5px] font-bold text-[#0F172A] leading-snug` with `gap-3.5` optical separation from the numbered badge.

## Mobile Screen Horizontal Margin & Padding Standardization Rules
- **Content Card Columns, Feeds & Metric Displays (Home Screen & All Mobile Screens)**:
  - All content card lists, interactive action cards, telemetry displays, course spec grids, notifications feeds, friends lists, and leaderboard tables across the application must strictly replicate the **16px horizontal margin/padding** (`px-4` in Tailwind CSS / `EdgeInsets.symmetric(horizontal: 16)` in Flutter) established by the Home screen (`hub`):
    - **Home Screen (`hub`)**: Header content, dual floating cards (`Book a Pro`, `HCP`), Playing Now section, OpenClubOS system promo card, Featured Tournaments carousel, and Rounds list sections all maintain a consistent `px-4` horizontal gutter inside `w-full max-w-sm mx-auto`.
    - **Tournaments Screen (`tournaments`)**: Category filter pills (`px-4`), featured event hero card (`mx-4`), and tournament card lists (`px-4`) all align flush at 16px.
    - **Tournament Details Screen (`tournament-details`)**: Body content container wraps metric cards (`ENTRY FEE`, `DURATION`, `FORMAT`), course specs, description, schedule, registered players, and prize cards strictly at `px-4 pt-5` inside `w-full max-w-sm mx-auto` (matching `tournaments/[id]/page.tsx`'s `px-4 sm:px-0 pt-5`).
    - **Notifications Screen (`notifications`)**: Scrollable feed wraps all notification cards and friend request cards strictly at `px-4 py-3` inside `w-full max-w-sm mx-auto`.
    - **Add Friends Screen (`add-friends`)**: Scrollable body wraps contact sync banner and golfer search cards strictly at `px-4 py-4` inside `w-full max-w-sm mx-auto`.
    - **Player Scorecard Screen (`player-scorecard`)**: Scrollable body wraps telemetry radar card and 18-hole scorecards strictly at `px-4 py-3.5` inside `w-full max-w-sm mx-auto`.
    - **Leaderboard Screen (`leaderboard`)**: Scrollable body wraps course summary strip and standings table strictly at `px-4 pt-3`.
  - **Navigation Bars vs. Content Cards**: Top fixed navigation bars with a circular back button maintain `px-6` (24px) for optical back-button margin, while scrollable body card columns consistently use `px-4` (16px) for maximum content readability and uniform card geometry across all screens.
  - **Authentication & Credential Forms**: Full-width credential input fields (Login, Register Steps 1-4, Forgot Password, Reset Password, Verify OTP, Sync Contacts) use `px-6` (24px) flush with the 24px back button per the Form Screen Width Standardization rules.

## Mobile Card Border Radius & Box Shadow Standardization Rules
- **Universal Mobile Card Geometry**: All content cards, feed cards, search result cards, and interactive item containers across the mobile application (including Tournament cards, Add Friends player cards, Incoming/Outgoing request cards, Registered Competitor cards, and "Show More" disclosure buttons):
  - **Border Radius**: Must strictly use `rounded-2xl` in Tailwind CSS (`16px` / `border-radius: 1rem` / `BorderRadius.circular(16)` in Flutter). Never use `rounded-[26px]`, `rounded-3xl`, or inconsistent radii for standard cards.
  - **Elevation Box Shadow**: Must strictly use `shadow-2xs` in Tailwind CSS (`box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)` / subtle 1-2px blur elevation in Flutter). Never use heavy floating shadows like `shadow-[0_4px_20px_rgba(0,0,0,0.04)]` or `shadow-md` on standard list cards.
  - **Card Border**: Delicate slate border `border border-slate-200/90` with hover state `hover:border-slate-300` (or `border border-[#e1efe5]` for faint-green spec cards).
  - **Card Padding**: Standardized `p-3.5` compact internal gutter.

## Tournament Title Adaptive Fit & Orphan-Free Wrapping Rules
- **Zero Ellipsis Truncation**: Tournament titles in discovery cards must NEVER use `truncate` or single-line ellipsis clipping (`'...'`).
- **Shrink-to-Fit Adaptive Sizing Scale**:
  - `length <= 20 chars`: `text-[14.5px] font-bold text-[#0F172A] tracking-tight leading-snug`
  - `length 21–28 chars`: `text-[13.5px] font-bold text-[#0F172A] tracking-tight leading-snug`
  - `length 29–36 chars`: `text-[12.5px] font-bold text-[#0F172A] tracking-tight leading-snug` (enables titles like "Openclub Golf Club 18 Tournament 2" to fit on a single horizontal line)
  - `length > 36 chars`: `text-[12px] font-bold text-[#0F172A] tracking-tight leading-snug`
- Orphan Prevention (\u00A0 Non-Breaking Space):
  - When titles wrap onto two lines, single dangling numbers or words (e.g. a lone 2 or 2024) must NEVER wrap alone.
  - The space before the final word/number is bound with a non-breaking space (\u00A0), ensuring the preceding word moves to the second line alongside the number (e.g., "Tournament 2").

## Dynamic Domain & Origin Resolution Standard (No Hardcoded Domains)
- **Zero Hardcoded Application Domains**: Never hardcode domains such as `https://openclub.app`, `openclubos.com`, `example.com`, or explicit URLs in frontend or mobile source code. The official production domain is subject to change or multi-environment routing (development, staging, preview deployments, native devices).
- **Automated Dynamic Origin Detection**:
  - In Web / Next.js: Always resolve the base URL dynamically using `typeof window !== "undefined" && window.location.origin ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "")`.
  - In Flutter / Dart: Always resolve dynamic origin via `kIsWeb ? Uri.base.origin : (String.fromEnvironment('APP_URL', defaultValue: ApiClient.resolveBaseUrl().replaceAll('/api', '')))`.
  - For shareable deep links, QR code payloads, and referral invites, always build URLs using this dynamic origin resolver (`${getAppOrigin()}/invite/...` or `${getAppOrigin()}/tournaments/...`).

## Real Database Social Profiles & Zero Synthesized Placeholders
- **No Synthesized Golfer Identifiers**: Never synthesize placeholder names like `Golfer <hex-hash>` (e.g. `Golfer 01a0c4`) or hardcode generic fallback club/handicap numbers when rendering accepted friends, friend requests, or tournament competitors.
- **Authoritative Database Profile Hydration**:
  - All accepted friends must be authoritatively stored with complete user profiles (`id`, `name`, `email`, `handicap`, `club`, `profilePhoto`) received from `GET /friends`.
  - The rich user profiles must be cached in user-scoped local storage (`openclub_db_friends_records_<userId>`) and merged directly into active competitor states (`golfCompetitors`) so search queries, cards, friend lists, and modal action sheets immediately display authentic player names, authentic handicaps, and verified club affiliations.
  - When accepting a friend request in the UI, the accepted sender's rich metadata must be immediately recorded into active friend records in real time.

## Production QR Scanner Terminology (Zero "Test Scan" Phrasing)
- **Zero Test/Demo Scan Wording**: Never use "test scan", "demo scan", or testing jargon in any user-facing mobile interfaces, modals, or camera viewfinders.
- **Production-Grade Copy**: Always use clear, professional instructions:
  - Header subtitle: "Point camera at golfer's QR code on course" or "Scan golfer's QR code on course".
  - Frame badge: "Align golfer's QR code inside frame".

## Universal Mobile Text Capitalization Standard
- **Comprehensive Mobile Capitalization**: All text across the mobile application (in both the Web Admin Mobile Preview Simulator and the Flutter native app)—including action buttons, CTAs, headings, card titles, subtitles, category tabs, filter pills, and navigation links—must strictly apply `text-transform: capitalize;` / Title Case styling.
- **Protected Elements**: Input fields (`<input>`, `<textarea>`), authentication forms, code blocks, monospaced text, and section eyebrow headers (`.uppercase`) must remain exempt from auto-capitalization to preserve exact credential inputs, emails, and design-standard eyebrow typography.
