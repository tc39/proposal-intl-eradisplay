/* dateextended.js : Extension of Date and Intl.DateTimeFormat objects
Character set is UTF-8
Purpose
	Handle custom calendars
	New functionnalities for Intl.DateTimeFormat
Contents
	Description of Custom calendar objects
	ExtDate: extension of Date object
	One new method for Date for generalised time zone offset management
	ExtDateTimeFormat: extension of Intl.DateTimeFormat
*/
/*	Version	M2021-06-13	
		Error not as objects, but close to the corresponding code.
		Suppress unicodeValidDateinCalendar, calendar validity control (all calendars work since ICU 68)
	M2021-01-09 set h12 and hourCycle as in original Intl
	M2021-01-08 - when a field is undefined and should be displayed, tagging as "field" yield a void field
	M2020-12-27 no export
	M2020-12-18 resolving partly eraDisplay at construction
	M2020-12-08 Use import and export
	M2020-12-07	Do not change time part if language is among right-to-left.
	M2020-11-29 control calendar parameter to ExtDate and ExtDateTimeFormat constructors
	M2020-11-27 Modify literals of time part only, not of date part, solve a few bugs
		only replace ":" literals in time part of string with " h ", " min " or " s " indication if corresponding option is "numeric"
		add getISOFields method
		toCalString displays ISOString for built-in calendars
		two bugs in pseudo-properties functions day and inLeapYear
		bug in setFromFields, one field was forgotten
		empty option case of DateTimeFormat was not properly evaluated
		setFromFields: day field was not taken into account
	M2020-11-25 replace any literal other than " " that follows numeric field with option "numeric" (not with option "2-digit")
	M2020-11-24 - Add week-related fields added to date object for formatToParts
	M2020-11-22 complete comments
	M2020-11-19 Adapt to monthBase = 1 while keeping ancient getter and setter with monthBase = 0, add TZ parameter
	M2020-11-17 consolidate files
	M2020-10 : works in progress
	Sources: display function for the Julian and the Milesian calendars
*/
/* Copyright Miletus 2020 - Louis A. de Fouquières
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
	1. The above copyright notice and this permission notice shall be included
	in all copies or substantial portions of the Software.
	2. Changes with respect to any former version shall be documented.

The software is provided "as is", without warranty of any kind,
express of implied, including but not limited to the warranties of
merchantability, fitness for a particular purpose and noninfringement.
In no event shall the authors of copyright holders be liable for any
claim, damages or other liability, whether in an action of contract,
tort or otherwise, arising from, out of or in connection with the software
or the use or other dealings in the software.
Inquiries: www.calendriermilesien.org
*/
/*	Model for custom calendar classes or objects, inspired by Temporal but adapted to Date & DateTimeFormat
class CustomCalendar {	
	** Properties **
	*id = (a string) 	// a specific name for this calendar, for the ExtDate.toCalString method
	*canvas: the name of a built-in calendar that provides the initial structure, and possible the names of months, weekdays etc. for the target calendar.
	pldr = a DOM		// the "private locale data register" to use for displaying certain fields (e.g. months) with ExtDateTimeFormat
	eras : an array of the string codes for the eras for this calendar, if eras used.
	stringFormat : a field expressing how date string is computed. Possible values are
		"built-in" : compute parts of displayed string as an ordinary DateTimeFormat, and then modify each part as stated by "partsFormat" object
		"fields" : general structure of string as stated from options, but values changed following fields of this calendar, and modified as stated by "partsFormat"
				// as of now, this option only works with Roman-like calendars
		"auto" (default): means "built-in".
	partsFormat : an Object, that specify how to format each part corresponding to each date field. Each tag is the name of a part to display (e.g. "era").
		Each value is itself an object with the following fields:
			mode: how to find the value: 
				"cldr" : leave value set by standard FormatToParts (equivalent to no object for this part name).
				"field": put field as is; if undefined, put "". For test and debug, and for void fields.
				"list" : (enumerable) values indicated in "source" field; if field is not a number, index to be found in "codes"
				"pldr" : values to be found in calendar.pldr, a DOM which represents a "private locale data register" designated with its URI/URL or identifier
			source : the reference to the values, if "list" or "pldr".
			codes : in case of "list" for a non-numeric field, the array of codes to search for
		(note: maybe we could just put "source" and test typeof source, to be seen later)
	** Methods **
	*fieldsFromCounter (number) 	// from a date stamp deemed UTC, give date and hour fields. Year is full year, month is 1-based (TZ not handled at this level). 
		return {fields} // if (fields.era = undefined), year (if existing) is fullYear. Otherwhise a fullYear() method is provided. You may always get fullYear. 
	*counterFromFields (fields) {	// from a compound object that expresses the date in calendar (with month in base 1), create the Posix Value for the date (UTC)
		return (number)	// specify fields as in calendar. If era is specified, year is relative to era. If not, it is a fullYear.
	}
	*buildDateFromFields (fields, construct = ExtDate) { let a constructor build the date.
		return (ExtDate or extended object)
	}
	*weekFieldsFromCounter (timeStamp) {	// week fields, from a timestamp deemed UTC
		weekNumber : number of the week in the year
		weekday : number of the day in the week, 1..7 for Monday..Sunday
		weekYearOffset: number to add to current fullYear to get fullYear the week belongs to
		weeksInYear : number of weeks in the year the week belongs to
	}
	*fullYear (fields) : the signed integer number that unambigously represents the year in the calendar. If in regressive era, the year is translated into a negative or null number.
	*inLeapYear (fields) is this date a leap year
	// Possible fields elements from ExtDate
	era (date) : the era code
	year (date) : the year number, to be combined with era (may differ from fullYear)
	month (date) :  month number, first month is 1
	day (date) : day number in month, first day is 1
	// Calendar dependant characteristics, used in Temporal
	daysinWeek (date) (from weekFieldsFromCounter)
	dayOfWeek (date) (from weekFieldsFromCounter)
	daysInYear (date) (computed)
	dayOfYear (date) (computed)
	weekOfYear (date) (from weekFieldsFromCounter)
	yearOfWeek (date) (from weekFieldsFromCounter)
	daysInMonth (date) (computed)
	monthsInYear (date) (simple)
	(no Duration method in this extended Date object)
}
	// Elements for ExtDateTimeFormat
	eraDisplay field is deemed added to options, (see proposal), value are : "auto" (default) / "always" / "never"
	a calendar field is optional. This field may only be a custom calendar (options exist fir built-in calendars).
*/
"use strict";
/** Compute the system time zone offset at this date, in ms. This extension is not exported.
 * rationale: with Chrome (and others ?), the TZOffset returned value losses the seconds. 
 * @returns {number} the time zone offset in milliseconds: UTC - local (same sign as TimezoneOffset)
*/
Date.prototype.getRealTZmsOffset = function () { // this prototype extension necessary prior to extending Date, and this method is redefined and enlarged within ExtDate.
/** Gregorian coordinates of the system local date */
	let localCoord = 
		{year: this.getFullYear(), month: this.getMonth(), date: this.getDate(), 
		hours: this.getHours(), minutes: this.getMinutes(), seconds: this.getSeconds(), milliseconds: this.getMilliseconds()};
/** UTC Date constructed with the local date coordinates */
	let localDate = new Date (0); 
	localDate.setUTCFullYear (localCoord.year, localCoord.month, localCoord.date); 
	localDate.setUTCHours (localCoord.hours, localCoord.minutes, localCoord.seconds, localCoord.milliseconds);
	return this.valueOf() - localDate.valueOf()
}
/** Extend Date object to cater with custom calendars, before Temporal is available
*/
class ExtDate extends Date {
	/** Construct a date to be deployed in a custom calendar. Date elements shall be integer.
	 * @param (Object) calendar : 
			the calendar object that describes the custom calendar,
			or a string that refers to a built-in calendar; however computations are not implemented in this version, except for "iso8601" (default) and "gregory".
			or undefined : deemed to be "iso8601"
	 * @param (parameter list): the arguments as passed to the Date object.
		empty -> now
		one numerical argument: Posix counter in milliseconds, as for Date.
		one string argument: an ISO string for the date, passed to Date.
		several numerical arguments: the arguments of Date constructor, as would be passed to Date, but
			year is full year, e.g. year 1 is 0001, not 1901,
			first month is always 1, not 0,
			the date elements are those of the target calendar, not of gregory neither iso8601; year is always a full year, not era dependant.
	 * @return Date value. The date is deemed local in system time zone.
	*/
	constructor (calendar, ...dateArguments) {
		let myCalendar = (calendar == undefined) ? "iso8601" : calendar;
		switch (typeof myCalendar) {
			case "string" : switch (myCalendar) {
				case "iso8601" : case "gregory" : break;
				default : throw new RangeError ("Only iso8601 and gregory built-in calendars enable ExtDate object construction, not " + myCalendar);
			} break;
			case "object": ; break; // ExtDate constructed although calendar object may be incomplete
			default : throw new TypeError ('Calendar parameter is neither a string nor an object'); 
		}
		if (dateArguments.length > 1) {	// more than 1 argument passed to Date: a date description, not a time stamp.
			if (myCalendar == "iso8601" || myCalendar == "gregory") { // First arguments are a year and a month. Year is alwasy full, month is always based 1.
				dateArguments[1]--;		// month argument decremented for the legacy Date
				super (...dateArguments);
				if (dateArguments[0] < 100 && dateArguments[0] >= 0) this.setFullYear(dateArguments[0]); 
				} 
			else {	// analyse fields in terms of the specified custom calendar
				let fields = new Object;
				for (let i = 0; i < dateArguments.length; i++) {
					if (!Number.isInteger(dateArguments[i])) throw new TypeError 
						('Argument ' + ExtDate.numericFields[i].name + ' is not integer: ' + dateArguments[i]);
					fields[ExtDate.numericFields[i].name] = dateArguments[i];	
				}
				let UTCDate = new Date (calendar.counterFromFields (fields));
				super (UTCDate.valueOf() + UTCDate.getRealTZmsOffset());
			}
		}
		else	// O or 1 argument for legacy Date, i.e. Now (0 argument), a string or a timestamp. Nothing calendar-dependant.
			super (...dateArguments);
		this.calendar = myCalendar;		// because this may only appear after super.
	}
	/** Basic data
	*/
	static numericFields = [ {name : "year", value : 0}, {name : "month", value : 1}, {name : "day", value : 1},	// year is deemed full year, no era implied
		{name : "hours", value : 0}, {name : "minutes", value : 0}, {name : "seconds", value : 0}, {name : "milliseconds", value : 0} ] // names of numeric date elements
	/** Basic utility fonction: get UTC date from ISO fields in UTC, including full year i.e. 79 means year 79 AD, when Pompeii was buried under volcano ashes.
	*/
	static fullUTC (fullYear, month, day, hour, minute, second, millisecond) {
		arguments[1]--;		// From base 1 month to monthIndex
		let myDate = new Date(Date.UTC(...arguments));	// Date.UTC requires at least one argument, which is always the UTC year, shifted to 1900-1999 if specified 0..99
		if (fullYear <100 && fullYear >=0) myDate.setUTCFullYear(fullYear);
		return myDate.valueOf()
	}
	/** Compute the system time zone offset at this date, or the time zone offset of a named time zone in ms.
	 * rationale: with Chrome (and others ?), the TZOffset returned value losses the seconds. 
	 * @param (string) TZ: the named time zone. If undefined or "", system timezone.
	 * @returns {number} the time zone offset in milliseconds: UTC - local (same sign as TimezoneOffset)
	*/
	getRealTZmsOffset (TZ) {	// 2 functions in one: if TZ == undefined, compute real offset between system TZ offset at this time. if TZ = "UTC", 0. 
								// if TZ is a named zone, use toResolvedLocalDate in order to compute offset in ms.
		if (TZ == "UTC") return 0;		// avoid complex computation for a trivial and frequent case
		if (TZ == undefined || TZ == "") {	// system time zone
		// Gregorian coordinates of the system local date
			let localCoord = 
				{year: this.getFullYear(), month: this.getMonth(), date: this.getDate(), 
				hours: this.getHours(), minutes: this.getMinutes(), seconds: this.getSeconds(), milliseconds: this.getMilliseconds()};
		// UTC Date constructed with the local date coordinates
			let localDate = new Date (0); 
			localDate.setUTCFullYear (localCoord.year, localCoord.month, localCoord.date); 
			localDate.setUTCHours (localCoord.hours, localCoord.minutes, localCoord.seconds, localCoord.milliseconds);
			return this.valueOf() - localDate.valueOf()
		}
		else return this.valueOf() - this.toResolvedLocalDate(TZ).valueOf()
	}
	/** Construct a date that represents the "best fit" value of the given date shifted as UTC to the named time zone. 
	 * The computation of the time zone is that of Unicode, or of the standard TZOffset if Unicode's is not available.
	 * @param {Date} Date object the method is associated to, - the Date object to convert.
	 * @param {string} TZ - the name of the time zone.
	 * @returns {Date} - the best possible result given by the navigator.
	 */
	toResolvedLocalDate = function (TZ) { // This routine assumes that Intl.DateTimeFormat works. If not, exception is thrown.
		var	localTime = new ExtDate (this.calendar,this.valueOf()); // Initiate a draft date that is the same as this.
		if (TZ == "UTC") return localTime; // Trivial case: time zone asked is UTC.
		// There is no try ! TZ has to be a valid TZ name.
		if (TZ == (undefined || ""))
			var localOptions = new Intl.DateTimeFormat ("en-GB")
		else
			var localOptions = new Intl.DateTimeFormat ("en-GB", {timeZone : TZ}); // Submit specified time zone
		// Here localOptions is set with valid asked timeZone
		// Set a format object suitable to extract numeric components from Date string
		let numericSettings = {weekday: 'long', era: 'short', year: 'numeric',  month: 'numeric',  day: 'numeric',  
				hour: 'numeric',  minute: 'numeric',  second: 'numeric', hour12: false};
		if (!(TZ == (undefined || ""))) numericSettings.timeZone = TZ;	
		var numericOptions = new Intl.DateTimeFormat ("en-GB", numericSettings);	// gregory calendar in British english
		let	localTC = numericOptions.formatToParts(this); // Local date and time components at TZ
		return new ExtDate(this.calendar, ExtDate.fullUTC (
			localTC[8].value == "BC" ? 1-localTC[6].value : +localTC[6].value, // year component (a full year)
			+localTC[4].value, +localTC[2].value, // month and date components (month is 1..12)
			+localTC[10].value, +localTC[12].value, +localTC[14].value, //Hours, minutes and seconds
			localTime.getUTCMilliseconds())); // We can't obtain milliseconds from DateTimeFormat, but they always remain the same while changing time zone.
	}
	/** calendar date fields generator method from Date.valueOf(), local or UTC. Month in range 1..12
	 * @param (string) TZ: if "" or undefined (default value), local date and time. If "UTC", UTC date and time.
	 * @return (Object) object with date fields { (era if applicable), year, month (range 1..12), day, hours, minutes, seconds, milliseconds}
	*/
	getFields(TZ) {
		// compute offset to use
		var offset = this.getRealTZmsOffset(TZ), 
			shiftDate;
		// compute Fields from a shifted value. Month is in the range 1..12
		if (typeof this.calendar == "string") switch (this.calendar) {	// calendar is a string: a built-in calendar, presently only "gregory" or "iso8601"
			case "iso8601": case "gregory" : 
				shiftDate = new Date (this.valueOf() - offset)
				return {
					year : shiftDate.getUTCFullYear(),
					month : shiftDate.getUTCMonth()+1,
					day : shiftDate.getUTCDate(),
					hours : shiftDate.getUTCHours(),
					minutes : shiftDate.getUTCMinutes(),
					seconds : shiftDate.getUTCSeconds(),
					milliseconds : shiftDate.getUTCMilliseconds()
				}
			default : throw new RangeError ("Only iso8601 and gregory built-in calendars enable getFields method.");
		}
		else 
			return this.calendar.fieldsFromCounter (this.valueOf() - offset);
	}
	/**	ISO fields at UTC, like for Temporal.PlainDate
	*/
	getISOFields() {
		return {
			isoYear : this.getUTCFullYear(),
			isoMonth : this.getUTCMonth() + 1,
			isoDay : this.getUTCDate()
		}
	}
	/** week fields generator method from Date.valueOf(), local or UTC.
	 * @param (string) TZ: if "" or undefined (default value), local date and time. If "UTC", UTC date and time.
	 * @return (Object) object with week fields { weekNumber: number (1..53) of the week. weekday : number (1..7, 1 = Monday) of the weekday,
		weekYearOffset : -1/0/1 shift fullYear by one to obtain the year the week belongs to, weeksInYear: number of weeks in the year the week belons to }
	*/
	getWeekFields(TZ) {
		if (typeof this.calendar == "string") 
			throw new RangeError ("getWeekFields method not available for built-in calendars.")
		else return this.calendar.weekFieldsFromCounter (this.valueOf() - this.getRealTZmsOffset(TZ))
	}
	/** setter method, from the fields representing the date in the target calendar, comput date timestamp 
	 * @param (Object) fields that change from presently held date, i.e. undefined fields are extracted from present date with same TZ. 
	 * @param (string) TZ: if "" or undefined (default value), local date and time. If "UTC", UTC date and time.
	 * @return (number) same return as Date.setTime
	*/
	setFromFields( myFields, TZ ) { // first: set date as UTC 0 h, then setHours. For built-in, limited to UTC or system time zone.
		var fields = {...myFields},	// make an internal copy of asked fields
			startingFields = this.getFields(TZ);
		//Control date fields and complete fields with current value at same time zone
		if (fields.era != undefined) {	// year was specified with era => replace year with fullYear
			fields.year = this.calendar.fullYear (fields);
			delete fields.era;
		}
		if (ExtDate.numericFields.some ( (item) =>  fields[item.name] == undefined ? false : !Number.isInteger(fields[item.name] ) ) ) 
			throw new TypeError 
				(fields.map(({type, value}) => {return value;}).reduce((buf, part)=> buf + ", " + part, "Non integer element in date: "));
		ExtDate.numericFields.forEach ( (item) => { if (fields[item.name] == undefined) 
			fields[item.name] = startingFields[item.name] } );
		// Construct an object with the date indication only, at 0 h UTC
		let dateFields = {}; ExtDate.numericFields.slice(0,3).forEach ( (item) => {dateFields[item.name] = fields[item.name]} );
		if (typeof this.calendar == "string") switch (this.calendar) {
			case "iso8601": case "gregory":
				this.setTime (ExtDate.fullUTC(dateFields.year, dateFields.month, dateFields.day));
				break;
			default: throw new RangeError ("Only iso8601 and gregory built-in calendars enable setFromFields method.");
		}
		else this.setTime(this.calendar.counterFromFields (dateFields));
		// finally set time to this date from TZ, using .setHours or .setUTCHours
		switch (TZ) {
			case undefined: case "": return this.setHours (fields.hours, fields.minutes, fields.seconds, fields.milliseconds);
			case "UTC": return this.setUTCHours (fields.hours, fields.minutes, fields.seconds, fields.milliseconds);
			default : throw new RangeError ("Setting to a given time is only possible in system time zone (blank) or 'UTC': " + TZ);
		}
	}
	/** is this date in a leap year of the calendar ? 
	*/
	inLeapYear ( TZ ) {
		if (typeof this.calendar.inLeapYear != "function") throw new RangeError ('inLeapYear function not provided for this calendar');
		return this.calendar.inLeapYear( this.getFields (TZ) );
	}
	/** extract a simple string with the calendar name, then era code (if applicable), then the figures for year, month, day, and time components.
	 * @param (string) TZ: if "" or undefined (default value), local date and time. If "UTC", UTC date and time.
	 * @return (String) : the date as a string
	*/
	toCalString( TZ ) {
		if (typeof this.calendar == "string") return this.toISOString() + "[c=" + this.calendar + "]";
		let fn6 = Intl.NumberFormat(undefined,{minimumIntegerDigits : 6, useGrouping : false}),
			fn4 = Intl.NumberFormat(undefined,{minimumIntegerDigits : 4, useGrouping : false}), 
			fn3 = Intl.NumberFormat(undefined,{minimumIntegerDigits : 3}),
			fn2 = Intl.NumberFormat(undefined,{minimumIntegerDigits : 2}),
			fzs = Intl.DateTimeFormat(undefined, {hour: "2-digit", minute: "2-digit", second:"2-digit", timeZoneName : "short"}),
			compound = this.getFields (TZ);
		return "[" + this.calendar.id + "]" + ( compound.era == undefined ? "" : "(" + compound.era + ")" )
				+ (compound.year < 10000 && compound.year > 0 ? fn4.format(compound.year) : fn6.format(compound.year)) + "-"
				+ fn2.format(compound.month) + "-"+fn2.format(compound.day) 
				+ "T" + (TZ == undefined || TZ == "" ? fzs.format (this) 
					: fn2.format(compound.hours)+":"+fn2.format(compound.minutes)+":"+fn2.format(compound.seconds)+"."+fn3.format(compound.milliseconds) + "Z")
	}
	fullYear (TZ) {		// year as an unambiguous signed integer
		let fields = this.getFields(TZ);
		return this.calendar.fullYear (fields)
	}
	era (TZ) {			// era code
		let fields = this.getFields(TZ);
		return fields.era
	}
	year (TZ) {			//  Standard year, may be ambiguous if era is not known
		let fields = this.getFields(TZ);
		return fields.year
	}
	month (TZ) {			//  month, numbered starting with 1
		let fields = this.getFields(TZ);
		return fields.month
	}
	day (TZ) {			//  day in month
		let fields = this.getFields(TZ);
		return fields.day
	}
	weekday (TZ) {
		let fields = this.getWeekFields(TZ);
		return fields.weekday
	}
	weekNumber (TZ) {
		let fields = this.getWeekFields(TZ);
		return fields.weekNumber
	}
	weeksInYear (TZ) {
		let fields = this.getWeekFields(TZ);
		return fields.weeksInYear
	}
	fullWeekYear (TZ) {		// unambiguous number of the year the numbered week belongs to
		let fields = this.getWeekFields(TZ);
		return this.fullYear (TZ) + fields.weekYearOffset
	}
}
/** Extend Intl.DateTimeFormat object, display dates in custom calendars.
*/
class ExtDateTimeFormat extends Intl.DateTimeFormat {
	/** Extend and customise capacities to display dates in different calendars
	 * @param (string) locale : as for Intl.DateTimeFormat
	 * @param (Object) options : as for Intl.DateTimeFormat + this field
		eraDisplay : ("never"/"always"/"auto"), default to "auto": should era be displayed ?
	 * @param (Object) a custom calendar. By default, the calendar resolved with locale and options will be used. If specified, and if a Private Locale Data Register is given,
		this will be used for calendar's entity names. If not, the calendar.canvas field refers to the built-in calendar to use.
	*/
	constructor (locale, options, calendar) { // options should not be set to null, not accepted by Unicode
		super (locale, options);
		// Resolve othis.calendarwn options
		this.calendar = calendar;
		if (this.calendar != undefined && typeof this.calendar != "object") throw new TypeError ("invalid calendar parameter, custom calendar must be an object");
		this.options = {...options};	// copy originally asked options.
		this.locale = locale;
		// Resolve case where no field is asked for display : if none of weekday, year, month, day, hour, minute, second is asked, set a standard suite
		if (this.options == undefined) this.options = {};
		if (this.options.weekday == undefined
			&& this.options.year == undefined
			&& this.options.month == undefined
			&& this.options.day == undefined
			&& this.options.hour == undefined
			&& this.options.minute == undefined
			&& this.options.second == undefined
			&& this.options.dateStyle == undefined
			&& this.options.timeStyle == undefined) this.options.year = this.options.month = this.options.day = "numeric";
		this.DTFOptions = super.resolvedOptions();	// should hold all locale resolved information in DTFOptions.locale
		this.options.locale = this.DTFOptions.locale;
		this.options.calendar = (this.calendar != undefined && this.calendar.canvas != undefined) ? this.calendar.canvas : this.DTFOptions.calendar; 
		// set calendar option for standard DTF after calendar.canvas if specified, and re-compute DTF resolved options
		if (this.options.calendar != this.DTFOptions.calendar) { 
			this.DTFOptions.calendar = this.options.calendar 
			this.DTFOptions = new Intl.DateTimeFormat(this.DTFOptions.locale, this.DTFOptions).resolvedOptions();
		}
		this.options.numberingSystem = this.DTFOptions.numberingSystem;
		this.options.timeZone = this.DTFOptions.timeZone;
		this.options.timeZoneName = this.DTFOptions.timeZoneName;
		this.options.dayPeriod = this.DTFOptions.dayPeriod;
		this.options.hour12 = this.DTFOptions.hour12;
		this.options.hourCycle = this.DTFOptions.hourCycle;

		
		// Control and resolve specific options
		if (this.options.eraDisplay == undefined) this.options.eraDisplay = "auto";
		switch (this.options.eraDisplay) {
			case "always":	if (options.era == undefined) options.era = "short";
			case "auto": 	// we should insert here the preceding statement, however this can have impact if era is asked from the user.
			case "never": break;
			default: throw new RangeError ("Unknown option for displaying era: " + this.options.eraDisplay);
		}
		if (this.options.eraDisplay == "auto" && this.DTFOptions.year == undefined) this.options.eraDisplay = "never";
		if (this.calendar != undefined) {
			if (this.calendar.stringFormat == undefined) this.calendar.stringFormat = "auto";
			switch (this.calendar.stringFormat) {
				case "built-in" : case "fields" : case "auto" : break;
				default : throw new RangeError ("Unknown option for date string computing method ('auto', 'built-in' or 'fields'): " + this.calendar.stringFormat);
				}
		}
		// Prepare implied parameters for formatting
		this.lang = this.options.locale.includes("-") ? this.options.locale.substring (0,this.options.locale.indexOf("-")) : this.options.locale;
		this.figure1 = new Intl.NumberFormat (this.options.locale, {minimumIntegerDigits : 1, useGrouping : false});
		this.figure2 = new Intl.NumberFormat (this.options.locale, {minimumIntegerDigits : 2, useGrouping : false});
		this.figure4 = new Intl.NumberFormat (this.options.locale, {minimumIntegerDigits : 4, useGrouping : false});
		this.figure6 = new Intl.NumberFormat (this.options.locale, {minimumIntegerDigits : 6, useGrouping : false});

		// Resolve extended options for timeStyle and dateStyle
		if (this.options.timeStyle != undefined) {
			this.options.timeZoneName = this.options.timeStyle == "full" ? "long" : "short";
			this.options.hour = this.options.minute = this.options.second = "2-digit"; 
			delete this.options.fractionalSecondDigits;
			switch (this.options.timeStyle) {
				case "short" : delete this.options.second;
				case "medium" : delete this.options.timeZoneName;
				case "long" : case "full": ;		// options.timeZoneName already computed
			}
			delete this.options.timeStyle;
		}
		if (this.options.dateStyle != undefined) {
			delete this.options.weekday;
			this.options.day = "numeric"; this.options.month = "short"; this.options.year = "numeric";
			switch (this.options.dateStyle)  {
				case "medium" : break; 
				case "short" : this.options.day = this.options.month = "2-digit"; break;
				case "full" : this.options.weekday = "long";
				case "long" : this.options.month = "long";
			}
			delete this.options.dateStyle;
		}
		// Resolve numeric options for date and time elements: day or hour elements' 2-digit options overwrite other numeric options of other date resp. time elements.
		if (this.options.day == "2-digit" && this.options.month != undefined && this.options.month == "numeric") this.options.month = "2-digit";
		if (this.options.hour == "2-digit" && this.options.minute != undefined) this.options.minute = "2-digit";
		if (this.options.minute == "2-digit" && this.options.second != undefined) this.options.second = "2-digit";
		// Special options for month
		this.monthContext =  // the context for month may be 'format' or 'stand-alone'
				(this.options.day == null && this.options.year == null) ? 'stand-alone' : 'format';
		if (this.options.month != undefined) {
			this.monthWidth = "";
			switch (this.options.month) {	// analyse month asked option, deduct month display option
				case "numeric" : case "2-digit": this.monthWidth = "numeric"; break;
				case "narrow":	this.monthWidth = "narrow" ; break;
				case "short": this.monthWidth = "abbreviated"; break; 
				case "long" : this.monthWidth = "wide"; break;
			}
		}
		// Special options for days of week
		this.dayContext = (this.options.day == null && this.options.month == null && this.options.year == null) ? 'stand-alone' : 'format';
		// stringFormat "fields" option is only possible with a calendar that uses Roman months
		if (this.calendar != undefined && this.calendar.stringFormat == "fields") switch (this.calendar.canvas) {
			case "iso8601": case "gregory": case "buddhist": case "japanese": case "roc": break;
			default : throw new RangeError ("Canvas formatting implemented only from gregory-like built-in calendars: " + this.calendar.canvas);
		}
		// Exclude lunar calendar models as canvas - for now...
		if (this.calendar != undefined) switch (this.calendar.canvas) {
			case "chinese": case "dangi": case "hebraic" : throw new RangeError ("No canvas formatting from luni-solar calendars: " + this.calendar.canvas);
			default : ;
		}
	}	// end constructor
	static dateFieldNames = ["era", "year", "month", "day"]
	/** the resolved options for this object, that slightly differ from those of Intl.DateTimeFormat.
	 * @return (Object) the options revised to reflect what will be provided. eraDisplay is also resolved.
	*/
	resolvedOptions() { 
		return this.options
	}
	/** Should era be displayed for a given date in reference calendar ? manage eraDisplay option.
	*/
	displayEra (aDate) {	// Should era be displayed for this date, with these calendar and options ?
		let date = new ExtDate(this.calendar, aDate.valueOf());
		switch (this.options.eraDisplay) {
			case "never" : return false;
			case "always": return true;
			case "auto":
				if ((this.options.year == null && this.options.era == null)	// Neither year option nor era option set
					|| (this.calendar != undefined && this.calendar.eras == null))		// this calendar has no era whatsoever
					return false;
				var today = new ExtDate(this.calendar);
				if (this.calendar == undefined) {	// a built-in calendar, let us just compare with a particular formatting - with Temporal, this part of code is cancelled
					let eraFormat = new Intl.DateTimeFormat ( this.options.locale, { calendar : this.options.calendar, year : "numeric", era : "short" } ),
						dateParts = eraFormat.formatToParts(date),
						todaysParts = eraFormat.formatToParts(today);
						let eraIndex = dateParts.findIndex(item => item.type == "era");
						if (eraIndex >= 0) return !(dateParts[eraIndex].value == todaysParts[eraIndex].value);
						return false; // no era part was found... answer no because no era part 
				}
				else 	// a custom calendar with era, simplier to use
					return this.calendar.fieldsFromCounter(date.toResolvedLocalDate(this.options.timeZone).valueOf()).era 
						!= this.calendar.fieldsFromCounter(today.toResolvedLocalDate (this.options.timeZone).valueOf()).era ;
		}
	}
	/** Fetch a value from a Private Locale Date Registry (pldr)
	 * @param (String) - name of the element (era / month / dayofweek)
	 * other parameters are linked to this.
	*/
	pldrFetch (name,options,value) {	// return string value to insert to Parts
		const weekdaytypes = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
		let selector = "", Xpath1 = "", node = {}, result = "";
		switch (name) {
			case "era" :	// analyse era options here since at construction it is not known whether era shall be displayed
				switch (options) { 
					case "long" : selector = "eraNames"; break;
					case "short": selector = "eraAbbr"; break;
					case "narrow":selector = "eraNarrow"; break;
				}
				Xpath1 = "/pldr/ldmlBCP47/calendar[@type='"+this.calendar.id+"']/eras/"+selector
					+"']/era[@type="+value+ "]";
				node = this.calendar.pldr.evaluate(Xpath1, this.calendar.pldr, null, XPathResult.STRING_TYPE, null);
				result = node.stringValue;
				// language specific ?
				Xpath1 = "/pldr/ldml/identity/language[@type='"+this.lang
					+"']/../calendar[@type='"+this.calendar.id+"']/eras/"+selector
					+"']/era[@type="+value+ "]",
				node = this.calendar.pldr.evaluate(Xpath1, this.calendar.pldr, null, XPathResult.STRING_TYPE, null);
				if (node.stringValue != "") result = node.stringValue; // If found, replace international name with language specific one.
				return result; break;
			case "month": 	// this.monthWidth may be initiated with month being numeric.
				Xpath1 = "/pldr/ldmlBCP47/calendar[@type='"+this.calendar.id+"']/months/monthContext[@type='"+this.monthContext
					+"']/monthWidth[@type='" + this.monthWidth
					+"']/month[@type="+ value + "]";
				node = this.calendar.pldr.evaluate(Xpath1, this.calendar.pldr, null, XPathResult.STRING_TYPE, null);
				result = node.stringValue;
				// Search if a language specific name exists
				Xpath1 = "/pldr/ldml/identity/language[@type='"+this.lang
					+"']/../calendar[@type='"+this.calendar.id+"']/months/monthContext[@type='"+this.monthContext
					+"']/monthWidth[@type='" + this.monthWidth
					+"']/month[@type=" + value + "]";
				node = this.calendar.pldr.evaluate(Xpath1, this.calendar.pldr, null, XPathResult.STRING_TYPE, null);
				if (node.stringValue != "") result = node.stringValue; // If found, replace international name with language specific one.
				if (result == "")		// no result obtained, give a number, or a 2-digit number if this option is set.
					result = options == "2-digit" ? this.figure2.format(value) : this.figure1.format(value);
				return result;
				break;
			case "weekday": 
				switch (options) {
					case "long" : selector = this.dayContext == "format" ? "wide" : "wide"; break;
					case "short": selector = this.dayContext == "format" ? "abbreviated" : "short"; break;
					case "narrow":selector = this.dayContext == "format" ? "short" : "narrow"; break;
				}
				Xpath1 = "/pldr/ldmlBCP47/calendar[@type='"+this.calendar.id+"']/days/dayContext[@type='"+this.dayContext
					+"']/dayWidth[@type='"+selector
					+"']/day[@type="+weekdaytypes[value] + "]";
				node = this.calendar.pldr.evaluate(Xpath1, this.calendar.pldr, null, XPathResult.STRING_TYPE, null);
				result = node.stringValue;
				// Search if a language specific name exists
				Xpath1 = "/pldr/ldml/identity/language[@type='"+this.lang
					+"']/../calendar[@type='"+this.calendar.id+"']/days/dayContext[@type='"+this.dayContext
					+"']/dayWidth[@type='"+selector
					+"']/day[@type="+weekdaytypes[value] + "]",
				node = this.calendar.pldr.evaluate(Xpath1, this.calendar.pldr, null, XPathResult.STRING_TYPE, null);
				if (node.stringValue != "") result = node.stringValue; // If found, replace international name with language specific one.
				return result; break;
		}
	}
	/** Extend FormatToParts method
	 * @param (Object) the date to be displayed
	 * @return (Array of Object) like the Intl.DateTimeFormat, but enhanced
	*/
	formatToParts (aDate) {	
		// Prepare parameters
		let	date = new ExtDate (this.calendar, aDate),
			options = {...this.options},
			displayEraOfDate = this.displayEra(date); // should Era for this date be displayed
			//DTFOptions = {...this.DTFOptions}, // a copy, with era option set to some value if eraDisplay != "never"

		if (!displayEraOfDate) delete options.era // Alas, this is not enough
		else if (options.era == null) options.era = "short";

		// Determine the date fields (the Temporal Date numeric + era code elements) using UTC representation of expected date
		let myAbsoluteDate = new ExtDate (this.calendar,date.toResolvedLocalDate (options.timeZone).valueOf()), // this the absolute date to print in UTC.
			myDateFields,
			myParts = new Intl.DateTimeFormat(options.locale, options).formatToParts(date), // first try, in desired language and timeZone
			myPartsTZ = myParts.find (item => (item.type == "timeZoneName")),
			myTZ = (myPartsTZ != undefined) ? myPartsTZ.value : null;	// Remember Time zone name since we compute on UTC date values.
		if (this.calendar != undefined) {
			myDateFields = this.calendar.fieldsFromCounter (myAbsoluteDate.valueOf()); // the fields of the date in the calendar, not TZ-dependant.
			try {
				Object.assign(myDateFields, this.calendar.weekFieldsFromCounter (myAbsoluteDate.valueOf()));	// Add week-related fields, including "weekday".
			}
			catch (e) {}	// week fields may not have been implemented. 
		}
		if (this.calendar != undefined && this.calendar.stringFormat == "fields") {	// order of parts is OK, but parts should be computed from fields. Week is considered OK. canvas calendar is Roman.
			options.timeZone = "UTC";
			let myCanvasFields = {...myDateFields};
			let shiftDate = new Date (myAbsoluteDate.valueOf());
			shiftDate.setUTCFullYear(this.calendar.fullYear(myDateFields), myCanvasFields.month-1, 1); // desired year and month, day set to 1.
			let myDOWPart = new Intl.DateTimeFormat(options.locale, {calendar : options.calendar, weekday : options.weekday, timeZone : "UTC" }).format(myAbsoluteDate);
			myParts = new Intl.DateTimeFormat(options.locale, options).formatToParts(shiftDate); // desired month, day = 1.
			// Now put week day, day, and time zone name for these calendars
			if (myParts.findIndex( (item) => item.type == "weekday") >=0 ) myParts.find( (item) => item.type == "weekday").value = myDOWPart;
			if (myParts.findIndex( (item) => item.type == "day") >=0 ) 
				myParts.find( (item) => item.type == "day").value 
					= options.day == "2-digit" ? this.figure2.format(myDateFields.day) : this.figure1.format(myDateFields.day);
			if (myTZ != null) myParts.find (item => (item.type == "timeZoneName")).value = myTZ;
			//if (myParts.findIndex( (item) => item.type == "year") >=0 ) myParts.find( (item) => item.type == "year").value = ""+(myDateFields.year); // the "original" year
			//if (myParts.findIndex( (item) => item.type == "era") >=0 ) myParts.find( (item) => item.type == "era").value = ""+(myDateFields.era); // the coded era
			
		}
		if (this.calendar != undefined && this.calendar.partsFormat != undefined) {
			// some ICU computations have to be anticipated here
			myParts.forEach( function (item, i) { 
				if (this.calendar.partsFormat[item.type] != undefined ) switch (this.calendar.partsFormat[item.type].mode){
					case "cldr" : break; // already computed
					case "field" : myParts[i].value = myDateFields[item.type] == undefined ? "" : myDateFields[item.type] ; break; // insert field directly, blank if undefined
					case "list" : switch (item.type) {
						case "era" : myParts[i].value = this.calendar.partsFormat[item.type].source[this.calendar.partsFormat[item.type].codes.indexOf(myDateFields[item.type])];
							break;
						case "month": switch (options.month) {
							case "2-digit" : myParts[i].value = this.figure2.format(myDateFields.month); break;
							case "numeric" : myParts[i].value = this.figure1.format(myDateFields.month); break;
							default : myParts[i].value = this.calendar.partsFormat[item.type].source[myDateFields[item.type]-1]
						}; break;
						case "weekday" : myParts[i].value = this.calendar.partsFormat[item.type].source[myDateFields[item.type]-1]; break;
						default : // other fields are numeric, not subject to lists;
					} break;
					case "pldr" : 		// fake ICU computations using pldr. 
						//	myInitialParts = {...myParts}; // Initial code was nested the reverse way.
						// myParts = myInitialParts.map ( ({type, value}) => { // .map may not map to itself
						switch (item.type) {
							case "era": myParts[i].value = this.pldrFetch ("era",options.era,
								this.calendar.eras.indexOf(myDateFields[item.type])); break;
							case "year": switch (options.year) {
								case "2-digit" : // Authorised only if displayed year is strictly positive, and with a quote.
									myParts[i].value = (myDateFields.year > 0) ? ("'" + this.figure2.format(myDateFields.year % 100)) : this.figure1.format(myDateFields.year);
									break;
								case "numeric" : myParts[i].value = this.figure1.format(myDateFields.year); 
								}
								break;
							case "month" : 
								myParts[i].value = this.pldrFetch ("month", options.month, (myDateFields.month)); 
								break;
							case "day": switch (options.day) {
								case "2-digit" : myParts[i].value = this.figure2.format(myDateFields.day); break;
								case "numeric" : myParts[i].value = this.figure1.format(myDateFields.day); break;
								} 
								break;
							case "weekday": 
								myParts[i].value = pldrFetch ("weekday", options.weekday, date.dayOfWeek); break;
							case "hour": switch (options.hour) {
								case "numeric" :	// This option is often tranformed in 2-digit with ":" separators, force to individual printing
									let ftime = new Intl.DateTimeFormat (options.locale, {timeZone : options.timeZone, hour : "numeric", timeZoneName : "short"}),
										tparts = ftime.formatToParts(myAbsoluteDate), tindex = tparts.indexOf ( (item) => item.type == "hour" );
									myParts[i].value = this.figure1.format(tparts[tindex].value); 
									break;
								case "2-digit": break;	// do nothing, formatting already done.
								}
								break;
							case "minute": switch (options.minute) {
								case "numeric" :	// This option is often tranformed in 2-digit with ":" separators, force to individual printing
									let ftime = new Intl.DateTimeFormat (options.locale, {timeZone : options.timeZone, minute : "numeric", timeZoneName : "short"}),
										tparts = ftime.formatToParts(myAbsoluteDate), tindex = tparts.indexOf ( (item) => item.type == "minute" );
									myParts[i].value = this.figure1.format(tparts[tindex].value); 
									break;
								case "2-digit": break;	// do nothing, formatting already done.
								}
								break;
							case "second": switch (options.second) {
								case "numeric" :	// This option is often tranformed in 2-digit with ":" separators, force to individual printing
									let ftime = new Intl.DateTimeFormat (options.locale, {timeZone : options.timeZone, second : "numeric", timeZoneName : "short"}),
										tparts = ftime.formatToParts(myAbsoluteDate), tindex = tparts.indexOf ( (item) => item.type == "second" );
									myParts[i].value = this.figure1.format(tparts[tindex].value);
									break;
								case "2-digit": break;	// do nothing, formatting already done.
								}
								break;
							default : throw new RangeError ("Unknown date field: " + item.type);
							}	// End of switch on item.type
						break;	// End of "pldr" case
						}	// End of switch on (this.calendar.partsFormat[item.type].mode)
			} 		// end of forEach function body
			,this);	// Inside the function, this should be the same as here
		}	// End of if (this.calendar.partsFormat != undefined)
		// Erase 2-digit effects on numeric-asked fields, not including related literals.
		// This operation is only done if language is not right-to-left written.
		if (!["ar","fa","he","ji","ug","ur","yi"].some (item => item == this.options.locale.substring(0,2),this)) {
			myParts.forEach ( function (item, i) {
				if (options[item.type] != undefined && options[item.type] == "numeric")	{	// Intl.DateTimeFormat often converts to 2-digit and inserts literals
					if (!isNaN(myParts[i].value)) myParts[i].value = this.figure1.format(item.value);
					switch (item.type) {
						// case "month" : case "day" : if (i+1 < myParts.length && myParts[i+1].value != ' ') myParts[i+1].value = ' '; break; // pb with month before year
						case "hour" : case "minute" : if (i+1 < myParts.length && myParts[i+1].value == ":") myParts[i+1].value = item.type == "hour" ? " h " : " min "; break;
						case "second" : if (i+1 < myParts.length) { if (myParts[i+1].value == " ") myParts[i+1].value = " s " }
										else myParts.push({ type : "literal", value : " s"} );
					}
				}
			},this)
		}
		// suppress era part if required
		if (!displayEraOfDate) {
			let n = myParts.findIndex((item) => (item.type == "era")), nn = n;
			if (n >= 0) { // there is an undesired era section, check whether there is an unwanted literal connected to it
				nn = nn > 0 ? nn-- : nn++ // nn is index of era part neighbour.
				if (myParts[nn].type == "literal") myParts.splice (Math.min(n,nn),2) // Suppress era part and its neighbour
				else myParts.splice (n,1); 
			}
		}
	return myParts
	}
	/** format, from computed parts.
	 * @param (Object) the date to display
	 * @return (string) the string to display
	*/
	format (date) {
		let parts = this.formatToParts (date); // Compute components
		return parts.map(({type, value}) => {return value;}).reduce((buf, part)=> buf + part, "");
	}
}
export {ExtDate, ExtDateTimeFormat}
