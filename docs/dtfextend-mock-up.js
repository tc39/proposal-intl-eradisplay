/* DateExtendTest: test custom calendars formatting capabilities. 
To be used with dtfextend-mock-up.html
Character set is UTF-8
Contents: general structure:
	setDisplay: modify displayed page after a change
	calcFormat : specifically modify date strings. Called by setDisplay.
Required:
	ExtDateTime from calendrical-javascript
*/
/* Version:	M2021-08-23	Wrap .format with try / catch
	M2021-08-17: refer to calendrical-javascript routines
	M2021-06-31
		Use dateextended.js classes as imported modules
		No calendar validity control
	M2021-05-02 fix fetching of era option for extended version
	M2021-02-30 Change names of two files to "mock-up", no change in code
	M2020-12-16 Enhance layout, separate general/date/time options
	M2020-11-29 bug seen from a better control in ExtDate
	M2020-11-27 first version (cloned from a custom calendar test page)
*/
/* Copyright Miletus 2017-2020 - Louis A. de Fouquières
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sub-license, or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
1. The above copyright notice and this permission notice shall be included
   in all copies or substantial portions of the Software.
2. Changes with respect to any former version shall be documented.

The software is provided "as is", without warranty of any kind,
express of implied, including but not limited to the warranties of
merchantability, fitness for a particular purpose and non-infringement.
In no event shall the authors of copyright holders be liable for any
claim, damages or other liability, whether in an action of contract,
tort or otherwise, arising from, out of or in connection with the software
or the use or other dealings in the software.

Inquiries: www.calendriermilesien.org
*/
"use strict";
var 
	ExtDate, ExtDateTimeFormat, Milliseconds,	// objects from imported modules
	targetDate = new Date(0); 

(async function initial () {
	let module = await import ('https://louis-aime.github.io/calendrical-javascript/time-units.js');
	Milliseconds = module.default;
	module = await import ('https://louis-aime.github.io/calendrical-javascript/extdatetimeformat.js');
	ExtDateTimeFormat = module.default;
	module = await import ('https://louis-aime.github.io/calendrical-javascript/extdate.js');
	ExtDate = module.default;
	calcGregorian();	// Establish initial date value from loaded page, not from "now"
	calcTime();		// Establish initial time value from loaded page, not from "now"
	calcFormat();	// Establish initial value of formatters after loaded page
	setDisplay();
} () )

function undef (string) {return string == "" ? undefined : string }

