nomieLab.service('CouchService',
	['$rootScope', '$timeout',
	function($rootScope, $timeout) {
    var ss = this; //Service Scope;
		var pvt = {}; //Private Stuff


		ss.server = {
			url : null,
			auth : {
				username : null,
				password : null
			},
			valid : false,
			connected : false
		};
		ss.events = null;
		ss.dataOverview = {
			number_of_events : 0,
			number_of_trackers : 0,
			first_event : null,
			last_event : null
		};

		ss.tickData = [];
		ss.trackersData = {};
		ss.notesData = [];



		/*****************************************************
		* Gather Stats on the Trackers and Events
		*
		******************************************************/

		ss.getDaysTrackerHappened = function(trackerId) {

			var days = {};
			for(var i in ss.tickData) {
				var tick = ss.tickData[i];
				if(tick.parent == trackerId) {
					var day = moment(tick.time).format('YYYY-MM-DD');
					if(days.hasOwnProperty(day)) {
						days[day]++;
					} else {
						days[day]=1;
					}
				}
			}

			return days;
		};

		ss.getDaysTheseTrackersHappened = function(trackerArray) {
			if(trackerArray.length==1) {
				alert("need more than one tracker for this function!");
			}
			var finalset = {};
			var compareGroup = {};
			var daysets = [];
			for(var i in trackerArray) {
				daysets.push(ss.getDaysTrackerHappened(trackerArray[i]));
			}
			console.log(daysets);

			//skip the first_event
			compareGroup = daysets[0];

			// find smallest one.
			var smallestIndex = {
				index : 0,
				count: 10000000
			};
			for(var ii in daysets) {
				var daycount = Object.keys(daysets[ii]);
				console.log("Looping over Day sets to find smallest",daycount.length,daycount.length<smallestIndex.count);
				if(daycount.length<smallestIndex.count) {
					smallestIndex.index = ii;
					smallestIndex.count =daycount.length;
					//console.log("Setting smallest index count to "+daycount.length);
				}
			}

			//console.log("Looping over Day Sets. Skipping index:"+smallestIndex.index, smallestIndex);
			for(var w = 0; w<daysets.length;w++) {
					if(w!=smallestIndex.index) {
						//console.log("Looking at Dayset Index "+w, daysets[w]);
						// loop over the dates in the control group
						//console.log(" -- Looping over Smallest Day Set "+smallestIndex.index);
						for(var o in daysets[smallestIndex.index]) {
							if(daysets[w].hasOwnProperty(o)) {
								finalset[o] = finalset[o]++ || 1;
							}
						}
					} else {
						console.log("Skipping Index "+w);
					}



			} // end looping over the sets.
			//console.log("Final Set!", finalset);

			// Now we need to get the trackers that happen on these days.
			var daykeys = Object.keys(finalset);
			//console.log(daykeys);
			var sameTrackers = {};
			//console.log(" -- loop over ticks in the database");
			for(var tickId in ss.tickData) {
				var tick = ss.tickData[tickId];
				if(daykeys.indexOf(moment(tick.time).format('YYYY-MM-DD'))!=-1) {
					//console.log("Daykey Match!", tick, daykeys.indexOf(moment(tick.time).format('YYYY-MM-DD')));
					if(sameTrackers.hasOwnProperty(tick.parent)) {
						sameTrackers[tick.parent]++;
					} else {
						sameTrackers[tick.parent]=1;
					}
					//sameTrackers[tick.parent] = sameTrackers[tick.parent]++ || 1;
				}
			}

			//sort it Now
			var sorted = Object.keys(sameTrackers).sort(function(a, b) {
				return sameTrackers[b] - sameTrackers[a];
			});
			var finalArray = [];
			for(var sort in sorted) {
				finalArray.push({ tracker : ss.trackersData[sorted[sort]], count : sameTrackers[sorted[sort]]});
			}

			console.log("Same Trackers", finalArray, sameTrackers);


			return daysets;
		}; // end getting days these trackers happened;


		/*****************************************************
		* Prepare the Data and Gather Stats
		*
		******************************************************/



		ss.gatherStats = function(callback) {
			// ss.events.allDocs({
			// 	startkey : 'tick|tm|0',
			// 	endkey : 'tick|tm|~'
			// }).then(function(results) {
			// 	console.log(results);
			// });

			ss.eventFactory.filter()
			    // .limit(1000)
			    // .startAt(moment().subtract(3, 'months').toDate().getTime())
			    // .parent('trackerId')
					.includeDocs(true)
			    .getTicks(function(err, data) {
						ss.tickData = data;
						//console.log("Got the ticks");
						ss.dataOverview.number_of_events = data.length;
						ss.dataOverview.first_event = new Date(data[0].time);
						ss.dataOverview.last_event = new Date(data[data.length-1].time);
						ss.eventFactory.filter().getNotes(function(err, notes) {
							ss.notesData = notes;
							ss.dataOverview.number_of_notes = notes.length;
							console.log('Data overview', ss.dataOverview);
							$rootScope.dataOverivew = ss.dataOverview;
							$timeout(function() {
								$rootScope.$broadcast('data-overview-loaded', ss.dataOverview);
							},120);

						});

			    });

		}; // end gather stats

		ss.query = {

		};
		ss.queryNotes = function() {
			return ss.getJSONQuery('notes');
		};
		ss.queryEvents = function() {
			return ss.getJSONQuery('events');
		};
		ss.queryTrackers = function() {
			return ss.getJSONQuery('trackers');
		};

		ss.getJSONQuery = function(type) {
			var response;
			switch(type) {
				case 'events' :
					response =  new JsonQuery(ss.tickData);
				break;
				case 'trackers' :
					response =  new JsonQuery(ss.trackersData);
				break;
				case 'notes' :
					response =  new JsonQuery(ss.notesData);
				break;
				default :
					response = new JsonQuery(ss.tickData);
				break;
			}
			return response;
		}; // end getJSONQuery

		ss.getDayTotals = function() {
			var days = {};
			for(var i in ss.tickData) {
				var slot = moment(ss.tickData[i].time).format('YYYY-MM-DD');
				if(!days.hasOwnProperty(slot)) {
					days[slot] = {
						total : 0,
						negative : 0,
						positive : 0
					};
				}
				days[slot].total++;
				if(ss.tickData[i].charge>0) {
					days[slot].positive++;
				} else if(ss.tickData[i].charge<0) {
					days[slot].negative++;
				}
			}

			console.log("These are the days", days);
			return days;
		}; // end

		/*****************************************************
		* Lets just start coding.. This is going to be messy
		*
		******************************************************/
		ss.processQuery = function(options) {
			options = options || {};
			options.what = options.what || null;
			options.where = options.where || null;
			options.filter = options.filter || null;
			options.callback = options.callback || function(err, data) {
				console.log("no callback provided to process Query");
			};
		};

		ss.processor = {
			events : function(options) {

			}, // end evnets
			overview : function(options) {

			}, // end overvview
			notes : function(options) {

			}, // end notes
			dates : function(options) {

			} // end dates
		}; // end processor

		/*****************************************************
		* End Process query
		*
		******************************************************/
		ss.init = function() {
			var storage = window.localStorage.getItem('nomie-lab-couch-settings');
			if(storage!==null) {
				ss.server = JSON.parse(storage);
				ss.server.valid = true;
				ss.server.connected = true;
				ss.connect(function(err, success) {
					if(!err) {
						ss.server.valid = true;
						ss.server.connected = true;
						$timeout(function() {
							$rootScope.$broadcast('connection-established', ss.server);
							$rootScope.server = ss.server;
							ss.gatherStats();
						},200);
					} else {
						ss.server.valid = false;
						ss.server.connected = false;
					}

				});
			} else {
				$timeout(function() {
					$rootScope.$broadcast('connection-needed', { });
				},400);
			}
		};// end init;

		ss.isConnected = function() {
			return ss.server.connected;
		};
		ss.isValid = function() {
			return ss.server.valid;
		};
		ss.setURL = function(url) {
			var parser = document.createElement('a');
			ss.server.url = url;
			parser.href = url;
			ss.server.urlData = {
				host : parser.host,
				port : parser.port,
				protocol : parser.protocol,
				hostname : parser.hostname
			};
		};
		ss.getAuth = function() {
			return ss.server.auth;
		};
		ss.setAuth = function(username, password) {

			ss.server.auth.password = password;
			ss.server.auth.username = username;
		};
		ss.saveConnection = function(callback) {
			callback = callback || function() {};
			window.localStorage.setItem('nomie-lab-couch-settings', JSON.stringify(ss.server));
		};
		ss.connect = function(callback) {
			var serverSettings = angular.copy(ss.server);

			if(serverSettings.url!==null && serverSettings.auth.username!==null && serverSettings.auth.password!==null) {
				var remoteEventsDB = serverSettings.url+'/'+serverSettings.auth.username+'_events';
				var remoteTrackersDB = serverSettings.url+'/'+serverSettings.auth.username+'_trackers';


				/*****************************************************
				* Connect to Events Database
				*
				******************************************************/
				new PouchDB(remoteEventsDB, {
					auth : {
						username : ss.server.auth.username,
						password : ss.server.auth.password
					}
				}).then(function(results) {
					// Successfully connected to Database
					console.log("Connected to Events. Now connecting to Trackers");
					ss.events = results;
					/*****************************************************
					* Connect to Trackers Database
					*
					******************************************************/
					new PouchDB(remoteTrackersDB, {
						auth : {
							username : ss.server.auth.username,
							password : ss.server.auth.password
						}
					}).then(function(trackersDB) {
						ss.trackers = trackersDB;
						console.log("Connected to Trackers Database");
						ss.server.valid = true;
						$rootScope.$broadcast('connection-test-complete', { success : true, err : null });
						$rootScope.$broadcast('connection-trackers-complete', { success : true, err : null });
						callback(null, true);

						ss.eventFactory = new NomieEventFactory(ss.events);

						trackersDB.allDocs({
							include_docs : true
						}).then(function(results) {
							//console.log("Tracker DB rlookup", results);
							ss.trackersData = {};
							for(var r in results.rows) {
								var row = results.rows[r];
								ss.trackersData[row.id] = row.doc;
							}
							//console.log("Tracker Data", ss.trackersData);

							ss.dataOverview.number_of_trackers = results.rows.length;
						});

						ss.saveConnection();
					}).catch(function(err) {
						$rootScope.$broadcast('connection-trackers-error', { success : false, err : err });
					});


				}).catch(function(err) {
					callback(err, null);
					ss.server.valid = true;
					$rootScope.$broadcast('connection-test-complete', { success : false, err : err });
				});
			} else {
				// They haven't provided credentials
				alert("Please provide credentials");
				$rootScope.$broadcast('connection-test-complete', { success : false, err : { message : 'Incomplete information' } });
			}
		}; // end ss.testconnection;

		ss.getTrackers = function(callback) {
			if(ss.server.valid===true) {
				ss.trackers.allDocs({
					include_docs : true
				}).then(function(results) {
					var trackers = [];
					for(var i in results.rows) {
						var row = results.rows[i];
						trackers.push(row.doc);
					}
					callback(null, trackers);
				}).catch(function(err) {
					callback(err, null);
				});
			}
		};

		/*****************************************************
		* We're going to force a connection to use the app
		*
		******************************************************/
		ss.init();
}]);
