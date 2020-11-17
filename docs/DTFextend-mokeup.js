/* DateExtendTest: test custom calendars formatting capabilities. 
To be used with DTFextend-mokeup-en.html
Character set is UTF-8
Contents: general structure:
	setDisplay: modify displayed page after a change
	putStringOnOptions : specifically modify date strings. Called by setDisplay.
Required:
	DateExtended
*/
/*Versions:	M2020-11-27 first version (cloned from a custom calendar test page)
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
const Chronos = 
	{DAY_UNIT : 86400000,
	HOUR_UNIT : 3600000,
	MINUTE_UNIT : 60000,
	SECOND_UNIT : 1000}

var 
	targetDate = new ExtDate("8601"),
	shiftDate = new ExtDate (undefined,targetDate.getTime() - targetDate.getRealTZmsOffset()),
	TZSettings = {mode : "TZ", msoffset : 0},	// initialisation to be superseded
	TZDisplay = ""; 

function putStringOnOptions() { // get Locale, calendar indication and Options given on page, print String. Called by setDisplay
	let Locale = document.LocaleOptions.Locale.value;
	let unicodeAskedExtension = document.LocaleOptions.UnicodeExt.value;
	var askedOptions, usedOptions, extAskedOptions, extUsedOptions, cusAskedOptions; 

	// Test specified Locale
	try {
		if (Locale == "")
			askedOptions = new Intl.DateTimeFormat()
		else askedOptions = new Intl.DateTimeFormat(Locale);
	}
	catch (e) {
		alert (e.message + "\nCheck locale"); // e.fileName + " line " + e.lineNumber); 
		return
	}
	Locale = askedOptions.resolvedOptions().locale;	// Locale is no longer empty
	Locale = Locale.includes("-u-") ?  Locale.substring (0,Locale.indexOf("-u-")) : Locale; // Remove Unicode extension
	
	// Add extension
	let unicodeExtension = "-u";
	let extendedLocale = Locale;
	if (unicodeAskedExtension !== "") unicodeExtension += "-" + unicodeAskedExtension;
	if (unicodeExtension !== "-u") extendedLocale += unicodeExtension; 
	
	// Add presentation options
	let Options = {}; 
	if	(document.LocaleOptions.LocaleMatcher.value != "")	Options.localeMatcher = document.LocaleOptions.LocaleMatcher.value;
	if	(document.LocaleOptions.FormatMatcher.value != "")	Options.formatMatcher = document.LocaleOptions.FormatMatcher.value;
	if	(document.LocaleOptions.TimeZone.value != "")	Options.timeZone = document.LocaleOptions.TimeZone.value;
	if	(document.LocaleOptions.Calendar.value != "")	Options.calendar = document.LocaleOptions.Calendar.value;
	if	(document.LocaleOptions.DateStyle.value != "") 	Options.dateStyle = document.LocaleOptions.DateStyle.value;
	if	(document.LocaleOptions.TimeStyle.value != "") 	Options.timeStyle = document.LocaleOptions.TimeStyle.value;
	if	(document.LocaleOptions.Weekday.value != "")	Options.weekday = document.LocaleOptions.Weekday.value;
	if	(document.LocaleOptions.Day.value != "") 	Options.day = document.LocaleOptions.Day.value;
	if	(document.LocaleOptions.Month.value != "") 	Options.month = document.LocaleOptions.Month.value;
	if 	(document.LocaleOptions.Year.value != "")	Options.year = document.LocaleOptions.Year.value;
	if	(document.LocaleOptions.Era.value != "")	Options.era	= document.LocaleOptions.Era.value;
	if	(document.LocaleOptions.Hour.value != "")	Options.hour = document.LocaleOptions.Hour.value;
	if	(document.LocaleOptions.Minute.value != "")	Options.minute = document.LocaleOptions.Minute.value;
	if	(document.LocaleOptions.Second.value != "")	Options.second	= document.LocaleOptions.Second.value;
	if	(document.LocaleOptions.TimeZoneName.value != "")	Options.timeZoneName	= document.LocaleOptions.TimeZoneName.value;
	if	(document.LocaleOptions.Hour12.value != "")	Options.hour12	= (document.LocaleOptions.Hour12.value == "true");
	if	(document.LocaleOptions.HourCycle.value != "")	Options.hourCycle	= document.LocaleOptions.HourCycle.value;
	if	(document.LocaleOptions.AmPm.value != "")	Options.dayPeriod	= document.LocaleOptions.AmPm.value;
	if	(document.LocaleOptions.eraDisplay.value != "")	Options.eraDisplay	= document.LocaleOptions.eraDisplay.value;
	
	// Test that Options set is acceptable. If not, display with empty options object
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

	
	// Display all effective options
	document.LocaleOptions.Elocale.value = usedOptions.locale;
	document.LocaleOptions.Ecalend.value = usedOptions.calendar;
	document.LocaleOptions.Enum.value = usedOptions.numberingSystem;
	document.LocaleOptions.EtimeZoneName.value = usedOptions.timeZoneName;
	document.LocaleOptions.EdateStyle.value = usedOptions.dateStyle;
	document.LocaleOptions.EtimeStyle.value = usedOptions.timeStyle ;
	document.LocaleOptions.ETimeZone.value = usedOptions.timeZone;
	document.LocaleOptions.Eweekday.value = usedOptions.weekday;
	document.LocaleOptions.Eera.value = usedOptions.era;
	document.LocaleOptions.Eyear.value = usedOptions.year;
	document.LocaleOptions.Emonth.value = usedOptions.month;
	document.LocaleOptions.Eday.value = usedOptions.day;
	document.LocaleOptions.Ehour.value = usedOptions.hour;
	document.LocaleOptions.Eminute.value = usedOptions.minute;
	document.LocaleOptions.Esecond.value = usedOptions.second;
	document.LocaleOptions.Ehour12.checked = usedOptions.hour12;
	document.LocaleOptions.EhourCycle.value = usedOptions.hourCycle;
	document.LocaleOptions.EAmPm.value = usedOptions.dayPeriod;
	
	// Display all effective options for extended formatter
	//document.LocaleOptions.Xlocale.value = extUsedOptions.locale;
	//document.LocaleOptions.Xcalend.value = extUsedOptions.calendar;
	//document.LocaleOptions.Xnum.value = extUsedOptions.numberingSystem;
	//document.LocaleOptions.XdateStyle.value = extUsedOptions.dateStyle;
	//document.LocaleOptions.XtimeStyle.value = extUsedOptions.timeStyle ;
	//document.LocaleOptions.XTimeZone.value = extUsedOptions.timeZone;
	document.LocaleOptions.XtimeZoneName.value = extUsedOptions.timeZoneName;
	document.LocaleOptions.Xweekday.value = extUsedOptions.weekday;
	document.LocaleOptions.Xera.value = extUsedOptions.Xra;
	document.LocaleOptions.Xyear.value = extUsedOptions.year;
	document.LocaleOptions.Xmonth.value = extUsedOptions.month;
	document.LocaleOptions.Xday.value = extUsedOptions.day;
	document.LocaleOptions.Xhour.value = extUsedOptions.hour;
	document.LocaleOptions.Xminute.value = extUsedOptions.minute;
	document.LocaleOptions.Xsecond.value = extUsedOptions.second;
	document.LocaleOptions.Xhour12.checked = extUsedOptions.hour12;
	document.LocaleOptions.XhourCycle.value = extUsedOptions.hourCycle;
	document.LocaleOptions.XAmPm.value = extUsedOptions.dayPeriod;
	
	/*
	// Build "reference" format object with asked options and ISO8601 calendar, and display non-Unicode calendar string
	extendedLocale = Locale + "-u-ca-iso8601" + (unicodeAskedExtension == "" ? "" : "-" + unicodeAskedExtension); // Build Locale with ISO8601 calendar
	let referenceFormat = new Intl.DateTimeFormat(extendedLocale,usedOptions);
	
	let referenceExtFormat = new ExtDateTimeFormat(Locale,Options);
	extUsedOptions = referenceExtFormat.resolvedOptions();
	referenceExtFormat = new ExtDateTimeFormat(extUsedOptions.locale,extUsedOptions);
*/
	// Certain Unicode calendars do not give a proper result: here is the control code.
	let valid = ExtDateTimeFormat.unicodeValidDateinCalendar(targetDate, extUsedOptions.timeZone);
	// Display with extended DateTimeFormat
	document.getElementById("Xstring").innerHTML = (valid ? "" : "(!) ") + extAskedOptions.format(targetDate);
	// Display custom calendar string - error control

	let	myUnicodeElement = document.getElementById("Ustring");
	try { 
		myUnicodeElement.innerHTML = (valid ? "" : "(!) ") + askedOptions.format(targetDate); // askedOptions.format(targetDate); 
		}
	catch (e) { 
		alert (e.message + "\n" + e.fileName + " line " + e.lineNumber);
		myUnicodeElement.innerHTML = "(!)"; 
		}

}

