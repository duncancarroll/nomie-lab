var nomieLab = angular.
	module('nomieLab',[
		'ngRoute',
		'angularMoment',
		'gridshore.c3js.chart',
		'nomieNotesController',
		'nomieTrackersController',
		'leaflet-directive'
	]);

var _NomieEventDB, _NomieTrackerDB;

console.log("NOMIE");
// create the controller and inject Angular's $scope
nomieLab.controller('mainController', ['$scope','CouchService',function($scope, CouchService) {

}]);

nomieLab.config(function($routeProvider, $locationProvider) {
  $routeProvider
   .when('/', {
    templateUrl: './app/Home/home.html',
    controller: 'HomeController',
  }).when('/overview', {
		templateUrl: './app/Home/home.html',
		controller: 'HomeController',
	}).when('/trackers/:trackerId', {
		templateUrl: './app/Trackers/trackers.html',
		controller: 'TrackerAnalyzerController',
	}).when('/notes', {
		templateUrl: './app/Notes/notes.html',
		controller: 'NotesController',
	}).when('/trackers', {
		templateUrl: './app/Trackers/trackers.html',
		controller: 'TrackersController',
	}).
  // .when('/Book/:bookId/ch/:chapterId', {
  //   templateUrl: 'chapter.html',
  //   controller: 'ChapterController'
  // }).
	otherwise('/overview');

  // configure html5 to get links working on jsfiddle
  $locationProvider.html5Mode(false);
});
