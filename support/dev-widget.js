Hitch.add(
	{
		name: '-dev-widget',
		base: '.dev-widget',
		type: 'html',
		init: function(match){
			match[0].innerHTML = "Should be written in";
		}
	}
);
