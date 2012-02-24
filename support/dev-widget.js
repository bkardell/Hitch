Hitch.add(
	{
		name: '-dev-widget',
		base: '.dev-widget',
		type: 'html',
		init: function(match){
			if(match && match.length > 0)match[0].innerHTML = "Should be written in";
		}
	}
);
