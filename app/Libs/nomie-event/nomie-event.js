/*****************************************************
 * NomieEvent DB
 *
 ******************************************************/
// var NomieEventDB = function (name, arg) {
// 	// console.log("####### IMPORTANT ##### SHOULDNT HAPPEN MUCH!!! ######");
// 	// console.log("--- NOMIE EVENT DB", name, arg);
// 	// console.log("-------------------------------------------------------");
// 	return NomieEventDB;
// 	// name = name || 'events';
// 	// arg = arg || {
// 	// 	auto_compaction: true,
// 	// 	adapter: 'websql'
// 	// };
// 	// return new PouchDB(name, arg);
// };

/*****************************************************
 * NomieEvent Factory
 * This will generate everything you need for a nomie Event.
What's a nomie event you might ask?
A nomie event is a tap of a tracker, and a note (as of jun 21 2015).
This factory will allow you to query all of the events, as well as
create, edit and destory individual events.

FUTURE! FUTURE events will be:

numeric : number
range : 0-5
boolean : yes | no
list : balls|nuts|bolts|goats

This should wait until at least an entire version has been used by the
public. It will become to complicated for the common man who we're trying
to convert.

 ******************************************************/
var NomieEventFactory = function (db) {
	var self = this;
	var NomieEvents = [];
	var private = {};
	db = db || null;

	/*****************************************************
	* Filtering Methods
	* NomieEventFactory.filter().limit(100).startAt(timestamp).endAt(timestamp).getNotes(function(err, data))
	NomieEventFactory.filter().parent('trackerid').limit(100).startAt(timestamp).endAt(timestamp).getTicks(function(err, data))
	******************************************************/
	var settingsDefault = function() {
		return {
			parent: null,
			day: null,
			getAsNotes: false, // if true, ticks will be set to false
			getAsTicks: false, // if true, it will get set notes to false
			descending: false,
			start: null,
			end: null,
			limit: null,
			skip: null,
			include_docs: false,

		};
	};

	self.clearFilter = function() {
		filter.settings = settingsDefault();
		filter.raw = [];
	};

	/*****************************************************
	* Init the Factory Clean
	*
	******************************************************/
	self.init = function() {
			self.clearFilter();
			return self;
	};

	/*****************************************************
	* Filter is the main way to query events
	*
	******************************************************/
	var filter = {
		settings: settingsDefault(),
		raw: [],
		getNotes: function (callback) {
			if (!callback) {
				alert("Callback is required for getNotes()");
			}

			filter.settings.getAsNotes = true;
			filter.settings.getAsTicks = false;

			filter.settings.include_docs = true;

			filter.private.getEvents(function (err, data) {
				filter.raw = data.rows;
				if (!err) {
					callback(err, private.pouch2obj(data.rows));
				} else {
					console.log("Error getting Notes", err);
				}
			});

			return filter;

		},
		getTags: function (callback) {
			if (!callback) {
				alert("Callback is required for getNotes()");
			}

			db.allDocs({
				startkey : 'note/'
			});

			return filter;

		},
		getTicks: function (callback) {
			if (!callback) {
				alert("Callback is required for getTicks()");
			}
			filter.settings.getAsNote = false;
			filter.settings.getAsTicks = true;

			filter.private.getEvents(function (err, data) {
				filter.raw = data.rows;

				///console.log("Filter Private Get Events", data.rows);

				if (!err) {
					callback(err, private.pouch2obj(data.rows));
				}
			});
			//callback(null, filter);
			return filter;

		},
		getAll : function(callback) {
			filter.private.getEvents(callback);
			return filter;
		},
		getAllClean : function(callback) {
			filter.settings.include_docs = true;
			filter.getAll(function(err, results) {
				callback(null, private.pouch2obj(results.rows));
			});
		},
		private: {
			/*****************************************************
			 * Get Events
			 *
			 ******************************************************/
			getEvents: function (callback) {

				var startAndEndKeys = filterToId(filter);
				//console.log("######################################### KEY #####################################", filter);
				//console.log(moment(filter.settings.start).format('ddd MMM Do YYYY hh:mm a'), moment(filter.settings.end).format('ddd MMM Do YYYY hh:mm a'));
				var query = {
					startkey: startAndEndKeys.start,
					endkey: startAndEndKeys.end,
					include_docs: filter.settings.include_docs,
					descending: filter.settings.descending
				};
				//console.log("(#$($(#($(#($(#($#($(#($#  include docs   )))))))))))", filter.settings);
				if (filter.settings.limit !== null) {
					query.limit = filter.settings.limit;
				}

				if (filter.settings.skip !== null) {
					query.skip = filter.settings.skip;
				}

				if(filter.settings.keys) {
					//console.log("Keys set!!", filter.settings.keys);
					self.allDocs({
						keys : filter.settings.keys,
						include_docs : true
					}, function (err, data) {
						//console.log("### GETTING DOCS BY KEY", err, data);
						callback(err, data);
					});
				} else {
					self.allDocs(query, function (err, data) {
						callback(err, data);
					});
				}


			}
		},
		byTracker: function (tracker) {
			//console.log("Get By Parent Tracker ", tracker);
			filter.settings.parent = tracker;
			filter.settings.type = 'tick';
			return filter;
		},
		byTag: function (tag) {
			filter.settings.parent = tag;
			filter.settings.type = 'note';
			return filter;
		},
		startAt: function (timestamp) {
			filter.settings.start = timestamp;
			return filter;
		},
		includeDocs: function (include_docs) {
			filter.settings.include_docs = include_docs;
			return filter;
		},
		endAt: function (timestamp) {
			filter.settings.end = timestamp;
			return filter;
		},
		keys: function(keys) {
			filter.settings.keys = keys;
			return filter;
		},
		day: function (day) {
			//console.log("SET THE DAY TO ", day);
			filter.settings.day = day.toLowerCase();
			return filter;
		},
		skip: function (skip) {
			filter.settings.skip = skip;
			return filter;
		},
		limit: function (limit) {
			filter.settings.limit = limit;
			return filter;
		},
		descending: function (descending) {
			descending = descending || false;
			filter.settings.descending = descending;
			return filter;
		},
	}; // End Filtering



	/*****************************************************
	 * Convert Pouch ID's to Objects
	 *
	 ******************************************************/
	private.pouch2obj = function (rows) {
		var records = [];
		var e = new NomieEvent();
		//console.log("Nomie Event",e);
		for (var i in rows) {
			var obj = e.decodeId(rows[i].id); // Decode the ID to an object
			if (rows[i].hasOwnProperty('doc')) {
				obj.value = rows[i].doc.value;
				obj.geo = rows[i].doc.geo;

				if(obj.geo.length==2) {
					obj.latitude = obj.geo[0];
					obj.longitude = obj.geo[1];
				}

				if(rows[i].doc.hasOwnProperty('offset')) {
					obj.offset = rows[i].doc.offset;
				}
			} else {
				obj.geo = [];
				obj.value = null;
				obj.offset = null;
			}
			records.push(obj);
		}
		return records;

	};

	/*****************************************************
	* Filter to ID
	* Converts a filter to a nomie event id
	******************************************************/
	var filterToId = function () {
		var startNomieEvent;
		var endNomieEvent;
		var endId, startId;

		// Is it a note?
		// BTW, this is a stupid way of doing this.
		if (filter.settings.getAsNotes === true) {
			startNomieEvent = new NomieNote();
			endNomieEvent = new NomieNote();
		} else {
			// No, not it is not. It must be a tick!
			startNomieEvent = new NomieTick();
			endNomieEvent = new NomieTick();
		}

		// if(filter.settings.parent!==null) {
		// 	startNomieEvent.setParent(filter.settings.parent);
		// 	endNomieEvent.setParent(filter.settings.parent);
		// }

		//Max min charges for the query
		startNomieEvent.setCharge(-99);
		endNomieEvent.setCharge(99);




		// If no start, set it to 12 months ago.
		filter.settings.start = filter.settings.start || moment().subtract(12, 'months').toDate().getTime();
		// If no end, set it to now.
		filter.settings.end = filter.settings.end || new Date().getTime();
		// Now do it.
		startNomieEvent.setTime(filter.settings.start);
		endNomieEvent.setTime(filter.settings.end);
		// If no parent is provided..
		//
		/*****************************************************
		* This requires some splanin'
		* A parent is the parent object type.
		If it's a tick, then the parent is a tracker id.
		If its a note, the parent would be the first hashtag.
		If it's a numeric
		******************************************************/


		//If filtering by day
		//console.log("FILTER CHECK", filter);
		if (filter.settings.day!==null) {
			//If for some reason the parent is null, force it.
			if (!filter.settings.parent) {
				startNomieEvent.setParent('0').setCharge(-99);
				endNomieEvent.setParent('~').setCharge(99);
			}
			//Get the Day ID
			startId = startNomieEvent.generateDayId(filter.settings.day, true);
			endId = endNomieEvent.generateDayId(filter.settings.day, true);
			//console.log("#### filter.settings.day is not null", filter.settings.day, startId, endId);
		} else if (filter.settings.note && filter.settings.parent) {
			// Get by Note and Tag (Parent)
			startNomieEvent.setParent(filter.settings.parent);
			endNomieEvent.setParent(filter.settings.parent);
			startId = startNomieEvent.generateParentId(true);
			endId = endNomieEvent.generateParentId(true);
				//console.log("#### filter.settings.note is not null", filter.settings.note, startId, endId);
		} else if (filter.settings.note) {
			// Get by Tracker
			startId = startNomieEvent.generateTimeId(true);
			endId = endNomieEvent.generateTimeId(true);
				//console.log("#### filter.settings.note is not null", filter.settings.note, startId, endId);
		} else if (filter.settings.parent) {
			// Get by Tracker
			startNomieEvent.setParent(filter.settings.parent);
			endNomieEvent.setParent(filter.settings.parent);
			endId = endNomieEvent.generateParentId();
			startId = startNomieEvent.generateParentId();
			//console.log("#### filter.settings.parent is not null", filter.settings.parent, startId, endId);
		} else {
			startNomieEvent.setParent('');
			endNomieEvent.setParent('~');
			startId = startNomieEvent.generateTimeId();
			endId = endNomieEvent.generateTimeId();
			//console.log("#### filter.settings.parent is NULL", startId, endId);
		}




		//console.log("Options to ID", filter, startId, endId);

		return {
			start: startId,
			end: endId
		};

	};

	/*****************************************************
	* Get all Documents - this is a wide open
	*
	******************************************************/
	self.allDocs = function (options, callback) {
		//console.log('self.allDocs()', options, callback);
		db.allDocs(options, callback);
	};

	/*****************************************************
	* Filter - get the filter chainable actions going.
	*
	******************************************************/
	self.filter = function () {
		return filter;
	};


	/*****************************************************
	* Get Events to the NomieEvents array (not the database)
	*
	******************************************************/
	self.getEvents = function () {
		return NomieEvents;
	};

	/*****************************************************
	* Remove an Event to the NomieEvents array (not the database)
	*
	******************************************************/




	/*****************************************************
	* Generate the Bulk Put.
	* This is much more effecient for PouchDB.
	Doing it in one big block.
	******************************************************/

	self.new = {
		note: function () {
			return new NomieNote();
		},
		tick: function () {
			return new NomieTick();
		}
	};

	//return self;
}; // end NomieEvent Factory

