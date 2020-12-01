# eraDisplay option for Intl.DateTimeFormat
This repository was built from the repository template for ECMAScript proposals.

## Status

Champion(s): Shane Carr (@sffc)
Author(s): Louis-Aimé de Fouquières (@Louis-Aime), Miletus, France
Stage: -1

## Overview/Motivation

With the present (Nov. 2020) implementation of ICUs and CLDR in navigators, an author using `Intl.DateTimeFormat` is unable to control whether the `era` part of a date should be displayed or not.

On the other hand, when displaying a simple `gregory` date prior to 0000-01-01 with no option or with dateStyle, the era field is not displayed and the date is ambiguous.

The new `eraDisplay` option may take 3 values: "never", always", "auto". If undefined, "auto" is assumed. 
 * "never": whatever the `era` option may be, the era part is not displayed.
 * "always": whatever the other options may be, the era part is displayed, according to the value of the `era`. If `era` is undefined, it is resolved to "short".
 * "auto", the default value: the era part is displayed if the year part is displayed, and the date's era is different from today's date, in the resolved calendar.
 
 Details are given here : [eraDIsplay presentation](https://docs.google.com/presentation/d/1CABEQP_U-vCUxGKXbJmaZKvJZHEdFZZtAHGAOnRbrCY/edit?usp=sharing)

## Use cases

You may use a moke-up on [the proposal's web page](https://louis-aime.github.io/proposal-intl-eradisplay/)

Most users will get a better result while not changing anything to the options they pass to Intl.DateTimeFormat.
* `new Intl.DateTimeFormat().format(new Date(-752,3,13)) //> "13/4/753"` as of present (Nov. 2020) implementation; 
with this proposal:`//>"13/4/753 BC"`, that is 1500 years earlier
* `new Intl.DateTimeFormat("en-US",{calendar : "ethiopic"}).format(new Date()) //> "3/15/2013 ERA1"`. 
Author did not ask for era name, which is missing in CLDR. `//> "3/15/2013"` with`the proposed feature and the option set to default.  

Demanding users, who want to have the era displayed even if it is today's, or who do not want because the reader will understand from the context, will use the non-default values.

## Description

Author may add option eraDisplay in the list of options when invoking new Intl.DateTimeFormat(). If he doesn't, option is deemed "auto".
Effective `era` resolved option may temporarily be changed by the .format or .FormatToParts methods. 

## Comparison

To our knowledge, there is no such function. Languages generaly only give day/month/year without era. 

## Implementations

### Moke-up

[Access to moke-up](https://louis-aime.github.io/proposal-intl-eradisplay/)

### Native implementations

TBC at later stages

## Q&A

**Q**: Why ?

**A**: Because reasons!
