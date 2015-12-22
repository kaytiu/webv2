var app = angular.module('wcp-app', []);




app.controller('wcpPreviewController', function($scope) {
	var wcpModules = sessionStorage.getItem('wcpModules');
//	console.log('wcpModules=' + wcpModules);
	wcpModules = JSON.parse(wcpModules);
	if(wcpModules){
		$scope.wcpModules = wcpModules;
	}else{
		$scope.wcpModules = [];
	}
});