function setDisplay () { // Considering that targetDate time has been set to the desired date, this routines updates all form fields.

	// Time section
	// Initiate Time zone mode for the "local" time from main display
	TZSettings.mode = document.TZmode.TZcontrol.value;
	TZDisplay = TZSettings.mode == "UTC" ? "UTC" : "";
	/** TZSettings.msoffset is JS time zone offset in milliseconds (UTC - local time)
	 * Note that getTimezoneOffset sometimes gives an integer number of minutes where a decimal number is expected
	*/
	TZSettings.msoffset = targetDate.getRealTZmsOffset().valueOf();
	let myElement = document.getElementById("sysTZoffset");
	myElement.innerHTML = new Intl.NumberFormat().format(targetDate.getTimezoneOffset());
	let
		systemSign = (TZSettings.msoffset > 0 ? 1 : -1), // sign is as of JS convention
		absoluteRealOffset = systemSign * TZSettings.msoffset,
		absoluteTZmin = Math.floor (absoluteRealOffset / Chronos.MINUTE_UNIT),
		absoluteTZsec = Math.floor ((absoluteRealOffset - absoluteTZmin * Chronos.MINUTE_UNIT) / Chronos.SECOND_UNIT);
	switch (TZSettings.mode) {
		case "UTC" : 
			TZSettings.msoffset = 0; // Set offset to 0, but leave time zone offset on display
		case "TZ" : 
			document.TZmode.TZOffsetSign.value = systemSign;
			document.TZmode.TZOffset.value = absoluteTZmin;
			document.TZmode.TZOffsetSec.value = absoluteTZsec;
			break;
/*		case "Fixed" : TZSettings.msoffset = // Here compute specified time zone offset
			- document.TZmode.TZOffsetSign.value 
			* (document.TZmode.TZOffset.value * Chronos.MINUTE_UNIT + document.TZmode.TZOffsetSec.value * Chronos.SECOND_UNIT);
*/	}

	shiftDate = new ExtDate (undefined,targetDate.getTime() - TZSettings.msoffset);	// The UTC representation of targetDate date is the local date of TZ
	
	// Initiate Gregorian form with present local date
    document.gregorian.year.value = shiftDate.getUTCFullYear(); // uses the local variable - not UTC
    document.gregorian.monthname.value = shiftDate.getUTCMonth() + 1; // Display month value in 1..12 range.
    document.gregorian.day.value = shiftDate.getUTCDate();
	try {
		document.gregorian.dayofweek.value = (new Intl.DateTimeFormat(undefined, {weekday : "long", timeZone : "UTC"})).format(shiftDate);
		}
	catch (e) {
		alert (e.message + "\n" + e.fileName + " line " + e.lineNumber);
		document.gregorian.dayofweek.value = "(!)"; 
		}
	// Update local time fields - using	Date properties
	document.time.hours.value = shiftDate.getUTCHours();
	document.time.mins.value = shiftDate.getUTCMinutes();
	document.time.secs.value = shiftDate.getUTCSeconds();
	document.time.ms.value = shiftDate.getUTCMilliseconds();

	myElement = document.getElementById("ISOdatetime");
	myElement.innerHTML = targetDate.toISOString();
	myElement = document.getElementById("Posixnumber");
	myElement.innerHTML = targetDate.valueOf();

	// Write custom and Unicode strings following currently visible options
	putStringOnOptions();

}
