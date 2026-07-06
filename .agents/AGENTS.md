## Number Formatting Rules
- Always use the global \formatNumber\ or \formatCurrency\ utilities from \lib/utils.ts\ to format large numbers.
- When formatting millions, use lowercase 'm' (e.g. 1.5m), lowercase 'b' for billions, and lowercase 'k' for thousands.
- This applies to all major page stat cards.

## Modal Design Rules
- Follow the specific font size, weight, and modal size for all modals based on the user's reference design.
- **Modal Size**: Use a compact maximum width (e.g., `max-w-md` or `max-w-sm` in Tailwind).
- **Typography & Weights**: Unlike the general admin page rule, modals **should** use heavier font weights (`font-semibold` or `font-bold`) for Titles, Subtitles, button text, and emphasizing critical words in body text.
- **Font Sizes**: Titles should be prominent (e.g., `text-lg`), secondary headings/questions standard size (`text-base`), and description text slightly smaller (`text-sm`).
