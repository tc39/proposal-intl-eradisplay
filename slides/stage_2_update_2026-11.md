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

| `Intl.DateTimeFormat("en-US", …)` | 2024 CE | 1924 CE | 15 CE | 753 BCE (`-752`) |
| :--- | :---: | :---: | :---: | :---: |
| `{ dateStyle: "medium" }` | `Apr 13, 2024` | `Apr 13, 1924` | `Apr 13, 15` | `Apr 13, 753` ❌ |
| `{ dateStyle: "short" }` | `4/13/24` | `4/13/24` ⚠️ | `4/13/15` ⚠️ | `4/13/53` ❌ |
| `{ calendar: "iso8601", year: "numeric" }` | `2024` | `1924` | `15` | `753` ❌ *(not `-752`)* |

- `year ≤ 0` maps to `1 - year`; `"2-digit"` slices the last 2 chars
- `formatRange(753 BCE, 1 BCE)` drops era: `"4/13/753 – 4/13/1"` ❌
- Non-Gregorian calendars (`ethiopic`, `buddhist`) handle eras inconsistently

---

## From Stage 2 (Nov 2022) to CLDR Rules

- **Nov 2022 Stage 2** *(Louis-Aimé de Fouquières)*:
  `eraDisplay: "auto" | "always" | "never"` checked `Temporal.Now`
