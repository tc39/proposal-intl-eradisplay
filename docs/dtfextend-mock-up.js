/* DateExtendTest: test custom calendars formatting capabilities. 
To be used with dtfextend-mock-up.html
Character set is UTF-8
Contents: general structure:
	setDisplay: modify displayed page after a change
	putStringOnOptions : specifically modify date strings. Called by setDisplay.
Required:
	DateExtended
*/
/* Version:	M2021-05-02 fix fetching of era option for extended version
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
const Chronos = 
	{DAY_UNIT : 86400000,
	HOUR_UNIT : 3600000,
	MINUTE_UNIT : 60000,
	SECOND_UNIT : 1000}

var 
	targetDate = new ExtDate(),
	shiftDate = new ExtDate (undefined,targetDate.getTime() - targetDate.getRealTZmsOffset()),
	TZSettings = {mode : "TZ", msoffset : 0},	// initialisation to be superseded
	TZDisplay = ""; 

function putStringOnOptions() { // get Locale, calendar indication and Options given on page, print String. Called by setDisplay
	let Locale = document.Locale.Locale.value;
	let unicodeAskedExtension = document.Locale.UnicodeExt.value;
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
function calcGregorian() {
	var 
	 day =  Math.round (document.gregorian.day.value),
	 month = Math.round (document.gregorian.monthname.value),
	 year =  Math.round (document.gregorian.year.value);
	 // HTML controls that day, month and year are numbers
	let testDate = new Date (targetDate.valueOf());
	switch (TZSettings.mode) {
		case "TZ": 
			testDate.setFullYear(year, month-1, day); 	// Set date object from calendar date indication, without changing time-in-the-day.
			break;
		case "UTC" : testDate.setUTCFullYear(year, month-1, day);
			break;
		} 
	if (isNaN(testDate.valueOf())) alert ("Out of range")
	else {
		// Here, no control of date validity, leave JS recompute the date if day of month is out of bounds
		targetDate = new ExtDate (undefined,testDate.valueOf());
		setDisplay();
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
	testDate.setTime (testDate.getTime()+sign*dayOffset*Chronos.DAY_UNIT);
	if (isNaN(testDate.valueOf())) { 
		alert ("Out of range");
		// clockRun(0);
		}
	else {
		targetDate = new ExtDate (undefined,testDate.valueOf());
		setDisplay();
	}
}

function calcTime() { // Here the hours are deemed local hours
	var hours = Math.round (document.time.hours.value), mins = Math.round (document.time.mins.value), 
		secs = Math.round (document.time.secs.value), ms = Math.round (document.time.ms.value);
	if (isNaN(hours) || isNaN (mins) || isNaN (secs) || isNaN (ms)) 
		alert ("Invalid date " + '"' + document.time.hours.value + '" "' + document.time.mins.value + '" "' 
		+ document.time.secs.value + '.' + document.time.ms.value + '"')
	 else {
	  let testDate = new ExtDate (undefined,targetDate.valueOf());
	  switch (TZSettings.mode) {
		case "TZ" : testDate.setHours(hours, mins, secs, ms); break;
		case "UTC" : testDate.setUTCHours(hours, mins, secs, ms); break;
/*		case "Fixed" : 
			testDate = new Date(ExtDate.fullUTC (document.gregorian.year.value, document.gregorian.monthname.value, document.gregorian.day.value));
			testDate.setUTCHours(hours, mins, secs, ms); 
			testDate.setTime(testDate.getTime() + TZSettings.msoffset);
*/		}
		if (isNaN(testDate.valueOf())) alert ("Out of range")
		else {
			targetDate = new ExtDate (undefined,testDate.valueOf());
			setDisplay();
		}
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
		targetDate = new ExtDate (undefined,testDate.valueOf());
		setDisplay();
	}
}

function setDateToNow(){ // Self explanatory
    targetDate = new ExtDate(); // set new Date object.
	setDisplay ();
}
function setUTCHoursFixed (UTChours=0) { // set UTC time to the hours specified.
	if (typeof UTChours == undefined)  UTChours = document.UTCset.Compute.value;
	let testDate = new Date (targetDate.valueOf());
	testDate.setUTCHours(UTChours, 0, 0, 0);
	if (isNaN(testDate.valueOf())) alert ("Out of range")
	else {
		targetDate = new ExtDate (undefined,testDate.valueOf());
		setDisplay();
	}
}

