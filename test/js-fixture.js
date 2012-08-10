Hitch.add({
	name: '-js-hitch',
	base: '',
	type: 'selector',
	filter: function(matches, args){
		window['js-hitch'] = true;
		return false;
	}
});