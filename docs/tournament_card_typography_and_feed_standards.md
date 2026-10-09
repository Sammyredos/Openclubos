# Mobile App Tournament Card Typography & Feed Standards

## 1. Scope & Overview
This document standardizes the visual typography, layout boundaries, and data hydration rules for tournament cards and detail views across the OpenclubOS mobile application (both within the Web Admin Mobile Preview Simulator and Flutter native codebase).

---

## 2. 3-Column Metric Telemetry Row Standards (Next Events Card)
To eliminate typographical dissonance and ensure optical rhythm across metric cards:

- **Eyebrow Labels (`ENTRY FEE`, `HANDICAP`, `DURATION`)**:
  - **Font Size**: `9.5px` (`text-[9.5px]`).
  - **Font Weight**: `font-bold` (700 ceiling).
  - **Letter Spacing**: `0.12em` (`tracking-[0.12em]`).
  - **Text Transform**: `uppercase`.
  - **Spacing**: `mb-1.5` bottom margin to value.
  - **Wrap Behavior**: `whitespace-nowrap`.
  - **Color**: `#64748B`.

- **Primary Metric Values**:
  - **Unified Baseline Size**: Exactly `12.5px` (`text-[12.5px] font-bold`) across all 3 columns.
  - **Single-Line Containment**: `leading-none whitespace-nowrap block`.
  - **Secondary Metric Unit (`All HCP`, `HCP`)**: `9.5px` (`text-[9.5px] font-semibold text-[#64748B] ml-1 whitespace-nowrap`).
  - **Dividers**: Thin vertical hairlines (`w-px h-6.5 bg-slate-200/80 self-center shrink-0`).

---

## 3. Tournament Title Full Visibility & Adaptive Sizing (Zero '...' Truncation & Orphan-Free)
- **Defects Addressed**:
  1. Premature truncation: using `truncate` clipped titles into ellipses (e.g., *"Openclub Golf Club 18 Tourna..."*).
  2. Typographical orphans: lone numbers or short words wrapping alone onto a second line (e.g. `2` sitting isolated under *"Openclub Golf Club 18 Tournament"*).
- **Dual Solution (Shrink-to-Fit One Liner + Orphan Prevention)**:
  - **Shrink-to-Fit Adaptive Sizing Scale**:
    - `length <= 20 characters`: `text-[14.5px] font-bold text-[#0F172A] tracking-tight leading-snug`
    - `length 21–28 characters`: `text-[13.5px] font-bold text-[#0F172A] tracking-tight leading-snug`
    - `length 29–36 characters`: `text-[12.5px] font-bold text-[#0F172A] tracking-tight leading-snug` (enables titles like "Openclub Golf Club 18 Tournament 2" to fit cleanly on a single horizontal line)
    - `length > 36 characters`: `text-[12px] font-bold text-[#0F172A] tracking-tight leading-snug`
  - **Orphan Prevention (`formatBalancedTitle` with `\u00A0`)**:
    - Replaces the space before the final word/number with a non-breaking space (`\u00A0`).
    - If a wrap occurs, the preceding word (e.g. *"Tournament"*) is pulled to the next line together with *"2"*, completely preventing isolated dangling digits or words.
  - **CSS Text Balance**: Uses `[text-wrap:balance]` for natural, visually balanced multi-line distribution across all browsers.

---

## 4. Strict Database-Driven Tournament Feed Exclusivity & Natural Daylight Empty State
- **Rule**: Never render static or dummy mock tournament records on the mobile tournament screen.
- **Implementation**:
  - Removed all hardcoded `fallbackTournaments` arrays.
  - Dynamic tournament feed maps strictly from database synchronization (`dynamicFromDb` derived from `liveTournaments`).
  - When the database is cold or search/filter results are empty, a clean empty state is displayed directly on the screen's daylight background (`#F4F6F3`) using `py-10 px-4 text-center` without any enclosing artificial white card box (`bg-white`), borders, or box shadows.

---

## 5. Ordinal Date Formatting & Space Management
- **Rule**: Date strings on featured tournament hero cards must preserve and display ordinal suffixes (`7th`, `th`, `st`, `nd`, `rd`) for calendar days.
- **Year Suppression**: Strips redundant calendar year strings (e.g. `, 2024`, `, 2025`) in compact badges to prevent ellipsis truncation.
- **Typography Scale**: Standardized at `10.5px` font-bold with `whitespace-nowrap truncate` alongside a `28x28px` (`w-7 h-7`) icon badge container.

---

## 6. Course Spec Handicap Metric Containment
- **Rule**: The `PAR | HOLES | HCP LIMIT` specification card on tournament detail views must keep `Open All HCP` (or any handicap range) on a single horizontal line.
- **Container**: `flex items-baseline justify-center gap-1 whitespace-nowrap overflow-hidden px-0.5`.
- **Primary Value (`Open` or Numeric Range)**:
  - Text-based or long values: `text-[16px] font-bold text-[#0B1B2B] leading-none shrink-0`.
  - Short numeric values: `text-[20px] font-bold text-[#0B1B2B] leading-none shrink-0`.
