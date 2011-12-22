Hitch.add({
	name: '-false-return',
	base: '',
	fn: function(match, args) { 
		window['false-return'] = true; 
		return false; 
	}
});

window['added'] = true;