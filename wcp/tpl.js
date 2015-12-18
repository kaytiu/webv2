var dropScrope = false;

$(function() {
	$( "#tpl_modules >li" ).each(function(index,el){
		$(el).draggable({			
			helper:"clone",
			cursor: "pointer",
			revert:true,
			iframeFix:true,
//			scope: "tasks",
			//create:draggableCreate,
			//drag:draggableDrag,
			start:draggableStart,
			stop:draggableStop
		});
	});
	
	
	
	$("#tpl_modules_edit").droppable({drop: editDrop});
	//$("#preview_modules").droppable({drop: editDrop});
	
	
	
});

$(document).ready(function() {
	 
//	$("#tpl_carousel_imgs").owlCarousel({
//
//	      //autoPlay: 1000, //Set AutoPlay to 3 seconds
//	      items : 1,
//	      itemsDesktop : [1199,1],
//	      itemsDesktopSmall : [979,1]
//
//	  });
});


function editDrop(event,ui){
	console.log('editDrop');
	var ifModuels = $('#previewif').contents().find('#preview_modules');
	var liel = $('<li></li>');
	var tpl_model = $('#tpl_carousel_imgs').clone();
	liel.append(tpl_model);
	ifModuels.append(liel);
	
}
	
function draggableCreate(event,ui){
	//console.log('draggableCreate');
}

function draggableDrag(event,ui){
	//console.log('draggableDrag');
}

function draggableStart(event,ui){
	console.log($(this).text());
}

function draggableStop(event,ui,el){
	ui['position'] = {top:0, left:0};
	console.log('draggableStop');

}