function setDisplay () { // Considering that targetDate time has been set to the desired date, this routines updates all form fields.
	// Time zone mode section
	// Initiate Time zone mode for the "local" time from main display
	let TZDisplay = document.TZmode.TZcontrol.value,
		TZmsOffset = new ExtDate ("iso8601", targetDate.valueOf()).getRealTZmsOffset().valueOf(),
		myElement;	// to be used later
	// Display time zone offset as given by system routine
	document.getElementById("sysTZoffset").innerHTML = new Intl.NumberFormat().format(targetDate.getTimezoneOffset());
	// TZmsOffset is real time zone offset in milliseconds (UTC - local time)
	// Note that getTimezoneOffset sometimes gives an integer number of minutes where a decimal number is expected
	// Display real (computed) time zone offset
	let
		systemSign = (TZmsOffset >= 0 ? 1 : -1), // sign is as of JS convention
		absoluteRealOffset = systemSign * TZmsOffset,
		absoluteTZmin = Math.floor (absoluteRealOffset / Milliseconds.MINUTE_UNIT),
		absoluteTZsec = Math.floor ((absoluteRealOffset - absoluteTZmin * Milliseconds.MINUTE_UNIT) / Milliseconds.SECOND_UNIT);
	document.querySelector("#realTZOffset").innerHTML = (systemSign == 1 ? "+ ":"- ") + absoluteTZmin + " min " + absoluteTZsec + " s";

	// Fill date and time fields with target date elements, according to time zone mode
	switch (TZDisplay) {
		case "" :
			document.gregorian.year.value = targetDate.getFullYear(); 
			document.gregorian.monthname.value = targetDate.getMonth() + 1; // Display month value in 1..12 range.
			document.gregorian.day.value = targetDate.getDate();
			document.time.hours.value = targetDate.getHours();
			document.time.mins.value = targetDate.getMinutes();
			document.time.secs.value = targetDate.getSeconds();
			document.time.ms.value = targetDate.getMilliseconds();
			break;
		case "UTC" :
			document.gregorian.year.value = targetDate.getUTCFullYear(); 
			document.gregorian.monthname.value = targetDate.getUTCMonth() + 1; // Display month value in 1..12 range.
			document.gregorian.day.value = targetDate.getUTCDate();
			document.time.hours.value = targetDate.getUTCHours();
			document.time.mins.value = targetDate.getUTCMinutes();
			document.time.secs.value = targetDate.getUTCSeconds();
			document.time.ms.value = targetDate.getUTCMilliseconds();
			break;
	}

	document.getElementById("ISOdatetime").innerHTML = targetDate.toISOString();
	document.getElementById("Posixnumber").innerHTML = targetDate.valueOf();

	// Display day of week near date fields
	try { document.gregorian.dayofweek.value = weekOptions.format(targetDate) }
	catch (e) { document.gregorian.dayofweek.value = e.message };

	// Display date strings following currently applicable options
	myElement = document.getElementById("Ustring");
	try { myElement.innerHTML = askedOptions.format(targetDate) }
	catch (e) { myElement.innerHTML = e.message };
	myElement = document.getElementById("Xstring")
	try { myElement.innerHTML = extAskedOptions.format(targetDate) }
	catch (e) { myElement.innerHTML = e.message };

}

//	Formatter section
var 
	askedOptions, usedOptions, extAskedOptions, extUsedOptions, weekOptions; //	Keep formatters if unchanged options
