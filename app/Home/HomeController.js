nomieLab.controller('HomeController', ['$scope', '$rootScope', 'CouchService', '$timeout',
	function ($scope, $rootScope, CouchService, $timeout) {

		$scope.vm = {};

		$scope.process = function () {
			//CouchService.getDayTotals();
			CouchService.getDaysTheseTrackersHappened(['b547c3540eef451e66f42c0ff7648fa6', '0fd3f6822ae94deacae4b27d99dd13fb', '1419436109622-rr9k']);
			$timeout(function () {

			}, 400);
		};

		$rootScope.appHeight = '500px';

		$rootScope.logout = function () {
			if (confirm("Are you sure you want to logout?")) {
				window.localStorage.removeItem('nomie-lab-couch-settings');
				window.location.reload();
			}
		}; // end logout

		$scope.dataReady = function () {
			console.log("$SCOPE.dataReady()", CouchService.dataOverview);
			$rootScope.what = 'overview';
			$scope.showGraph();
			var events = CouchService.queryEvents();
			console.log("Events JsonQuery", events);
			$scope.dataOverview = CouchService.dataOverview;
			CouchService.getTrackers(function (err, trackers) {
				if (!err) {
					$timeout(function () {
						$scope.trackers = trackers;
					}, 100);
				}
			});

			//var results = events.where({ 'dayName': 'Tuesday', 'hour' : 12}).exec();
			var results = events.where()
				.groupBy('parent')
				.exec();

		}; // end $scope.init;

		$scope.chart = null;

		$scope.showGraph = function () {

			console.log("SHOWING GRAPH", CouchService.tickData);

			var days = CouchService.getDayTotals();
			var columns = [
				['x'],
				['total'],
				['positive'],
				['negative']
			];
			for (var day in days) {
				columns[0].push(day);
				columns[1].push(days[day].total);
				columns[2].push(days[day].positive);
				columns[3].push(days[day].negative);
			}

			var config = {
				data: {
					x: 'x',
					//        xFormat: '%Y%m%d', // 'xFormat' can be used as custom format of 'x'
					columns: columns,
				},
				zoom: {
					enabled: true
				},
				color: {
					pattern: ['#044c98', '#06ac06', '#9d0909', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5']
				},
				axis: {
					x: {
						extent: [2, 4.5],
						type: 'timeseries',
						tick: {
							format: '%Y-%m-%d'
						}
					}
				}
			};
			config.bindto = '#chart';

			$scope.chart = c3.generate(config);
		};

		$timeout(function () {
			if (CouchService.tickData.length > 0) {
				console.log("Well hello there, we should load this page I think!");
				$scope.dataReady();
			}
		}, 300);

		$rootScope.$on('connection-needed', function (event, data) {
			console.log("Connection Needed");
			jQuery('#connectModal').modal();
		});

		/*****************************************************
		 * Data is Now Loaded when data-=overview-loaded is complete
		 *
		 ******************************************************/
		$rootScope.$on('data-overview-loaded', function (event, overview) {
			$timeout(function () {
				$scope.dataOverview = $rootScope.dataOverview;
				$scope.dataReady();
				console.log("#Bug notes", $rootScope.dataOverview);
			}, 300);
		}); // end data-overview-loaded

		$rootScope.$on('connection-established', function (event, server) {
			console.log("Connection ESTABLISHED");
		});

		$scope.testConnection = function () {
			console.log("### SCOPE CONNECTION", $scope.vm);
			$timeout(function () {
				CouchService.setURL($scope.url);
				CouchService.setAuth($scope.username, $scope.password);
				CouchService.connect(function (err, success) {
					if (!err) {
						console.log("It's a valid connection", CouchService.server);
						window.location.reload();
					}
					else {
						alert("Error " + err.message);
					}
				});
			}, 200);
		};

	} // end main home controller function
]);
