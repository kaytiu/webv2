var app = angular.module('wcp-app', ['ngDraggable']);




app.controller('wcpPreviewController', function($scope) {
	var wcpModules = sessionStorage.getItem('wcpModules');
	wcpModules = JSON.parse(wcpModules);
	if(wcpModules){
		$scope.wcpModules = wcpModules;
	}else{
		$scope.wcpModules = [];
	}
});


