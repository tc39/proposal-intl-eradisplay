# Mock-up for the eraDisplay proposal for Intl.DateTimeFormat 
This mock-up shows the effect of the proposed eraDisplay option on any date projected to the built-in calendars.

Options fields of interest are hightlighted. Significant diffences occur with calendars other than "gregory", "iso8601", "chinese" and "dangi". Please change the calendar fields accordingly.

Other Intl or CLDR issues outside the scope of the eraDisplay option proposal are also highlighted here:
* lack of control for `chinese` and `dangi` calendars;
* missing data in CLDR (e.g. 'fr' with `buddhist`);
* proposition to handle in a different way time fields options : `numeric` vs. `2-digit`;
* handling missing date or time fields (e.g. `hour` and `second` defined, but `minute` missing);
* ...

[Launch the mock-up for the eraDisplay proposal](https://TC39.github.io/proposal-intl-eradisplay/dtfextend-mock-up).

This mock-up uses modules from [calendrical-javascript](https://louis-aime.github.io/calendrical-javascript/).
