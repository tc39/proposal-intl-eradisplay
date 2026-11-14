---
marp: true
theme: default
paginate: true
footer: 'eraDisplay / yearStyle - Stage 2 Update'
style: |
  .columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
  table {
    font-size: 0.85em;
  }
---

<!-- 
_class: lead 
_backgroundColor: #2c3e50
_color: #ffffff
-->

# eraDisplay / yearStyle
## Stage 2 Update
### Shane F Carr — November 2026 TC39

---

## Recap: Stage 2 Proposal (November 2022)

- **Motivation** *(originally authored by Louis-Aimé de Fouquières)*:
  - Gregorian BCE dates omit the era by default (`753 BC` formats as `"753"` — 1500 years off!)
  - Non-Gregorian calendars (`ethiopic`, `buddhist`, …) format eras inconsistently with no author control
- **November 2022 Stage 2 Design:**
  - `eraDisplay: "auto" | "always" | "never"` (default `"auto"`)
  - `"auto"` hid the era iff it matched the runtime current date's era (`Temporal.Now`)

---

## Update 1: CLDR Data-Driven Rules (#8, #9)

Comparing only against the runtime current date had key issues:
- **Calendar & locale sensitivity ([#8](https://github.com/tc39/proposal-intl-eradisplay/issues/8)):**
  - Japanese (`令和6年` / `R6`) cannot drop the era (`6年` means *"6 years"*)
  - Non-default calendars for a locale (e.g. `buddhist` in `en-US`, or `gregory` in `th-TH`) need the era displayed by default
- **Clock independence:** Formatting output should not shift with the system clock

**TG2 Decision:**
- `"auto"` remains the default, driven by **CLDR locale & calendar data** (year-range cutoffs + calendar/locale defaults), not the runtime clock
- **Potential Future Follow-up:** Modeling historical Julian–Gregorian switchover dates (e.g. a `"julian"` calendar or `"Old Style"` / `"New Style"` era variants) can build on this foundation in a follow-on proposal

---

## Spec & Implementation of Data-Driven Rules

- **Unicode UTS #35 (LDML Part 4: Dates — Semantic Skeletons):**
  - [Year Style (`#Semantic_Skeleton_Year_Style`)](https://unicode.org/reports/tr35/tr35-dates.html#Semantic_Skeleton_Year_Style): Defines `Auto`, `Full`, and `WithEra` and calendar/locale/year-range disambiguation rules
  - [Year Style Skeleton Variations (`#Semantic_Year_Style_Skeleton_Variations`)](https://unicode.org/reports/tr35/tr35-dates.html#Semantic_Year_Style_Skeleton_Variations): Maps CLDR `datetimeSkeleton`s (e.g. `en-US` Gregorian `yyMd` vs. Japanese `GGGGGyMd`) to default, full-year (`yy` → `y`), and with-era (`+ G`) patterns
- **ICU4X Implementation (shipped in `icu::calendar` & `icu::datetime`):**
  - [`YearAmbiguity`](https://unicode-org.github.io/icu4x/rustdoc/icu/calendar/types/enum.YearAmbiguity.html) per calendar — e.g. [`cal/gregorian.rs`](https://github.com/unicode-org/icu4x/blob/main/components/calendar/src/cal/gregorian.rs) (`..=999` → `EraAndCenturyRequired`, `1000..=1949` & `2050..` → `CenturyRequired`, `1950..=2049` → `Unambiguous`)
  - [`YearStyle`](https://unicode-org.github.io/icu4x/rustdoc/icu/datetime/options/enum.YearStyle.html) + runtime pattern selection in [`datetime/src/raw/neo.rs`](https://github.com/unicode-org/icu4x/blob/main/components/datetime/src/raw/neo.rs) (`resolve_date_variant`) & [`semantic_skeletons.rs`](https://github.com/unicode-org/icu4x/blob/main/provider/source/src/datetime/semantic_skeletons.rs)
- **ECMA-402 Draft Spec (`spec.emu`):** Runtime pattern selection in `PartitionDateTimePattern` (`[[Pattern]]` / `[[PatternEra]]`) extends directly to these variants

---

## Update 2: Century Precision & `yearStyle` (#10)

In UTS #35 semantic skeletons and ICU4X (`YearStyle`), era display and 2-digit century elision are part of the same disambiguation model:

| Style | 2024 CE | 1715 CE | 15 CE | 753 BCE |
| :--- | :---: | :---: | :---: | :---: |
| **`withEra`** | `2024 AD` | `1715 AD` | `15 AD` | `753 BC` |
| **`fullYear`** | `2024` | `1715` | `15 [AD]` | `753 BC` |
| **`auto`** | `24` *(when 2-digit)* | `1715` | `15 [AD]` | `753 BC` |

- `auto` elides era (and century when 2-digit is requested) only when unambiguous
- `fullYear` prevents shortening the year to 2 digits (e.g. in short date formats) while eliding the era when unambiguous

---

## Update 3: Negative Years in `iso8601` & Dropping `"never"`

Today on the web, even `calendar: "iso8601"` formats negative years without a sign:

```javascript
const d = Temporal.PlainDate.from({ calendar: "iso8601", year: -752, month: 1, day: 1 });

new Intl.DateTimeFormat("en", { year: "numeric" }).format(d);
// Today: "753" ❌   Proposed: "753 BC" ✅

new Intl.DateTimeFormat("en", { calendar: "iso8601", year: "numeric" }).format(d);
// Today: "753" ❌   Proposed: "-752"   ✅
```

**TG2 Decisions:**
- Formatting with `calendar: "iso8601"` outputs signed algebraic years (`"-752"`), covering astronomical/ISO use cases without a separate `"algebraic"` option
- Drop `"never"` / `"withoutEra"` (hiding `"BC"` on `"753 BC"` is a footgun; `formatToParts` remains available)

---

## Open Question: Do We Even Need a New Option?

With `"withoutEra"` and `"algebraic"` dropped, only **three behaviors** remain:

<div class="columns">
<div>

### Option A: New `yearStyle` option
- `yearStyle: "auto"` *(default)*
- `yearStyle: "fullYear"` *(never 2-digit)*
- `yearStyle: "withEra"` *(always show era)*

</div>
<div>

### Option B: Existing `year` & `era`
- `{ year: "numeric" }` / `"2-digit"` / `dateStyle` → `"auto"` disambiguation by default
- `{ era: "short", year: "numeric" }` → already expresses `"withEra"`
- `{ year: "long" }` *(name TBD)* → new `year` value for `"fullYear"` (never 2-digit)

</div>
</div>

---

## Summary & Discussion

Seeking plenary feedback on:
1. **Default behavior:** CLDR data-driven era/century disambiguation (no runtime clock) + signed negative years (`"-752"`) in `calendar: "iso8601"`
2. **Dropping `"never"` / `"withoutEra"`**
3. **API shape:** Dedicated `yearStyle` option vs. extending `year` (e.g. `year: "long"`) with no new option

**Next Steps:**
- Complete naming bikeshed in TG2 and update `spec.emu`
- Return for Stage 2.7 in early 2027 *(Reviewers: Eemeli Aro & Dan Minor)*
