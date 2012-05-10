/*
	Hitch Pre-compiled loader
	Immediately inspects the document head for compiled rules 
	and loads them right away, this will prevent a lot of work
	whe it is true and has almost no cost since it is scanning the head only
*/
(function(){
	var h = document.getElementsByTagName('head')[0],
		compiled = h.querySelectorAll('link[x-hitch-compiled]'),
		linktag, 
		precompileds = [];
		
	for(var i=0;i<compiled.length;i++){
		linktag = compiled[i];
		precompileds.push({uri:linktag.getAttribute('href').replace('.css', '-compiled.js')});
	}
	
	
	Hitch.resource.load(precompileds,null,'script',null,function(){});


	/*
		Hitch Main Entry
		This is the official "start" of Hitch in interpreted mode.
	*/
	Hitch.go = function(){
		Hitch.scanCSS(document.getElementsByTagName('head')[0],function(){
			var bod = document.getElementsByTagName('body')[0];
			Hitch.init();
			Hitch.scan(bod,function(){
				addMod(bod,Hitch.matchesSelector);
			});	
		});
	};
	
	if(Hitch.query(h,'script[data-hitch-manual]').length===0){ 
		Hitch.events.ready(Hitch.go);
	}
})();
