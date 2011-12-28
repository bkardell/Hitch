Hitch.add({
	name: '-false-return',
	base: '',
	init: function(){
		window['false-return-inited'] = true;
	},
	filter: function(match, args) { 
		window['false-return'] = true; 
		return false; 
	}
});

window['added'] = true;