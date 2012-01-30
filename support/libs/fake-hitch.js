Hitch.add([{
	name: '-false-return',
	base: '',
	type: 'selector',
	"const": {name: "-apple", replaceWith: "div span.apple"},
	init: function(){
		window['false-return-link-inited'] = true;
	},
	filter: function(match, args) { 
		window['false-return-link'] = true; 
		return false; 
	}
},
{	
	name: '-true-return',
	base: '',
	type: 'selector',
	init: function(){
		window['true-return-inited'] = true;
	},
	filter: function(match, args) { 
		window['true-return'] = true; 
		return true; 
	}
}]);

window['added'] = true;