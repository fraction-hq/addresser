var allStates = require('./data/states.json');
var usStreetTypes = require('./data/us-street-types.json');
var allCities = require('./data/cities.json');
var usStates = require('./data/us-states.json');
var usCities = require('./data/us-cities.json');



'use strict';

/**
 * Parses a street address
 * @param {string} address
 * @return {string}
 **/

//TODO move this to utils file
function getKeyByValue(object, value) {
	return Object.keys(object).find(key => object[key] === value);
}

function toTitleCase(str) {
  if(!str) return str;
	return str.replace(/\w\S*/g, function(txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
}

//returns a random property of a given object
function randomProperty(obj) {
	var keys = Object.keys(obj)
	return keys[keys.length * Math.random() << 0];
};

var usStreetDirectional = {
	north		: "N",
	northeast	: "NE",
	east		: "E",
	southeast	: "SE",
	south		: "S",
	southwest	: "SW",
	west		: "W",
	northwest	: "NW",
},
canPostalCodeFirst = {
	A	: 'NL', //	Newfoundland and Labrador
	B	: 'NS', //	Nova Scotia	
	C	: 'PE', //	Prince Edward Island	
	E	: 'NB', //	New Brunswick	
	G	: 'QC', //	Eastern Québec
	H	: 'QC', //	Metropolitan Montréal	
	J	: 'QC', //	Western Québec	
	K	: 'ON', //	Eastern Ontario	
	L	: 'ON', //	Central Ontario	
	M	: 'ON', //	Metropolitan Toronto
	N	: 'ON', //	Southwestern Ontario
	P	: 'ON', //	Northern Ontario
	R	: 'MN', //	Manitoba
	S	: 'SK', //	Saskatchewan
	T	: 'AB', //	Alberta
	V	: 'BC', //	British Columbia
	X	: 'NT', //	Northwest Territories (NT) and Nunavut (NU)
	Y	: 'YT', //	Yukon Territory
},
usZipCodesByState = require('./data/us-zipcodes-by-state.json'),
usLine2Prefixes = {
  'APARTMENT'    : 'APT',
  'APP'          : 'APT', // french for apt
	'APT'          : 'APT',
	'BASEMENT'     : 'BSMT',
	'BSMT'         : 'BSMT',
	'BLDG'         : 'BLDG',
	'BUILDING'     : 'BLDG',
	'BUREAU'       : 'BUR', //french for office
	'DEPARTMENT'   : 'DEPT',
	'DEPT'         : 'DEPT',
	'ETAGE'		     : 'FL', //french for Floor
	'ÉTAGE'		     : 'FL',
	'FL'           : 'FL',
	'FLOOR'        : 'FL',
	'FRNT'         : 'FRNT',
	'FRONT'        : 'FRNT',
	'HANGAR'       : 'HNGR',
	'HNGR'         : 'HNGR',
	'LBBY'         : 'LBBY',
	'LOBBY'        : 'LBBY',
	'LOCAL'        : 'RM', // french for room
	'LOT'          : 'LOT',
	'LOWER'        : 'LOWR',
	'LOWR'         : 'LOWER',
	'NUMERO'       : 'NO',
	'NO'           : 'NO',
	'OFC'          : 'OFC',
	'OFFICE'       : 'OFC',
	'PENTHOUSE'    : 'PH',
	'PH'           : 'PH',
	'PIER'         : 'PIER',
	'REAR'         : 'REAR',
	'RM'           : 'RM',
	'ROOM'         : 'RM',
	'SIDE'         : 'SIDE',
	'SLIP'         : 'SLIP',
	'SPACE'        : 'SPC',
	'SPC'          : 'SPC',
	'STE'          : 'STE',
	'STOP'         : 'STOP',
	'SUITE'        : 'STE',
	'TRAILER'      : 'TRLR',
	'TRLR'         : 'TRLR',
	'UNIT'         : 'UNIT',
	'UPPER'        : 'UPPR',
	'UPPR'         : 'UPPR',
	'#'			       : '#',
},
addrsr={
  cleanString:function(input){
    if(!input || typeof input=='boolean') return input;
    if(typeof input=='object'){
      for(let x in input){
        if(input[x]) input[x]=addrsr.cleanString(input[x]);
      }
      return input;
    }
    if(typeof input!='string') return input;

    let _doTrim=function(a){ //some lazyness
      a=a.replace(/\s+/g,' ').trim();
      for(let i=0;i<3;i++)
        a=a.replace(/\s+\,/g,',').trim().replace(/\,+/g,',').trim().replace(/\,+$/,'').trim().replace(/^\,+/,'').trim();
      return a.replace(/\s+/g,' ').trim();
    };
    input=_doTrim(input.trim().replace(/\\n/g,', ').replace(/\n/g,', '));
    
    let _toReplace=[
      ['\n', ', '],
      [', ,', ','],
      ['u00f4', 'ô'],
      ['u00e7', 'ç'],
      ['u00e8', 'è'],
      ['u00e9', 'é'],
      ['u00e0','à'],
      ['Ã´','ô'],
      ['Ã©','é'],
      ['ÃƒÂ¨', 'é']
    ];
    for(let i=0;i<_toReplace.length;i++){
      while(input.indexOf(_toReplace[i][0])!=-1) input=input.replace(_toReplace[i][0],_toReplace[i][1]);
    }
    var output = "";
    for (var i=0; i<input.length; i++) {
      if (input.charCodeAt(i) <= 127 || input.charCodeAt(i) >= 160 && input.charCodeAt(i) <= 255) {
        output += input.charAt(i);
      }
    }
    return _doTrim(output.trim());
  },
  getPlaceInfo:function(input){
    //The best example I could get for that function is:
    // "120 Columbus Drive, Conception Square, Walmart Carbonear Store 3015, Carbonear, Newfoundland and Labrador A1Y 1B3, Canada"
    var placeName='';
    try{
      //match "WhateverPlaceName Square or ThatCity convention center"
      let _placeOrCenter=input.match(/(^|\,)[a-zA-Z\-\s]+ (Square|Place|Plaza|Center)(\s|)(\,|$)/i);
      if(_placeOrCenter){
        placeName=addrsr.cleanString(_placeOrCenter[0]);
        input=addrsr.cleanString(input.replace(placeName,','));
      }
    } catch(er){
      console.warn('Error parsing place stuff',er.message,'at line',er.line || er.lineNumber,input)
    }
    
    try{
      //match "Walmart City Name Supercentre 1234"
      let walmart=input.match(/(^|\,)(\s|)Walmart [a-zA-Z\-\s]+ (Supercentre|Store) [\d]+\,/i);
      if(walmart){
        input=addrsr.cleanString(input.replace(addrsr.cleanString(walmart[0]),','));
        placeName=addrsr.cleanString(walmart[0])+(placeName?', '+placeName:'');
      }
    } catch(er){
      console.warn('Error parsing walmart stuff',er.message,'at line',er.line || er.lineNumber,input)
    }
    input=addrsr.cleanString(input);

    try{
      //match any part of address before the 1st number
      // "New York Center for Infants and Toddlers, Inc.,2336 Andrews Ave, 2nd Floor, Bronx, 10468, US"
      // The 2 1st parts are the "place" name, strip it.
      var rsp=input.split(',');
      if(rsp[0] && rsp[0].trim()){
        var rfp=rsp[0].trim(),rpn='';
        if(!rfp.match(/[0-9]/)){
          console.warn('First part of address has no numbers',rfp)
          while(rsp && rsp[0] && rsp[0].trim() && !rsp[0].trim().match(/[0-9]/)){
            rpn+=rsp[0].trim()+' ';
            rsp.shift();
          }
          placeName=addrsr.cleanString(rpn)+(placeName?', '+placeName:'');
          input=addrsr.cleanString(rsp.join(', '));
        }
      }
    }
    catch(er){
      console.warn('input "'+input+'" could not find placeName',er.message,'at line',er.line || er.lineNumber);
    }
    return {
      place     : toTitleCase(placeName),
      stripped  : input
    }
  },
	/**
	 * 
	 * @param {string} a address string
	 * @returns {object} 
	 * 		{string} parsed parsed po box
	 * 		{string} stripped original string, w/o po box
	 */
	getPOBox: function(a) {
		//remove P.O. box from original address
		//return parsed value
		let s=a.match(/(P[\.\s]*O|POST[\s\-]+OFFICE)?([\.\s\:]*)?(BOX|DRAWER)[\s\:\#]*([\s]+|)(\w+)/i);
		if(s){
			return {
				parsed		: s[0],
				value		: s[5],
				stripped	: a.replace(s[0],'').replace(/[\s]+\,/g,',').trim().replace(/[\,]+/g,',').trim().replace(/^\,/g,'').trim()
			}
		}
		return null;
  },
  getStateFromZip:function(zip){
    var zip=parseInt(zip);
    var s=Object.keys(usZipCodesByState);
    for(let i=0;i<s.length;i++){
      let _s=usZipCodesByState[s[i]];
      for(let x=0;x<_s.codes.length;x++){
        if(zip>=_s.codes[x][0] && zip>=_s.codes[x][1]){
          return {
            code  : s[i],
            name  : _s.name
          };
        }
      }
    }
    return null;
  },
	/**
	 * 
	 * @param {string} a address string
	 * @returns {object} 
	 * 		{string} parsed parsed subPremise
	 * 		{string} stripped original string, w/o subPremise
	 */
	getSubPremise: function(a) {
		//remove subPremise from original address
		//return parsed value
		let _bndr = "(\\b|\\\,)", _apt = [];
		var _c = [
			[new RegExp("^RR ([\\d]+) Comp([a-z]+|) ([\\d]+) Site ([\\d]+)" + _bndr, 'i'), ''], //RR 1 Comp 45 Site 19, 32 Willow Hill Est, Sundre, Alberta T0M 1X0, Canada
			[new RegExp(_bndr + "([\\d]+)(st|nd|rd|th|e|ieme|er|eme) (" + Object.keys(usLine2Prefixes).join('|') + ")" + _bndr, 'i'), ''], // 2nd floor, 3rd floor, 4e étage etc
			[new RegExp(_bndr + "(" + Object.keys(usLine2Prefixes).join('|') + ")([\\.|\\#|\\s|\\:]+|)([\\d]+|)([a-zA-Z]|)" + _bndr, 'i'), ''], // 580 Hespeler Rd building d, Cambridge, ON N1R 6J8, Canada
			[new RegExp(" \\#[\\d+]+([a-zA-Z]|)" + _bndr, 'i'), ''], // 9390 Boulevard des Sciences #3A, Anjou, QC H1J 3C7, Canada
			[new RegExp("^(\\d+)(\\s|)[A-DF-NP-RT-VX-Z]" + _bndr, 'i'), '$1'], //129 B Mitchell Ct, Mitchell, ON N0K 1N0, Canada
			[new RegExp("^(\\#|)([\\d]+)(\\s|)(\\-|\\,|\\/)(\\s|)", 'i'), ''], //#105 - 19 Everridge Square SW... also fits with or without spaces
		];
		for (let i = 0; i < _c.length; i++) {
			let _aptM = a.match(_c[i][0]);
			if (_aptM) {
				_apt.push(_aptM[0].trim());
				a = a.replace(_c[i][0], _c[i][1]).trim();
			}
		}
		return {
			parsed: _apt.join(', '),
			stripped: a.replace(/[\s]+\,/g,',').trim().replace(/[\,]+/g,',').trim().replace(/^\,/g,'').trim()
		};
	},
	parseAddress: function(address) {
		// Validate a non-empty string was passed
		if (!address) {
			throw 'Argument must be a non-empty string.';
		}
		// Deal with any repeated spaces
		address = addrsr.cleanString(address);
    address=address.replace(/\, Newfoundland ([A-Z]\d[A-Z])/i,', NL $1'); // because partial province name
    address=address.replace(/\, Bronx (\d{5})/i,', NY $1'); // because Bronx is not a state, ny is
		var result = {};
    var PI=addrsr.getPlaceInfo(address);
    if(PI.place){
      address=PI.stripped;
      result.placeName=PI.place;
    }
		var subP=addrsr.getSubPremise(address);
		if(subP && subP.parsed){
			result.subPremise=subP.parsed;
			address=subP.stripped;
		}
		var poBox=addrsr.getPOBox(address);
		if(poBox && poBox.parsed){
			result.poBox=poBox.parsed;
			address=poBox.stripped;
		}
		// Assume comma, newline and tab is an intentional delimiter
		var addressParts = address.split(/,|\t|\n/);

		// Check if the last section contains country reference (Just supports US for now)
		var countrySection = addressParts[addressParts.length - 1].trim();
		result.countryCode = countrySection === 'US' || countrySection === 'USA' || countrySection === 'United States' ? 'US' : '';
		if (!result.countryCode) result.countryCode = countrySection === 'CA' || countrySection === 'CAN' || countrySection === 'Canada' ? 'CA' : '';
		if (result.countryCode) {
			if (result.countryCode == 'CA') result.country = 'Canada';
			if (result.countryCode == 'US') result.country = 'United States';
			addressParts.splice(-1, 1);
		}
		// Assume the last address section contains state, zip or both
		var stateString = addressParts[addressParts.length - 1].trim();
		// Parse and remove zip or zip plus 4 from end of string
		if (stateString.match(/\d{5}$/)) {
			result.zipCode = stateString.match(/\d{5}$/)[0];
      stateString = stateString.substring(0, stateString.length - 5).trim();
      if(!stateString){
        let _s=addrsr.getStateFromZip(result.zipCode);
        if(_s && _s.code)
          stateString=_s.code;
      }
		} else if (stateString.match(/\d{5}-\d{4}$/)) {
			var zipString = stateString.match(/\d{5}-\d{4}$/)[0];
			result.zipCode = zipString.substring(0, 5);
			result.zipCodePlusFour = zipString;
			stateString = stateString.substring(0, stateString.length - 10).trim();
      if(!stateString){
        let _s=addrsr.getStateFromZip(result.zipCode);
        if(_s && _s.code)
          stateString=_s.code;
      }
		} else if (result.countryCode == 'CA' && stateString.match(/[A-Z]\d[A-Z] ?\d[A-Z]\d/)) {
			result.zipCode = stateString.match(/[A-Z]\d[A-Z] ?\d[A-Z]\d/)[0];
			stateString = stateString.substring(0, stateString.length - result.zipCode.length).trim();
			if (!stateString) {
				stateString = canPostalCodeFirst[result.zipCode.substr(0, 1)];
			}
		}
		else if (result.countryCode == 'CA' && stateString.match(/\b[A-Z]\d[A-Z]\b/)) {
			result.zipCode = stateString.match(/\b[A-Z]\d[A-Z]\b/)[0];
			result.zipCodeIsIncomplete = true;
			stateString = stateString.substring(0, stateString.length - result.zipCode.length).trim();
			if (!stateString) {
				stateString = canPostalCodeFirst[result.zipCode.substr(0, 1)];
			}
    }
    
		// Parse and remove state
		if (stateString.length > 0) { // Check if anything is left of last section
			addressParts[addressParts.length - 1] = stateString;
		} else {
			addressParts.splice(-1, 1);
			stateString = addressParts[addressParts.length - 1].trim();
		}
		// First check for just an Abbreviation
		if (stateString.length == 2 && getKeyByValue(allStates, stateString.toUpperCase())) {
			result.stateAbbreviation = stateString.toUpperCase();
			result.stateName = toTitleCase(getKeyByValue(allStates, stateString.toUpperCase()));
			stateString = stateString.substring(0, stateString.length - 2);
		} else {
			// Next check if the state string ends in state name or abbeviation
			// (state abbreviation must be preceded by a space to ensure accuracy)
			for (var key in allStates) {
				var re = new RegExp(" " + allStates[key] + "$|" + key + "$", "i");
				if (stateString.match(re)) {
					stateString = stateString.replace(re, "");
					result.stateAbbreviation = allStates[key];
					result.stateName = toTitleCase(key);
					break;
				}
			}
		}
		if (!result.stateAbbreviation || result.stateAbbreviation.length != 2) {
			throw 'Can not parse address. State not found.';
		}

		// Parse and remove city/place name
		var cityString = "";
		if (stateString.length > 0) { // Check if anything is left of last section
			addressParts[addressParts.length - 1] = stateString;
			cityString = addressParts[addressParts.length - 1];
		} else {
			addressParts.splice(-1, 1);
			cityString = addressParts[addressParts.length - 1].trim();
		}
		result.city = "";
		allCities[result.stateAbbreviation].some(function(element) {
			var re = new RegExp(element + "$", "i");
			if (cityString.match(re)) {
				cityString = cityString.replace(re, ""); // Carve off the place name

				result.city = element;
				return element; // Found a winner - stop looking for cities
			}
		});
		if (!result.city) {
			result.city = toTitleCase(cityString);
			cityString = "";
		}

		// Parse the street data
		var streetString = "";
		var usStreetDirectionalString = Object.keys(usStreetDirectional).map(x => usStreetDirectional[x]).join('|');
		var usLine2String = Object.keys(usLine2Prefixes).join('|');

		if (cityString.length > 0) { // Check if anything is left of last section
			addressParts[addressParts.length - 1] = cityString;
		} else {
			addressParts.splice(-1, 1);
		}

		if (addressParts.length > 2) {
			throw 'Can not parse address. More than two address lines.';
		} else if (addressParts.length === 2) {
			// check if the secondary data is first
			var re = new RegExp('^(' + usLine2String + ')\\b', 'i');
			if (addressParts[0].match(re)) {
				var tmpString = addressParts[1];
				addressParts[1] = addressParts[0];
				addressParts[0] = tmpString;
			}
			//Assume street line is first
			result.addressLine2 = addressParts[1].trim();
			addressParts.splice(-1, 1);
		}
		if (addressParts.length === 1) {
			streetString = addressParts[0].trim();
			// If no address line 2 exists check to see if it is incorrectly placed at the front of line 1
			if (typeof result.addressLine2 === "undefined") {
				var re = new RegExp('^(' + usLine2String + ')\\s\\S+', 'i');
				if (streetString.match(re)) {
					result.addressLine2 = streetString.match(re)[0];
					streetString = streetString.replace(re, "").trim(); // Carve off the line 2 data
				}
			}
			//Assume street address comes first and the rest is secondary address
			var reStreet = new RegExp('\.\*\\b(?:' +
				Object.keys(usStreetTypes).join('|') + ')\\b\\.?' +
				'( +(?:' + usStreetDirectionalString + ')\\b)?', 'i');
			var reAveLetter = new RegExp('\.\*\\b(av.?|ave.?|avenue)\.\*\\b[a-zA-Z]\\b', 'i');
			var reNoSuffix = new RegExp('\\b\\d+\\s[a-zA-Z0-9_ ]+\\b', 'i');
			
			if (streetString.match(reAveLetter)) {
				result.addressLine1 = streetString.match(reAveLetter)[0];
				streetString = streetString.replace(reAveLetter, "").trim(); // Carve off the first address line
				if (streetString && streetString.length > 0) {
					// Check if line2 data was already parsed
					if (result.hasOwnProperty('addressLine2') && result.addressLine2.length > 0) {
						throw 'Can not parse address. Too many address lines. Input string: ' + address;
					} else {
						result.addressLine2 = streetString;
					}
				}

				var streetParts = result.addressLine1.split(' ');

				// Assume type is last and number is first   
				result.streetNumber = streetParts[0]; // Assume number is first element

				// Normalize to Ave
				streetParts[streetParts.length - 2] = streetParts[streetParts.length - 2].replace(/^(ave.?|avenue)$/i, 'Ave');

				//result.streetSuffix = toTitleCase(usStreetTypes[streetParts[streetParts.length-1].toLowerCase()]);
				result.streetName = streetParts[1]; // Assume street name is everything in the middle
				for (var i = 2; i <= streetParts.length - 1; i++) {
					result.streetName = result.streetName + " " + streetParts[i];
				}
				result.streetName = toTitleCase(result.streetName);
				let snDir=result.streetName.match(new RegExp("^("+usStreetDirectionalString+")\\b",'i'));
				if(snDir){
					result.streetDirection=snDir[0].trim();
				}
				result.addressLine1 = [result.streetNumber, result.streetName].join(" ");
			} else if (streetString.match(reStreet)) {
				result.addressLine1 = streetString.match(reStreet)[0];
				streetString = streetString.replace(reStreet, "").trim(); // Carve off the first address line
				if (streetString && streetString.length > 0) {
					// Check if line2 data was already parsed
					if (result.hasOwnProperty('addressLine2') && result.addressLine2.length > 0) {
						throw 'Can not parse address. Too many address lines. Input string: ' + address;
					} else {
						result.addressLine2 = streetString;
					}
				}
				var streetParts = result.addressLine1.split(' ');

				// Check if directional is last element
				var re = new RegExp('\.\*\\b(?:' + usStreetDirectionalString + ')$', 'i');
				if (result.addressLine1.match(re)) {
					result.streetDirection = streetParts.pop().toUpperCase();
				}
				else if(usStreetDirectionalString.split('|').indexOf(streetParts[1].toUpperCase())!=-1){
					result.streetDirection = streetParts.splice(1,1)+'';
					result.streetDirection = result.streetDirection.toUpperCase();
				}

				// Assume type is last and number is first   
				result.streetNumber = streetParts[0]; // Assume number is first element
				// If there are only 2 street parts (number and name) then its likely missing a "real" suffix and the street name just happened to match a suffix
				if (streetParts.length > 2) {
					// Remove '.' if it follows streetSuffix
					streetParts[streetParts.length - 1] = streetParts[streetParts.length - 1].replace(/\.$/, '');
					result.streetSuffix = toTitleCase(usStreetTypes[streetParts[streetParts.length - 1].toLowerCase()]);
				}

				result.streetName = streetParts[1]; // Assume street name is everything in the middle
				for (var i = 2; i < streetParts.length - 1; i++) {
					result.streetName = result.streetName + " " + streetParts[i];
				}
				result.streetName = toTitleCase(result.streetName);
				result.addressLine1 = [result.streetNumber, result.streetName].join(" ");

				if (result.hasOwnProperty('streetSuffix')) {
					result.addressLine1 = result.addressLine1 + ' ' + result.streetSuffix;
				}
				if (result.streetDirection) {
					result.addressLine1 = result.addressLine1 + ' ' + result.streetDirection;
				}
			} else if (result.poBox) {
				result.addressLine1 = ''+result.poBox;
				//streetString = streetString.replace(result.poBox, "").trim(); // Carve off the first address line
			} else if (streetString.match(reNoSuffix)) {
				// Check for a line2 prefix followed by a single word. If found peel that off as addressLine2
				var reLine2 = new RegExp('\\s(' + usLine2String + ')\\.?\\s[a-zA-Z0-9_\-]+$', 'i');
				if (streetString.match(reLine2)) {
					result.addressLine2 = streetString.match(reLine2)[0].trim();
					streetString = streetString.replace(reLine2, "").trim(); // Carve off the first address line
				}

				result.addressLine1 = streetString.match(reNoSuffix)[0];
				streetString = streetString.replace(reNoSuffix, "").trim(); // Carve off the first address line
				var streetParts = result.addressLine1.split(' ');

				// Assume type is last and number is first   
				result.streetNumber = streetParts[0]; // Assume number is first element
				streetParts.shift(); // Remove the first element
				result.streetName = streetParts.join(' '); // Assume street name is everything else
			} else {
				throw 'Can not parse address. Invalid street address data. Input string: ' + address;
			}
		} else if(!result.subPremise && !result.poBox) {
			throw 'Can not parse address. Invalid street address data. Input string: ' + address;
		}
		if(result.poBox) result.addressLine2=(result.addressLine2?result.addressLine2+', ':'')+result.poBox;
		if(result.subPremise) result.addressLine2=(result.addressLine2?result.addressLine2+', ':'')+result.subPremise;

		var addressString = result.addressLine1 || '';
		if (result.hasOwnProperty('addressLine2')) {
			addressString += ', ' + result.addressLine2;
		}
		if (addressString && result.hasOwnProperty("city") && result.hasOwnProperty("stateAbbreviation") && result.hasOwnProperty("zipCode")) {
			var idString = (addressString?addressString + ", ":'') + result.city + ", " + result.stateAbbreviation + " " + result.zipCode+", "+result.country;
			result['formattedAddress'] = idString;
			result['id'] = encodeURI(idString.replace(/ /g, '-').replace(/\#/g, '-').replace(/\//g, '-').replace(/\./g, '-'));
		}

		return result;
	},

	randomCity: function() {
		var randomState = randomProperty(usCities);
		var randomStateData = usCities[randomState];
		var randomCityElementId = Math.floor(Math.random() * randomStateData.length);
		var randomCity = randomStateData[randomCityElementId];
		return { city: randomCity, state: randomState };
	},

	cities: function() {
		return (usCities);
	}
};
module.exports = addrsr;