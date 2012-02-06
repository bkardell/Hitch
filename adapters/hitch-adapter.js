Hitch = window.Hitch || { useManualInit: function(){}}; // for unit testing..

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

Hitch.useManualInit();

/*
	Hitch Main Entry
	This is the official "start" of Hitch in interpreted mode.
*/
Hitch.events.ready(function(){
	var loads = [], 
		cache, 
		resources = document.querySelectorAll('[x-hitch-widget]'),
		i,
		requires = [],
		href,
		initer = function(c){ Hitch.addCompiledRules(c); }, 
		url;

	for(i=0;i<resources.length;i++){
		url = resources[i].getAttribute('x-hitch-widget');
		if(url.indexOf('package:')===0){
			requires.push("http://www.hitchjs.com/use/" + url.substring(8) + ".js");
		}else{
			requires.push(url);
		}
	}

	Hitch.resource.load(requires,null,'script',null,function(){
		resources = document.querySelectorAll('[x-hitch-interpret]');
		for(i=0;i<resources.length;i++){
			if(resources[i].tagName === 'STYLE'){
				loads.push({"inline": resources[i].innerHTML});
			}else{
				href = resources[i].getAttribute('href');
				loads.push(href);
			}
		}
		Hitch.resource.load(loads,Hitch.addCompiledRules,'css',null,Hitch.init);
	});
});
