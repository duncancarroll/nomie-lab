angular.module('nomieTrackersController', []).controller('TrackersController', ['$scope', '$rootScope', 'CouchService', '$timeout',
	function ($scope, $rootScope, CouchService, $timeout) {

		$scope.vm = {};

		$scope.init = function () {
			$timeout(function () {
				$rootScope.what = 'trackers';
				$scope.trackers = CouchService.trackersData;
				console.log("Getting Trackers", $scope.trackers);
			}, 120);
		};

		$scope.$on('data-overview-loaded', function (evt, data) {
			$scope.init();
		});
		if (CouchService.notesData.length > 0) {

			$scope.init();
		}

	} // end main home controller function
]).controller('TrackerAnalyzerController', ['$scope', '$rootScope', 'CouchService', '$timeout', '$routeParams',
	function ($scope, $rootScope, CouchService, $timeout, $routeParams) {

		$scope.trackerId = $routeParams.trackerId;
		$scope.vm = {};
		$rootScope.what = 'trackers';

		$scope.init = function () {
			$timeout(function () {
				$scope.selectedTracker = CouchService.trackersData[$routeParams.trackerId];
				$scope.trackers = CouchService.trackersData;
				var qEvents = CouchService.queryEvents(); // Get the JsonQuery Object of Events
				$scope.events = qEvents.where({
					'parent': $routeParams.trackerId
				}).exec();
				console.log("### TRACKER ANALYZER", $scope.events);
			}, 120);
		};

		$scope.$on('data-overview-loaded', function (evt, data) {
			$scope.init();
		});
		// If they visit this page after data-overview-loaded
		if (CouchService.notesData.length > 0) {
			$scope.init();
		}

		/*****************************************************
		 * Generate a Graph of Some Sort
		 *
		 ******************************************************/
		$scope.showGraph = function () {

			console.log("SHOWING GRAPH", CouchService.tickData);

			var days = CouchService.getDayTotals();
			var columns = [
				['x'],
				['total']
			];
			for (var day in days) {
				columns[0].push(day);
				columns[1].push(days[day].total);
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

	} // end main home controller function
]);
