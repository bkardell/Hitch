Hitch.add([{
	name: '-false-return',
	base: '',
	init: function(){
		window['false-return-inited'] = true;
	},
	filter: function(match, args) { 
		window['false-return'] = true; 
		return false; 
	}
},
{	
	name: '-true-return',
	base: '',
	init: function(){
		window['true-return-inited'] = true;
	},
	filter: function(match, args) { 
		window['true-return'] = true; 
		return true; 
	}
}]);

window['added'] = true;