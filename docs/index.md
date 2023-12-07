# Mock-up for the eraDisplay proposal for Intl.DateTimeFormat 
This mock-up shows the effect of the proposed eraDisplay option on any date projected to the built-in calendars.

Options fields of interest are hightlighted. 

After launching the mock-up, you can see 
* how the current version of the standard formatter `Intl.DateTimeFormat.format` displays a date before common era, 
* how it would display the same date with the same options under this proposal.
You can test the effects on other dates, calendars, set of options etc. with the current versions of Intl, ICU and CLDR.

Other `Intl` or CLDR issues and proposals outside the scope of the eraDisplay option proposal are also highlighted with this mock-up:
* proposition to handle in a different way time fields options : `numeric` vs. `2-digit`;
* issues when displaying dates with `chinese` and `dangi` calendars in certain languages, including 'fr' and 'pt'
* ...

[Launch the mock-up for the eraDisplay proposal](https://TC39.github.io/proposal-intl-eradisplay/dtfextend-mock-up).

This mock-up uses modules from [calendrical-javascript](https://louis-aime.github.io/calendrical-javascript/).
