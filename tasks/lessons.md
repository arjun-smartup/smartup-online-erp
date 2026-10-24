# Antigravity Developer Lessons & Self-Correction Log

## Lesson 1: Target the Exact Tier/View Shown in User Screenshot for Layout Adjustments
- **Context**: In a multi-tier dashboard (e.g. `/fees` having Tier 1 Programs -> Tier 2 Classes -> Tier 3 Formats), the user requested "reduce the card size".
- **Mistake**: We initially reduced the Tier 1 Program cards, whereas the user had Tier 2 "Select Class Level" open in their view.
- **Correction**: Carefully check the user's active viewport/screenshot to pinpoint the exact drill-down tier before modifying card dimensions.
- **Rule for Agent**: Always confirm the active hierarchy level or check the current browser screen state to apply sizing, text removals, or padding reductions to the specific tier the user is interacting with.
