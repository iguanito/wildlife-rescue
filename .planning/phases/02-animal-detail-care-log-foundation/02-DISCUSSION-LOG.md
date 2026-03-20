# Phase 2: Animal Detail & Care Log Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-20
**Phase:** 02-animal-detail-care-log-foundation
**Areas discussed:** Timeline structure, Care log type fields, Quick-add form placement, Detail page layout

---

## Timeline Structure

| Option | Description | Selected |
|--------|-------------|----------|
| By day | Entries under a date heading (e.g., "March 20 · 3 entries") | ✓ |
| Flat chronological | Every entry in order with timestamp, no grouping | |
| By type within day | Sub-groups per type under each day heading | |

**User's choice:** By day

| Option | Description | Selected |
|--------|-------------|----------|
| Compact | Type label + value only | |
| Full | Type, value, notes, who logged it — all visible | |
| Compact with expand | Type + value shown, click to see notes and logger | ✓ |

**User's choice:** Compact with expand

| Option | Description | Selected |
|--------|-------------|----------|
| Same compact/expand for all | Medical records also compact+expand; intake as first event | |
| Medical records always expanded | Full detail inline; intake as first event | ✓ |
| Separate sections | Intake in header, medical records in own section, care logs in timeline | |

**User's choice:** Medical records always expanded

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, intake is first event | "Intake · [date]" as oldest entry in timeline | ✓ |
| No, intake stays in header | Timeline starts with first care log or medical record | |
| Intake in header + timeline anchor | Info panel in header AND "Arrived [date]" marker at bottom | |

**User's choice:** Yes, intake is first event

---

## Care Log Type Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Number + unit selector | Numeric input + dropdown (g / kg) | |
| Number field only | Staff type unit themselves (e.g., "450g") | ✓ |
| Just notes | Everything in freeform notes field | |

**User's choice (weight):** Number field only

| Option | Description | Selected |
|--------|-------------|----------|
| Notes only | Freeform text (e.g., "5ml formula, fed well") | ✓ |
| Amount + notes | Quantity field + optional notes | |
| Checkbox-style | Happened / optional notes, no amount | |

**User's choice (feeding):** Notes only

**User's choice (observation):** Notes only (same as feeding)

---

## Quick-Add Form Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Sticky button above timeline | Always visible at top of timeline section | ✓ |
| Fixed bottom bar | Pinned to bottom of page | |
| In page header | Next to animal name, alongside Edit button | |

**User's choice:** Sticky button above the timeline

| Option | Description | Selected |
|--------|-------------|----------|
| Inline, pushes timeline down | Form expands between button and first timeline entry | ✓ |
| Slides in from side | Panel slides from right, timeline stays visible | |
| Replaces button area | Button disappears, form takes its spot | |

**User's choice:** Inline, pushes timeline down

---

## Detail Page Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Stays as header section | Compact info panel above timeline, with Edit button | ✓ |
| Collapses into top bar | Just name + status badge, click to expand | |
| Goes away | All info moves into Intake timeline event | |

**User's choice:** Stays as a header section

| Option | Description | Selected |
|--------|-------------|----------|
| Merges into timeline | Medical records appear chronologically among care logs | ✓ |
| Stays as separate section | Timeline on top, medical records section below | |
| Removed and replaced | Medical records only in timeline, old section deleted | |

**User's choice:** Merges into timeline

---

## Claude's Discretion

- Date heading format
- Empty state for animals with no care logs
- Expand/collapse animation
- Error state styling in inline form
