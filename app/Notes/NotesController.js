angular.module('nomieNotesController', []).controller('NotesController', ['$scope', '$rootScope', 'CouchService', '$timeout',
	function ($scope, $rootScope, CouchService, $timeout) {

		$scope.vm = {};
		$rootScope.what = 'notes';

		$scope.$on('data-overview-loaded', function (evt, data) {
			$scope.getNotes();
		});

		$scope.notesFilter = {};
		$scope.setFilter = function (name) {

			$scope.filter = name;
			if (name == 'positive') {
				$scope.notesFilter = $scope.filterPositive;
			}
			else if (name == 'negative') {
				$scope.notesFilter = $scope.filterNegative;
			}
			else {
				$scope.notesFilter = {};
			}

		};

		$scope.filterNegative = function (item) {
			if (item.charge < 0) {
				return item;
			}
		};

		$scope.filterPositive = function (item) {
			if (item.charge > 0) {
				return item;
			}
		};

		$scope.getNotes = function () {

			var notes = CouchService.queryNotes();

			$timeout(function () {
				$scope.notes = notes.order({
					'time': 'desc'
				}).exec();
				console.log("Getting Notes", $scope.notes);
			}, 120);

		};

		if (CouchService.notesData.length > 0) {
			$scope.getNotes();
		}

	} // end main home controller function
]);
