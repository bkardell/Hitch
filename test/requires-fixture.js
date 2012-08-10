/*
	This fixture is loaded via a @hitch-requires statement in fixtures.css
*/
Hitch.add({
	name: '-requires-hitch',
	base: '',
	type: 'selector',
	filter: function(match, args) { 
		window['requires-hitch'] = true; 
		return false; 
	}
});

window['requires-hitch-added'] = true;