//  ####### #     # ####### #     # #######    ####### ######        #
//  #       #     # #       ##    #    #       #     # #     #       #
//  #       #     # #       # #   #    #       #     # #     #       #
//  #####   #     # #####   #  #  #    #       #     # ######        #
//  #        #   #  #       #   # #    #       #     # #     # #     #
//  #         # #   #       #    ##    #       #     # #     # #     #
//  #######    #    ####### #     #    #       ####### ######   #####
//

/*****************************************************
* The Event Object is the main Object of all Objects.
This is the HOLY Grail of nomie. So pay the fuck attention
to what you're going to do in here.
*
******************************************************/

var NomieEvent = function (opts) {
	var self = this;
	var private = {};
	private.dirty = true;
	private.db = _NomieEventDB;
	opts = opts || {};
	private._ids = [];
	private._revs = [];
	private._docs = [];
	private.data = {
		type: 'dirty',
		value: opts.value || null,
		charge: opts.charge || 0,
		time: opts.time || new Date().getTime(),
		geo: opts.geo || [],
		parent: opts.parent || null,
		offset: opts.offset || new Date().getTimezoneOffset()
	};

	//It's be great if i kept this consistant
	private.log = function (args) {
		//console.log("### Nomie NomieEvent ###", args);
	};



	/*****************************************************
	 * Generates an ID for a given Mode
	 * getId(day|parent|time);
	 ******************************************************/

	self.getId = function (type) {

		// Types

		var id;
		switch (type) {
		case 'day':
			id = self.generateDayId();
			break;

		case 'parent':
			id = self.generateParentId();
			break;

		case 'time':
			id = self.generateTimeId();
			break;
		} // end switch
		return id;
	};

	self.getData = function () {
		return private.data;
	};

	self.decodeId = function (id) {
		var ida = id.split('|');
		var obj = {
			_id: id,
			type: ida[0]
		};
		var mode = ida[1];
		switch (mode) {
		case 'tm':
			obj.time = parseInt(ida[2]);
			obj.timeFormatted = moment(new Date(obj.time)).format('ddd MMM Do YYYY hh:mma');
			obj.parent = ida[3];
			obj.charge = parseInt(ida[4]);
			break;
		case 'dy':
			obj.time = parseInt(ida[4]);
			obj.timeFormatted = moment(new Date(obj.time)).format('ddd MMM Do YYYY hh:mma');
			obj.parent = ida[3];
			obj.charge = parseInt(ida[5]);
			break;
		case 'pr':
			obj.time = parseInt(ida[3]);
			obj.timeFormatted = moment(new Date(obj.time)).format('ddd MMM Do YYYY hh:mma');
			obj.parent = ida[2];
			obj.charge = parseInt(ida[4]);
			break;
		}
		var momentTime = moment(obj.time);

		obj.dayName = momentTime.format('dddd');
		obj.day = parseInt(momentTime.format('DD'));
		obj.month = parseInt(momentTime.format('MM'));
		obj.hour = parseInt(momentTime.format('hh'));
		obj.year = parseInt(momentTime.format('YYYY'));
		obj.dayId = parseInt(momentTime.format('YYYY-MM-DD'));

		return obj;

	}; // END EVENT OBJECT


	/*****************************************************
	 * Open an NomieEvent
	 * Pass any type of ID
	 ******************************************************/
	self.open = function (id, callback) {

			//console.log("### EVENT OPEN ###", id);
		private.origId = id;
		private._ids = [];
		private.data = self.decodeId(id);

		//console.log(private.data);
		//
		if (private.data.type === 'tick') {

			private._ids.push(self.getId('time'));
			private._ids.push(self.getId('day'));
			private._ids.push(self.getId('parent'));
		}
		else if (private.data.type === 'note') {
			private._ids.push(self.getId('time'));

		}
		//Get the rest of the stuff from the database.
		// Geo, offset and values are not able
		// to be extracted from the id.

		private.db.get(self.getId('time'), function (err, data) {
			if (!err) {
				//console.log("private.db.get()", data);
				private.dirty = false;
				private.data.value = data.value || null;
				private.data.geo = data.geo || [];
				private.data.offset = data.offset || null;
				// Merge the base data with the stored data
				var final = _.extend(data, private.data);
				callback(err, final);
			} else {
				callback(err, null);
			}
		});
	};


	/*****************************************************
	 * Generate ID Keys
	 *
	 ******************************************************/
	self.generateDayId = function (day, trim) {
		trim = trim || false;
		day =  day || moment(self.getTime()).format('ddd').toLowerCase();
		var ida = [self.getType(), 'dy', day, self.getParent(), self.getTime(), self.getCharge()];
		if(trim===true) {
			return ida.splice(0,4).join('|');
		} else {
			return ida.join('|');
		}
	};

	self.generateTimeId = function (time, trim) {
		trim = trim || false;
		time = time || self.getTime();
		var ida = [self.getType(), 'tm', time, self.getParent(), self.getCharge()];
		if(trim===true) {
			return ida.join('|');
		} else {
			return ida.join('|');
		}
	};

	self.generateParentId = function (trim) {
		trim = trim || false;
		var ida = [self.getType(), 'pr', self.getParent(), self.getTime(), self.getCharge()];
		if(trim===true) {
			return ida.join('|');
		} else {
			return ida.join('|');
		}
	};

	/*****************************************************
	 * Get by an Id
	 * not using this
	 ******************************************************/
	self.get = function (id) {
		var key = private.parse(id);
	};

	//type
	self.setType = function (type) {
		private.data.type = type;
		return self;
	};
	self.getType = function () {
		return private.data.type;
	};

	//charge
	self.setCharge = function (charge) {
		private.data.charge = charge;
		return self;
	};
	self.getCharge = function () {
		return private.data.charge;
	};

	//charge
	self.setOffset = function (offset) {
		private.data.offset = offset;
		return self;
	};
	self.getOffset = function () {
		return private.data.offset;
	};

	//parent
	self.setParent = function (parent) {
		private.data.parent = parent;
		return self;
	};
	self.getParent = function () {
		return private.data.parent;
	};

	self.setTracker = function (parent) {
		private.data.parent = parent;
		private.data.type = 'tick';
		return self;
	};
	self.getTracker = function () {
		return private.data.parent;
	};

	self.setTag = function (parent) {
		private.data.parent = parent;
		private.data.type = 'note';
		return self;
	};
	self.getTag = function () {
		return private.data.parent;
	};

	//geo
	self.setGeo = function (geo) {
		private.data.geo = geo;
		return self;
	};
	self.getGeo = function () {
		return private.data.geo;
	};

	//value
	self.setValue = function (value) {
		private.data.value = value;
		return self;
	};
	self.getValue = function () {
		return private.data.value;
	};

	// time
	self.setTime = function (time) {
		private.data.time = time;
		return self;
	};
	self.getTime = function () {
		return private.data.time;
	};

	/*****************************************************
	 * GET PUT
	 * Returns an array of Docs to submit for this NomieEvent
	 ******************************************************/
	self.getPut = function () {
		var response = [];
		response.push(self.getTimeDoc());
		if (self.getType() === "tick") {
			response.push(self.getParentDoc());
			response.push(self.getDayDoc());
		}
		return response;
	};
	/*****************************************************
	 * GET Delete
	 * Returns an array of Docs to REMOVE for this NomieEvent
	 ******************************************************/
	self.getDelete = function () {
		var response = [];
		response.push(self.getTimeDoc({
			delete: true
		}));
		if (self.getType() === "tick") {
			response.push(self.getParentDoc({
				delete: true
			}));
			response.push(self.getDayDoc({
				delete: true
			}));
		}
		return response;
	};

	/*****************************************************
	 * GET Time Doc
	 * Generates the entire Time doc, including ID
	 ******************************************************/
	self.getTimeDoc = function (options) {
		options = options || {};
		options.delete = options.delete || false;
		var doc = {
			_id: self.getId('time'),
			geo: self.getGeo(),
			value: self.getValue(),
			offset: self.getOffset()
		};
		if (options.delete === true) {
			doc._deleted = true;
		}
		return doc;
	};
	/*****************************************************
	 * GET Day Doc
	 * Generates the entire Time doc, including ID
	 ******************************************************/
	self.getDayDoc = function (options) {
		options = options || {};
		options.delete = options.delete || false;
		var doc = {
			_id: self.getId('day'),
			geo: self.getGeo(),
			value: self.getValue()
		};
		if (options.delete === true) {
			doc._deleted = true;
		}
		return doc;
	};

	/*****************************************************
	 * GET Parent Doc
	 * Generates the entire Time doc, including ID
	 ******************************************************/
	self.getParentDoc = function (options) {
		options = options || {};
		options.delete = options.delete || false;
		var doc = {
			_id: self.getId('parent'),
			geo: self.getGeo(),
			value: self.getValue()
		};
		if (options.delete === true) {
			doc._deleted = true;
		}
		return doc;
	};



	/*****************************************************
	 * Is it an object an ID
	 *
	 ******************************************************/
	private.parse = function (idOrObj) {
		var response = {
			valid: true
		};
		if (typeof idOrObj === 'object') {
			if (private.validateObj(idOrObj) === true) {
				response.valid = true;
			}
			else {
				response.valid = false;
				response.message = "Missing fields";
			}
		}
		else {

		}
	};

	/*****************************************************
	 * Validate a Object
	 *
	 ******************************************************/
	private.validateObj = function (obj) {
		obj = obj || {};
		if (!obj.hasOwnProperty('type') ||
			!obj.hasOwnProperty('time') ||
			!obj.hasOwnProperty('parent')) {
			return false;
		}
		else {
			return true;
		}
	};

	return self;

}; // end NomieEvent

//  #     # ####### ####### #######    ####### ######        #
//  ##    # #     #    #    #          #     # #     #       #
//  # #   # #     #    #    #          #     # #     #       #
//  #  #  # #     #    #    #####      #     # ######        #
//  #   # # #     #    #    #          #     # #     # #     #
//  #    ## #     #    #    #          #     # #     # #     #
//  #     # #######    #    #######    ####### ######   #####

var NomieNote = function (opts) {
	opts = opts || {};
	var nomieEvent = new NomieEvent(opts);
	nomieEvent.setType('note');
	return nomieEvent;
};

//  ####### ###  #####  #    #
//     #     #  #     # #   #
//     #     #  #       #  #
//     #     #  #       ###
//     #     #  #       #  #
//     #     #  #     # #   #
//     #    ###  #####  #    #

var NomieTick = function (opts) {
	opts = opts || {};
	var nomieEvent = new NomieEvent(opts);
	nomieEvent.setType('tick');
	return nomieEvent;
};