function calcFormat() { // get Locale, calendar indication and Options given on page, recompute formatters
	let Locale = document.Locale.Locale.value,
		unicodeAskedExtension = document.Locale.UnicodeExt.value;

	// Test specified Locale
	try { 
		askedOptions = new Intl.DateTimeFormat(undef(Locale));
	}
	catch (e) {
		alert (e.message + "\nCheck locale");
		return
	}
	Locale = askedOptions.resolvedOptions().locale;	// Locale is no longer empty
	Locale = Locale.includes("-u-") ?  Locale.substring (0,Locale.indexOf("-u-")) : Locale; // Locale is only language part
	
	// Build extended Locale i.e. language part + unicode extensions
	let unicodeExtension = "-u";
	let extendedLocale = Locale;
	if (unicodeAskedExtension !== "") unicodeExtension += "-" + unicodeAskedExtension;
	if (unicodeExtension !== "-u") extendedLocale += unicodeExtension; 
	
	// Construct presentation options from page
	let Options = {}; 
	if	(document.Locale.LocaleMatcher.value != "")	Options.localeMatcher = document.Locale.LocaleMatcher.value;
	if	(document.Locale.FormatMatcher.value != "")	Options.formatMatcher = document.Locale.FormatMatcher.value;
	if	(document.Locale.TimeZone.value != "")	Options.timeZone = document.Locale.TimeZone.value;
	if	(document.Locale.Calendar.value != "")	Options.calendar = document.Locale.Calendar.value;
	if	(document.Locale.DateStyle.value != "") 	Options.dateStyle = document.Locale.DateStyle.value;
	if	(document.Locale.TimeStyle.value != "") 	Options.timeStyle = document.Locale.TimeStyle.value;
	if	(document.dateOptions.Weekday.value != "")	Options.weekday = document.dateOptions.Weekday.value;
	if	(document.dateOptions.Day.value != "") 	Options.day = document.dateOptions.Day.value;
	if	(document.dateOptions.Month.value != "") 	Options.month = document.dateOptions.Month.value;
	if 	(document.dateOptions.Year.value != "")	Options.year = document.dateOptions.Year.value;
	if	(document.dateOptions.Era.value != "")	Options.era	= document.dateOptions.Era.value;
	if	(document.timeOptions.Hour.value != "")	Options.hour = document.timeOptions.Hour.value;
	if	(document.timeOptions.Minute.value != "")	Options.minute = document.timeOptions.Minute.value;
	if	(document.timeOptions.Second.value != "")	Options.second	= document.timeOptions.Second.value;
	if	(document.timeOptions.Msdigits.value != "")	Options.fractionalSecondDigits	= document.timeOptions.Msdigits.value;
	if	(document.timeOptions.TimeZoneName.value != "")	Options.timeZoneName	= document.timeOptions.TimeZoneName.value;
	if	(document.timeOptions.Hour12.value != "")	Options.hour12	= (document.timeOptions.Hour12.value == "true");
	if	(document.timeOptions.HourCycle.value != "")	Options.hourCycle	= document.timeOptions.HourCycle.value;
	if	(document.timeOptions.AmPm.value != "")	Options.dayPeriod	= document.timeOptions.AmPm.value;

	if	(document.dateOptions.eraDisplay.value != "")	Options.eraDisplay	= document.dateOptions.eraDisplay.value;
	
	// Test that Options set is acceptable. If not, stop processing.
	try {
		askedOptions = new Intl.DateTimeFormat (extendedLocale, Options);
		}
	catch (e) {
		alert (e.message + "\nCheck asked options" ); 
		return
	}
	usedOptions = askedOptions.resolvedOptions();
	
	// Same for ExtDateTimeFormat
	try {
		extAskedOptions = new ExtDateTimeFormat (extendedLocale, Options);
		}
	catch (e) {
		alert (e.message + "\nCheck asked options for ExtDateTimeFormat" ); 
		return
	}
	extUsedOptions = extAskedOptions.resolvedOptions();
	// Construct week string formatter for the time zone used for date input
	weekOptions = new Intl.DateTimeFormat(undef(Locale), {weekday : "long", timeZone : undef (document.TZmode.TZcontrol.value)}); 
	
	// Display all effective options
	document.Locale.Elocale.value = usedOptions.locale;
	document.Locale.Ecalend.value = usedOptions.calendar;
	document.Locale.Enum.value = usedOptions.numberingSystem;
	document.Locale.ETimeZone.value = usedOptions.timeZone;
	document.Locale.EdateStyle.value = usedOptions.dateStyle;
	document.Locale.EtimeStyle.value = usedOptions.timeStyle ;
	document.dateOptions.Eweekday.value = usedOptions.weekday;
	document.dateOptions.Eera.value = usedOptions.era;
	document.dateOptions.Eyear.value = usedOptions.year;
	document.dateOptions.Emonth.value = usedOptions.month;
	document.dateOptions.Eday.value = usedOptions.day;
	document.timeOptions.Ehour.value = usedOptions.hour;
	document.timeOptions.Eminute.value = usedOptions.minute;
	document.timeOptions.Esecond.value = usedOptions.second;
	document.timeOptions.Emsdigits.value = usedOptions.fractionalSecondDigits;
	document.timeOptions.EtimeZoneName.value = usedOptions.timeZoneName;
	document.timeOptions.Ehour12.checked = usedOptions.hour12;
	document.timeOptions.EhourCycle.value = usedOptions.hourCycle;
	document.timeOptions.EAmPm.value = usedOptions.dayPeriod;
	
	// Display all effective options for extended formatter
	document.dateOptions.Xweekday.value = extUsedOptions.weekday;
	document.dateOptions.Xera.value = extUsedOptions.era;
	document.dateOptions.Xyear.value = extUsedOptions.year;
	document.dateOptions.Xmonth.value = extUsedOptions.month;
	document.dateOptions.Xday.value = extUsedOptions.day;
	document.timeOptions.Xhour.value = extUsedOptions.hour;
	document.timeOptions.Xminute.value = extUsedOptions.minute;
	document.timeOptions.Xsecond.value = extUsedOptions.second;
	document.timeOptions.Xmsdigits.value = extUsedOptions.fractionalSecondDigits;
	document.timeOptions.XtimeZoneName.value = extUsedOptions.timeZoneName;
	document.timeOptions.Xhour12.checked = extUsedOptions.hour12;
	document.timeOptions.XhourCycle.value = extUsedOptions.hourCycle;
	document.timeOptions.XAmPm.value = extUsedOptions.dayPeriod;

}