- **Unit (`All HCP` / `HCP`)**: `text-[10px] font-semibold text-[#64748B] whitespace-nowrap shrink-0`.

---

## 7. Lazy Disclosure "Show More" Button (Batched by 5 Tournaments)
- **Trigger**: Appears after every 5 tournament card displays whenever additional tournaments remain in the feed.
- **Card Geometry & Styling**:
  - Container: `w-full py-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:bg-[#EAF7EE] hover:border-[#C6F0DB] transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 mt-1`.
  - Icon: `<ChevronDown className="w-4 h-4 stroke-[2.5]" />` in brand emerald `#009A60`.
  - Text: `text-[13px] font-bold text-[#009A60]` displaying dynamic count: `Show More (${remainingCount} remaining)`.
- **Behavior**: Clicking expands the feed by +5 tournaments, updating the remaining count badge until all tournaments are revealed.

---

## 8. Card Border Radius & Shadow Standardization (Tournament Cards & Player Cards)
- **Border Radius Specification**:
  - **Tailwind CSS**: `rounded-2xl` (16px / `border-radius: 1rem`).
  - **Flutter Native**: `BorderRadius.circular(16)`.
- **Elevation Box Shadow**:
  - **Tailwind CSS**: `shadow-2xs` (soft subtle daylight drop shadow).
  - **Flutter Native**: Soft box shadow with 1px–2px blur and low opacity (`Color(0x0A000000)`).
- **Application Contexts**:
  - Tournament entry discovery cards on mobile Tournaments screen (`nextEvents` list).
  - Add Golf Friends search list cards (`targetScreen === "add-friends"`).
  - Incoming and outgoing friend request confirmation cards.
  - Tournament registered player list cards (`PLAYERS` tab on tournament details).
- **Accompanying Token Geometry**:
  - Subtle border: `border border-slate-200/90 hover:border-slate-300`.
  - Padding: `p-3.5` compact padding.

---

## 9. Topographic Fairway Elevation Watermark & Deep Green Hero Pattern
- **Design Pattern**: Topographic fairway contour elevation SVG with smooth Bezier curves, dashed elevation contours, and concentric green elevation rings.
- **Deep Green Featured Hero Cards**:
  - Background: Deep forest green `#052417` (`bg-[#052417]` with gradient `from-[#062c1d] via-[#052417] to-[#02180f]`).
  - Topographic Contours: High-vibrancy emerald curves (`stroke="#10B981"` with opacity 0.45–0.65).
  - Subtle Texture: Tournament banner image layered with 15% opacity and luminosity blend.
  - Border: Subtle emerald border (`border border-[#10B981]/25`).
  - Corner Geometry: `rounded-[22px]` smooth squircle.
- **White Tournament Discovery Cards (5 Pure Topographic Curve Variants - Zero Dots/Discs)**:
  - Each tournament card displays a unique, deterministic golf course vector pattern based on its ID and index (`renderTournamentCardWatermark`), strictly composed of graceful fairway elevation contour lines with zero circular discs, dots, or fill artifacts:
    - **Variant 0 (Sweeping Fairway Contours)**: Four sweeping elevation curves flowing gracefully from bottom-left across to the upper right.
    - **Variant 1 (Rolling Greens & Gentle Slopes)**: Undulating hill contours across the upper quadrant with terraced valley strokes below.
    - **Variant 2 (Diagonal Ridges & Terraced Valleys)**: Cascading diagonal contour lines sweeping across the card body.
    - **Variant 3 (Meandering Fairway S-Curves)**: Dynamic S-curving organic fairway boundaries with alternating dashed wave rhythms.
    - **Variant 4 (Coastal Links Horizon & Crest Arcs)**: High-arched horizon curves paired with crest arcs.
  - Watermark SVG: Faint, luxury mint watermark (`stroke="#009A60"` with opacity 0.05–0.08, all strictly `fill="none"`).
  - Background: Pure daylight white `bg-white` with `overflow-hidden`.
  - Content Layering: All titles, badges, and controls enclosed in `relative z-10` to guarantee high contrast and zero legibility interference.

---

## 10. Tournament Card Action Button Standards: Details vs Register
- **Primary Info Trigger**: Replaced generic "View Info" with "Details".
- **Visual Styling**:
  - **Details Button**: `flex-1 h-[38px] rounded-xl bg-slate-100/90 hover:bg-slate-200/90 active:scale-[0.98] text-slate-800 font-bold text-[12.5px] border border-slate-300/90 hover:border-slate-400 flex items-center justify-center gap-1.5 capitalize tracking-normal transition-all cursor-pointer shadow-2xs`.
  - **Slight Colored Dark Border**: Explicitly framed with `border border-slate-300/90` to anchor the button optically against both the white card body and the faint contour watermark.
  - **Register CTA Button**: Emerald action pill (`bg-[#009A60] hover:bg-[#008251] text-white`).
  - **Unified Arrow Indicator**: Standardized on `ChevronRight` (`w-4 h-4 text-white`) across both featured hero cards and white discovery cards, providing a consistent directional cue and visual rhythm across all tournament registration triggers.
