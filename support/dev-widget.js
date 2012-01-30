Hitch.add(
	{
		name: '-dev-widget',
		base: '.dev-widget',
		fn: function(match, args){
			console.log('-dev-widget ran!');
			return true;
		}
	}
);