function calcGregorian() {
	var 
	 day =  Math.round (document.gregorian.day.value),
	 month = Math.round (document.gregorian.monthname.value),
	 year =  Math.round (document.gregorian.year.value);
	 // HTML controls that day, month and year are numbers
	let testDate = new Date (targetDate.valueOf());
	switch (document.TZmode.TZcontrol.value) {
		case "": 
			testDate.setFullYear(year, month-1, day); 	// Set date object from calendar date indication, without changing time-in-the-day.
			break;
		case "UTC" : testDate.setUTCFullYear(year, month-1, day);
			break;
		} 
	if (isNaN(testDate.valueOf())) alert ("Out of range")
	else {
		// Here, no control of date validity, leave JS recompute the date if day of month is out of bounds
		targetDate = new Date (testDate.valueOf());
	}
}

var 
	dayOffset = 1; // Days (decimal) to add or substract
// no setDateToToday
function changeDayOffset () { 
	let days = +document.control.shift.value;
	if (isNaN(days) || days < 0) {
		alert ("Invalid input");
		}
	else 
	{ 
		dayOffset = days; // Global variable updated
		document.control.shift.value = days; // Confirm changed value
	}
}
function setDayOffset (sign=1) {
	changeDayOffset();	// Force a valid value in field
	let testDate = new Date(targetDate.valueOf());
	testDate.setTime (testDate.getTime()+sign*dayOffset*Milliseconds.DAY_UNIT);
	if (isNaN(testDate.valueOf())) { 
		alert ("Out of range");
		// clockRun(0);
		}
	else {
		targetDate = new Date (testDate.valueOf());
		// setDisplay();
	}
}

function calcTime() { // set new time following mode
	var hours = Math.round (document.time.hours.value), mins = Math.round (document.time.mins.value), 
		secs = Math.round (document.time.secs.value), ms = Math.round (document.time.ms.value) ;
	let testDate = new Date (targetDate.valueOf());
	switch (document.TZmode.TZcontrol.value) {
		case "" : testDate.setHours(hours, mins, secs, ms); break;
		case "UTC" : testDate.setUTCHours(hours, mins, secs, ms); break;
	}
	if (isNaN(testDate.valueOf())) alert ("Out of range")
	else {
		targetDate = new Date (testDate.valueOf());
	}
}

var addedTime = 60000; //Global variable, time to add or substract, in milliseconds.
function changeAddTime() {
	let msecs = +document.timeShift.shift.value; 
	if (isNaN(msecs) || msecs <= 0) 
		alert ("Invalid input")
	else
		{ 
		addedTime = msecs; // Global variable updated
		document.timeShift.shift.value = msecs; // Confirm changed value
		}
	}

function addTime (sign = 1) { // addedTime ms is added or subtracted to or from the Timestamp.
	changeAddTime();	// Force a valid value in field
	let testDate = new Date(targetDate.valueOf());
	testDate.setTime (testDate.getTime()+sign*addedTime); 
	if (isNaN(testDate.valueOf())) alert ("Out of range")
	else {
		targetDate = new Date (testDate.valueOf());
		// setDisplay();
	}
}

function setDateToNow(){ // Self explanatory
    targetDate = new Date(); // set new Date object.
	// setDisplay ();
}

function setUTCHoursFixed (UTChours=0) { // set UTC time to the hours specified.
	if (typeof UTChours == undefined)  UTChours = document.UTCset.Compute.value;
	let testDate = new Date (targetDate.valueOf());
	testDate.setUTCHours(UTChours, 0, 0, 0);
	if (isNaN(testDate.valueOf())) alert ("Out of range")
	else {
		targetDate = new Date (testDate.valueOf());
		// setDisplay();
	}
}
