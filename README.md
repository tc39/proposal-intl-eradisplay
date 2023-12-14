# eraDisplay option for Intl.DateTimeFormat

This repository was built from the repository template for ECMAScript proposals.

Spec Text Preview: https://tc39.es/proposal-intl-eradisplay/spec

## Status

- Champion(s): Shane Carr (@sffc)
- Author(s): Louis-Aimé de Fouquières (@Louis-Aime), Miletus, France
- Stage: 2

- Advanced to Stage 1 in 2021-01 TC39: https://github.com/tc39/notes/blob/main/meetings/2021-01/jan-27.md#eradisplay-for-stage-1
- Advanced to Stage 2 in 2022-11 TC39: https://github.com/tc39/notes/blob/main/meetings/2022-11/nov-29.md#eradisplay-option-for-intldatetimeformat

## Overview/Motivation

With the present (Nov. 2020) implementation of ICUs and CLDR in navigators, an author using `Intl.DateTimeFormat` is unable to control whether the `era` part of a date should be displayed or not.

On the other hand, when displaying a simple `gregory` date prior to 0000-01-01 with no option or with dateStyle, the era field is not displayed and the date is ambiguous.

The proposed `eraDisplay` option may take 3 values: "never", always", "auto". If undefined, "auto" is assumed. 
 * "never": whatever the `era` option may be, the era part is not displayed.
 * "always": whatever the other options may be, the era part is displayed, according to the value of the `era`. If `era` is undefined, it is resolved to "short".
 * "auto", the default value: the era part is displayed if the year part is displayed, and the date's era is different from today's date, in the resolved calendar.
 
 A presentation is available here : [eraDIsplay presentation](https://docs.google.com/presentation/d/1CABEQP_U-vCUxGKXbJmaZKvJZHEdFZZtAHGAOnRbrCY/edit?usp=sharing).
 
 The [index](./index.html) file shows the proposed changes to the specifications of DateTimeFormat Objects.

## Use cases

You may use a mock-up on [the proposal's web page](https://tc39.es/proposal-intl-eradisplay/)

Most users will get a better result while not changing anything to the options they pass to Intl.DateTimeFormat.
* `new Intl.DateTimeFormat("fr-FR").format(new Date(-752,3,13)) //> "13/4/753"` as of present (Nov. 2020) implementation; 
with this proposal:`//>"13/4/753 BC"`, that is 1500 years earlier.
* `new Intl.DateTimeFormat("en-US",{calendar : "ethiopic"}).format(new Date()) //> "3/15/2013 ERA1"`. 
Author did not ask for era name, which is missing in CLDR. 
`//> "3/15/2013"` with the proposed feature and the option set to default.  

Demanding users, who want to have the era displayed even if it is today's, or who do not want because the reader will understand from the context, will use the non-default values.

## Description

* Author may add option `eraDisplay` in the list of options when invoking new Intl.DateTimeFormat(). 
* If the eraDisplay option is undefined at DateTimeFormat Object's initialisation, it is is deemed "auto".
* When initializing the Intl.DateTimeFormat Object:
   * If, after resolving the format component set of options, [[Year]] slot is undefined, the "auto" value for [[EraDisplay]] slot is resolved to "never".
   * If [[EraDisplay]] is not "never" and [[Era]] is undefined, [[Era]] is set to "short".
* When creating the parts of a date string with an initialized Intl.DateTimeFormat object and a date, the [[era]] part is skipped: 
   * if [[EraDisplay]] is "never"
   * or if [[EraDisplay]] is "auto" and the date's era is the same as today's using the Intl.DateTimeFormat object's[[calendar]].

## Comparison

To our knowledge, there is no such function. Computer languages most generaly only give day/month/year without era, using only a very limited number of calendars, if not only one.


## Implementations

### Moke-up

[Access to mock-up](https://tc39.es/proposal-intl-eradisplay/)

### Native implementations

TBC at later stages

## Q&A

**Q**: Should'nt the date pattern be different depending on whether [[Era]] is displayed or not ?

**A**: With the present (Nov. 2020) version of ICU and CLDR, the separators ("/" or ".") between numeric components of a date are omitted if `era` is not undefined, 
for the `gregory` and `iso8601` calendars. With non-numeric months, there is no difference.
On the other hand, for most calendars (except chinese, dangi, gregory and iso8601), `era` is displayed if `year` is asked, whatever the `era` option may be; 
and for those calendars, the numeric date components are separated with "/" or "." depending on the locale, even though the era is displayed. 
There seems to be no reason for suppressing the separators between numeric date components when adding the era. 
I do not remember having seen any date string with numeric day, month, year and an era indication written without any separator.

Having the same rules for all calendar reduces the size of calendar-related informations for locale, and facilitates the author's choices. 
This is why I suggest to have patterns that always associate an era component when the year should be displayed. 
The default `eraDisplay` option shall skip this era component when it is not required.

We could change the proposal in setting a new pattern, "patternwoe" (pattern without era) in a similar way as "pattern12". 
The Intl.DateTimeFormat formatting methods would have to recompute the pattern for each date displayed, 
whereas here we propose to use the same pattern, just dropping a component in certain cases.
