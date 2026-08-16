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
