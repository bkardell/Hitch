/*
	Hitch Pre-compiled loader
	Inspects the document head for compiled rules and loads them
*/
(function(){
	var h = document.getElementsByTagName('head')[0],
		compiled = h.querySelectorAll('link[x-hitch-compiled]'),
		linktag, 
		precompileds = [];
	for(var i=0;i<compiled.length;i++){
		linktag = compiled[i];
		precompileds.push(linktag.getAttribute('href').replace('.css', '-compiled.js'));
	}
	Hitch.resource.load(precompileds,null,'script',null,function(){});
})();

/*
	Hitch Main Entry
	This is the official "start" of Hitch in interpreted mode.
*/
Hitch.events.ready(function(){Hitch.scan(document,Hitch.init);});
