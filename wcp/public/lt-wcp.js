var app = angular.module('wcp-app', ['ngDraggable']);



app.controller('wcpModulesController', function($scope) {
	$scope.centerAnchor = true;
    $scope.toggleCenterAnchor = function () {$scope.centerAnchor = !$scope.centerAnchor}
    $scope.draggableObjects = [{name:'one'}, {name:'two'}, {name:'three'}];
    $scope.droppedObjects1 = [];
    $scope.droppIndex = 0;
    $scope.previewUrl='./preview.html';
    $scope.previewOnLoad=function(){
    	console.log('1111');
    };
    
    $scope.onDropComplete=function(data,evt){
    	var newdata = {name:data.name}
    	console.log('onDropComplete' + JSON.stringify(newdata));
    	$scope.droppedObjects1.push(newdata);
    	setWcpModules(newdata);
    	$('#previewif').attr('src',$('#previewif').attr('src'));
            
    }
//    $scope.onDragSuccess=function(data,evt){
//    	console.log('onDropComplete' + JSON.stringify(data));
////            var index = $scope.droppedObjects1.indexOf(data);
////            if (index > -1) {
////                $scope.droppedObjects1.splice(index, 1);
////            }
//    }
   
	
});

function setWcpModules(model){
	model = JSON.stringify(model);
	var wcpModules = sessionStorage.getItem('wcpModules');
	if(!wcpModules){
		wcpModules = []; 
	}else{
		wcpModules = JSON.parse(wcpModules);
	}
	wcpModules.push(model);
	sessionStorage.setItem('wcpModules',JSON.stringify(wcpModules));
}
