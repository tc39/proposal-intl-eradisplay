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
    font-size: 0.78em;
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

## Problem: Year & Era Formatting Today

| `Intl.DateTimeFormat("en-US", …)` | 2024 CE | 1924 CE | 15 CE | 753 BCE |
| :--- | :---: | :---: | :---: | :---: |
| `{ dateStyle: "medium" }` | `Apr 13, 2024` | `Apr 13, 1924` | `Apr 13, 15` | `Apr 13, 753` ❌ |
| `{ dateStyle: "short" }` | `4/13/24` | `4/13/24` ⚠️ | `4/13/15` ⚠️ | `4/13/53` ❌ |
| `{ year: "numeric" }` | `2024` | `1924` | `15` | `753` ❌ |

- The era is never shown unless the author asks for it: 753 BCE reads as 753 CE
- `dateStyle: "short"` drops the century: 1924 and 2024 are both `4/13/24`
- Ranges too: `formatRange(753 BCE, 1 BCE)` with `dateStyle: "short"` → `4/13/53 – 4/13/01` ❌
- Authors cannot fix this and keep `dateStyle`: adding `era` throws `TypeError`

---

## Reminder: The Stage 2 Proposal (Nov 2022)

Authored by Louis-Aimé de Fouquières; [reached Stage 2 in 2022-11](https://github.com/tc39/notes/blob/main/meetings/2022-11/nov-29.md#eradisplay-option-for-intldatetimeformat)

```javascript
new Intl.DateTimeFormat("fr-FR", { eraDisplay: "auto" })  // "auto" | "always" | "never"
```

- **`"auto"`** *(default)*: show the era if the year is shown and the date's era differs from **today's** era in the resolved calendar
- **`"always"`**: show the era; `era` defaults to `"short"`
- **`"never"`**: hide the era, whatever `era` says
- Era only: the 2-digit year problem was out of scope

---

## Major Change Since Stage 2: CLDR-Driven Rules

| | Stage 2 (2022) | Now |
| :--- | :--- | :--- |
| Rule for `"auto"` | Era of date ≠ era of today | Per-calendar, per-locale rules from CLDR ([#9](https://github.com/tc39/proposal-intl-eradisplay/issues/9)) |
| Covers | Era | Era **and** century ([#10](https://github.com/tc39/proposal-intl-eradisplay/issues/10)) |
| `japanese`, current era | Era hidden | Era always shown: `R6/4/13` ([#8](https://github.com/tc39/proposal-intl-eradisplay/issues/8)) |
| `buddhist`, current era | Era hidden | Hidden in `th` (`13/4/2567`), shown in `en` (`4/13/2567 BE`) |
| Gregorian | Era for BCE dates | Era before year 1000; century outside a nearby window |

- **Web compatibility:** default output changes for `dateStyle: "short"` outside the 2-digit window, for years before 1000, and for negative years in `iso8601`. TG2 considers these bug fixes.

---

## Proposed Update: From Era Display to Year Styles

One scale covering era and century. `en-US`, short numeric date:

| Year style | 2024 CE | 1924 CE | 15 CE | 753 BCE |
| :--- | :---: | :---: | :---: | :---: |
| **Auto**: shortest unambiguous form | `4/13/24` | `4/13/1924` | `4/13/15 AD` | `4/13/753 BC` |
| **Full**: never shorten the year | `4/13/2024` | `4/13/1924` | `4/13/15 AD` | `4/13/753 BC` |
| **With era**: always show the era | `4/13/2024 AD` | `4/13/1924 AD` | `4/13/15 AD` | `4/13/753 BC` |

- Each row requires strictly more context than the one above
- This slide is the **model**. How to spell it in the API is an open question (later slides)

---

## Year Style in CLDR and ICU4X

**UTS #35** [Year Style](https://unicode.org/reports/tr35/tr35-dates.html#Semantic_Skeleton_Year_Style): an option of *semantic skeletons*, with `Auto`, `Full`, `WithEra`

**ICU4X** [`YearStyle`](https://unicode-org.github.io/icu4x/rustdoc/icu/datetime/options/enum.YearStyle.html): `Auto`, `Full`, `WithEra`, `NoEra`, driven by [`YearAmbiguity`](https://unicode-org.github.io/icu4x/rustdoc/icu/calendar/types/enum.YearAmbiguity.html):

```rust
// components/calendar/src/cal/gregorian.rs
ambiguity: match extended_year {
    ..=999      => YearAmbiguity::EraAndCenturyRequired,
    1000..=1949 => YearAmbiguity::CenturyRequired,
    1950..=2049 => YearAmbiguity::Unambiguous,
    2050..      => YearAmbiguity::CenturyRequired,
},
```

- ECMA-402 does not implement semantic skeletons, so it need not copy the option's shape

---

## Proposed Update: No Reliance on System Time

- **Stage 2:** `"auto"` compared the date against today's era, so the same code could print different output on different days
- **Proposed:** output depends only on the date, the calendar, and locale data
- **ICU4X** already works this way: fixed year ranges (previous slide)
- **UTS #35** leaves the heuristic to implementations; its example heuristic mentions "within 20 years of the current date"
- **Trade-off:** the 2-digit window is data that ages; it moves when implementations update

**Feedback wanted:** should the rules live in the spec, or be implementation- and locale-defined?

---

## Proposed Update: Specify `iso8601`, Then Drop `withoutEra`

```javascript
const d = Temporal.PlainDate.from({ year: -752, month: 4, day: 13 });
new Intl.DateTimeFormat("en", { year: "numeric" }).format(d);
// Today: "753" ❌   Proposed: "753 BC" ✅
const iso = { calendar: "iso8601", year: "numeric" };
new Intl.DateTimeFormat("en", iso).format(d);
// Today: "753" ❌   Proposed: "-752"   ✅
```

- **`iso8601` first:** the ISO calendar has no eras, so it prints signed years. This covers the signed-year use case without a new option value
- **Then drop `withoutEra`** (Stage 2's `"never"`): hiding the era produces ambiguous output; `formatToParts` remains as the escape hatch
- UTS #35 has no such style; ICU4X has `NoEra`

---

## API Question: `yearStyle` vs. More `year` Options

<div class="columns">
<div>

### A: new `yearStyle` option

```javascript
// Auto (default)
{ dateStyle: "short" }
// Full
{ dateStyle: "short",
  yearStyle: "fullYear" }
// With era
{ dateStyle: "short",
  yearStyle: "withEra" }
```

</div>
<div>

### B: existing `year` and `era`

```javascript
// Auto: new value (name TBD)
{ year: "short", month: "numeric",
  day: "numeric" }
// Full: already "numeric"
{ year: "numeric", … }
// With era: already works
{ year: "numeric", era: "short", … }
```

</div>
</div>

In B, `dateStyle: "short"` uses `year: "short"`; `year: "2-digit"` stays literal (`53`, no era)

---

## How the Existing Options Work Today

| Option | 2-digit year | Full year | With `dateStyle`? |
| :--- | :---: | :---: | :---: |
| `{ year: "numeric" }` | **0 / 139** locales | **139 / 139** (`2024`) | ❌ `TypeError` |
| `{ year: "2-digit" }` | **139 / 139** (`24`) | **0 / 139** | ❌ `TypeError` |
| `{ dateStyle: "short" }` | **about half** (`en-US`, `de`) | **about half** (`en-GB`, `ja`) | — |

- `year` already has a "force 2 digits" value and a "force full year" value; only the in-between is missing
- `era` sets the *width* and forces the era on: `2024 A` / `2024 AD` / `2024 Anno Domini`
- `{ era: "short" }` alone → `4/13/2024 AD`
- `{ dateStyle: "medium", era: "short" }` → `TypeError`

---

## Pros and Cons of Extending `year` (B)

**Pros**

- Less churn
- Smaller API surface: one new value instead of a new option
- Fewer ways to do the same thing
- No overlapping options to reconcile: what would `{ year: "2-digit", yearStyle: "fullYear" }` or `{ year: "numeric", yearStyle: "auto" }` mean?

**Con**

- Does not work with `dateStyle`: no way to force a full year or an era on `{ dateStyle: "short" }`, since `dateStyle` + `year` / `era` throws `TypeError`

**Champion's mild preference: B.** The question is open.

---

## Out of Scope: Future Work

- **Julian calendar** and the **Julian–Gregorian switchover**: no `"julian"` calendar on the web platform today, and switchover dates vary by region
- **Old Style / New Style** era names: a variant of era naming, layered on top of whether the era is shown
- Both can be follow-on proposals; nothing here blocks them

---

## Summary & Questions for Plenary

Temperature check on the three proposed updates:

1. **Year styles:** widen the proposal from era display to era and century?
2. **No system time:** output independent of the clock? Rules in the spec, or implementation-defined?
3. **Scope:** signed years in `calendar: "iso8601"`, then drop `withoutEra`?

Open for feedback:

4. **API shape:** a `yearStyle` option (A), or a new `year` value (B)?

**Next Steps:** Finalize API in TG2 → Stage 2.7 in early 2027 *(EAO, DLM)*
