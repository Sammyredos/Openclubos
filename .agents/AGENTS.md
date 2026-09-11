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
  - **Pinned Screen Footers**: Pinned bottom footers (e.g., "Remember your password? Back to Login", "New to OpenclubOS? Create Player Account", "VERIFICATION EXPIRES IN 10 MINUTES", device session disclaimers) must maintain `w-full max-w-sm mx-auto` to remain centered directly beneath the form column.
  - **Bottom Sheet Modals**: All bottom sheets and selector modals (e.g., Select Home Golf Club, Select Player Classification, Country Picker, State Picker, City Picker) must apply `w-full max-w-sm mx-auto` to their inner sheet card container (`bg-white rounded-t-[28px]`) so they display as a clean, properly proportioned mobile bottom sheet on tablets rather than spanning the entire tablet width.



