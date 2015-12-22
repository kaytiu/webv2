sessionStorage.removeItem('wcpModules');
sessionStorage.removeItem('wcpModuleIndex');
var app = angular.module('wcp-app', ['ngDraggable']);


//app.service('wcpService',)

app.controller('wcpModulesController', function($scope) {
	
	var moduleDatas = {
	                   'md_1': {name:'Carousel Imgs', type: 'carousel_imgs', title:'图片轮播',directive:'directivemd1'},
	                   'md_2': {name:'banner static', type: 'banner_static_images',title:'静态图片',directive:'directivemd2'},
	                   'md_3': {name:'carousel products', type: 'carousel_products',title:'产品左右滚动',directive:'directivemd3'},
	                   'md_4': {name:'section products', type: 'section_products',title:'方块式产品',directive:'directivemd4'},
	                   'md_5': {name:'page popup', type: 'page_popup',title:'页面加载',directive:'directivemd5'}
					};
	
	
	$scope.draggModuelsArray = [];
	for(var key in moduleDatas){
		var data = moduleDatas[key];
		data['md_id'] = key;
		$scope.draggModuelsArray.push(data);
	}
	
	$scope.editPaneShowFlag = false;
	$scope.centerAnchor = true;
    $scope.toggleCenterAnchor = function () {$scope.centerAnchor = !$scope.centerAnchor}
    $scope.droppModuelArray = [];
    $scope.droppIndex = 0;
    $scope.previewUrl='./preview.html';
    $scope.previewOnLoad=function(){
    	console.log('1111');
    };
    
    $scope.remvoeModule = function(data){
    	var index = $scope.droppModuelArray.indexOf(data);
    	if(index >= 0){
    		$scope.droppModuelArray.splice(index,1);
    	}
    	sessionStorage.setItem('wcpModules',JSON.stringify($scope.droppModuelArray));
    	$('#previewif').attr('src',$('#previewif').attr('src'));
    }
    
    $scope.onDropComplete=function(data,evt){
    	// 显示编辑panel
    	
    	var index = $scope.draggModuelsArray.indexOf(data);    	
    	if(index >= 0){
    		showEditPanel(data.md_id);
    	}
    	
    	
    	delete data['$$hashKey'];
    	data['wcpMId'] = getWcpMId();
    	data = clone(data);
    	index = $scope.droppModuelArray.indexOf(data);
    	if(index < 0){
    		$scope.droppModuelArray.push(data);
    	}
    	sessionStorage.setItem('wcpModules',JSON.stringify($scope.droppModuelArray));
    	$('#previewif').attr('src',$('#previewif').attr('src'));
    	
    	
            
    }
    
    function showEditPanel(md_id){
    	for(var key in moduleDatas){ $scope[key + '_ShowFlag'] = false;}
    	$scope[md_id + '_ShowFlag'] = true;
    	
    }
    
    function clone(data){
    	var newdata = {};
    	for(var key in data){
    		newdata[key] = data[key];
    	}
    	return newdata;
    }
    function getWcpMId(){
    	var wcpModuleIndex = sessionStorage.getItem('wcpModuleIndex');
    	if(!wcpModuleIndex) wcpModuleIndex = 0;
    	
    	sessionStorage.setItem('wcpModuleIndex', (Number(wcpModuleIndex)+1));
    	return 'wcpMId_' + wcpModuleIndex;
    	
    }
	
});


app.directive('editdirective', function() {
    return {
        restrict: 'C',
        template: '<div>directivemd5</div>',
        replace: true
    };
});