- **CLDR data-driven rules ([#8](https://github.com/tc39/proposal-intl-eradisplay/issues/8), [#9](https://github.com/tc39/proposal-intl-eradisplay/issues/9)):**
  Japanese (`R6`) always needs era; Buddhist omits it in `th-TH` (`2567`) vs. `en-US` (`2567 BE`)
- **Clock independent:** Output never shifts with the system clock
- **Future follow-up:** Julian–Gregorian switchover (`"julian"`, Old/New Style)

---

## Updated Model: Year & Era Disambiguation

Unified disambiguation scale for era and century ([#10](https://github.com/tc39/proposal-intl-eradisplay/issues/10)):

| Mode *(names TBD)* | 2024 CE | 1924 CE | 15 CE | 753 BCE |
| :--- | :---: | :---: | :---: | :---: |
| **`auto`** *(default)* | `4/13/24` *(short)* | `4/13/1924` | `4/13/15 [AD]` | `4/13/753 BC` |
| **`fullYear`** *(no 2-digit)* | `4/13/2024` | `4/13/1924` | `4/13/15 [AD]` | `4/13/753 BC` |
| **`withEra`** *(always era)* | `4/13/2024 AD` | `4/13/1924 AD` | `4/13/15 AD` | `4/13/753 BC` |

- `auto`: elides era and 2-digit century only when unambiguous
- `fullYear`: keeps full century (`2024`), elides unambiguous eras

---

## Scope Updates: `iso8601` & Dropping `"never"`

```javascript
const d = Temporal.PlainDate.from({ year: -752, month: 4, day: 13 });
new Intl.DateTimeFormat("en", { year: "numeric" }).format(d);
// Today: "753" ❌   Proposed: "753 BC" ✅
const iso = { calendar: "iso8601", year: "numeric" };
new Intl.DateTimeFormat("en", iso).format(d);
// Today: "753" ❌   Proposed: "-752"   ✅
```

- **`iso8601` negative years:** Outputs `"-752"` (no `"algebraic"` option needed)
- **Drop `"never"` / `"withoutEra"`:** Footgun (`formatToParts` suffices)

---

## Prior Art: Unicode UTS #35 & ICU4X

- **Unicode UTS #35 (LDML Part 4 — Semantic Skeletons):**
  - [`#Semantic_Skeleton_Year_Style`](https://unicode.org/reports/tr35/tr35-dates.html#Semantic_Skeleton_Year_Style): `Auto`, `Full`, and `WithEra` rules
  - [`#Semantic_Year_Style_Skeleton_Variations`](https://unicode.org/reports/tr35/tr35-dates.html#Semantic_Year_Style_Skeleton_Variations): `yyMd` / `yMd` / `GyMd` families
- **Shipped in ICU4X (`icu::calendar` & `icu::datetime`):**
  - [`YearAmbiguity`](https://unicode-org.github.io/icu4x/rustdoc/icu/calendar/types/enum.YearAmbiguity.html) in [`gregorian.rs`](https://github.com/unicode-org/icu4x/blob/main/components/calendar/src/cal/gregorian.rs) (year-range cutoffs)
  - [`YearStyle`](https://unicode-org.github.io/icu4x/rustdoc/icu/datetime/options/enum.YearStyle.html) in [`neo.rs`](https://github.com/unicode-org/icu4x/blob/main/components/datetime/src/raw/neo.rs) & [`semantic_skeletons.rs`](https://github.com/unicode-org/icu4x/blob/main/provider/source/src/datetime/semantic_skeletons.rs)

---

## API Question: Dedicated Option vs. `year` & `era`?

Three modes remain once `"withoutEra"` and `"algebraic"` are dropped:

<div class="columns">
<div>

### Option A: `yearStyle`
- `"auto"` *(default)*
- `"fullYear"` *(no 2-digit)*
- `"withEra"` *(always era)*

</div>
<div>

### Option B: `year` & `era`
- Default → `"auto"`
- `era` set → `"withEra"`
- `year: "long"` → `"fullYear"`

</div>
</div>

*(Option C: fix `"auto"` default only, with zero new options or values)*

---

## Deep Dive 1: `year` vs. `dateStyle` Today

| Option | 2-Digit Locales | Full-Year Locales | With `dateStyle`? |
| :--- | :---: | :---: | :---: |
| `{ year: "numeric" }` | **0 / 139** | **139 / 139** (`"2024"`) | ❌ `TypeError` |
| `{ year: "2-digit" }` | **139 / 139** (`"24"`) | **0 / 139** | ❌ `TypeError` |
| `{ dateStyle: "short" }` | **54 / 98** (`en-US`, `de`) | **44 / 98** (`en-GB`, `ja`) | — |

- Default 2-digit years come **only** from `dateStyle: "short"`
- `{ year: "long" }` duplicates `"numeric"` in bags, yet throws `TypeError` with `dateStyle: "short"`!

---

## Deep Dive 2: `era` Width vs. Visibility Today

- **`era` (`"narrow" | "short" | "long"`) sets *width*, not policy:**
  `"A"` / `"AD"` / `"Anno Domini"` (`en-US`); `"R"` / `"令和"` (`ja-JP`)
- **Static CLDR presence:** `gregory` omits era (`"Apr 13, 753"`), while `buddhist` & `ethiopic` hardcode it in `en-US`
- **Orthogonality:** Option A supports `{ era: "long", yearStyle: "auto" }` (`era` alone defaults to `"withEra"` for compat); Option B cannot
- **Incompatible with `dateStyle`:** `{ dateStyle: "long", era: "short" }` throws `TypeError`

---

## Deep Dive 3: `era` Quirks in CLDR & Engines

- **Legacy `GyMd` skeleton drift** when adding `era: "short"`:
  `zh-CN` `"2024/4/13"` → `"公元 2024-04-13"`; `ko-KR` `"2024. 4. 13."` → `"AD 2024/4/13"`
- **Defaulting quirks:** `{ era: "short" }` alone injects `YMD` (`"4/13/2024 AD"`), while `{ month: "long", era: "short" }` → `"AD (month: April)"`
- **Calendar & `resolvedOptions()` bugs:** `iso8601` + `era: "short"` leaks `"753 BC"`; `zh-TW` (`roc`) emits `era` parts with `resolvedOptions().era === undefined`

---

## Comparing the API Design Options

| Criterion | A: `yearStyle` | B: `year` / `era` | C: `"auto"` Only |
| :--- | :---: | :---: | :---: |
| `"753 BC"`, `iso8601` `"-752"`, short `1924` | ✅ Default | ✅ Default | ✅ Default |
| Full year in `dateStyle: "short"` (`4/13/2024`) | ✅ `"fullYear"` | ❌ `TypeError`* | ❌ No |
| Force era with `dateStyle` (`Apr 13, 2024 AD`) | ✅ `"withEra"` | ❌ `TypeError`* | ❌ No |
| `"auto"` + `era: "long"` (`753 Before Christ`) | ✅ Orthogonal | ❌ Forces era | ❌ Forces era |
| Non-redundant in `{ year, month, day }` bags | ✅ Clean | ⚠️ `long` ≈ `numeric` | ✅ Clean |

*\*Unless ECMA-402 lifted the `TypeError` on `dateStyle` + `year` / `era`.*

---

## Summary & Questions for Plenary

1. **Defaults:** Any concerns with CLDR data-driven year/era disambiguation + signed `"-752"` in `calendar: "iso8601"`?
2. **Scope:** Any concerns with dropping `"never"` / `"withoutEra"`?
3. **API shape:** Dedicated `yearStyle` (`"auto" | "fullYear" | "withEra"`) vs. avoiding a new option?

**Next Steps:** Finalize API in TG2 → Stage 2.7 in early 2027 *(EAO, DLM)*
