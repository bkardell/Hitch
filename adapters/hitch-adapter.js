/**
	Hitch resources
	Helper to retrieve plugin sources and process them.
*/
(function(hitch){
	var 
		loaded = {},
		scriptTag = function (src, callback) {
			var s = document.createElement('script');
			setTimeout(function(){
				s.type = 'text/' + (src.type || 'javascript');
				s.src = src.src || src;
				s.async = false;
				s.onreadystatechange = s.onload = function() {
					var state = s.readyState;
					if (!s.done && (!state || /loaded|complete/.test(state))) {
						s.done = true;
						callback();
					}
				};
				(document.head || document.getElementsByTagName('head')[0]).appendChild(s);
			},1);
		};
	hitch.resources = {
		getHTTPObject: function() {
			var http = false;
			if(typeof ActiveXObject != 'undefined') {
				try {http = new ActiveXObject("Msxml2.XMLHTTP");}
				catch (e) {
					try {http = new ActiveXObject("Microsoft.XMLHTTP");}
					catch (E) {http = false;}
				}
			} else if (window.XMLHttpRequest) {
				try { http = new XMLHttpRequest();}
				catch (ex) {http = false;}
			}
			return http;
		}, 
		//				loads, initer, 'css', null, Hitch.init
		load : function(url, callback, type, errCallback, allDone) {
			// TODO: Might have issues if this is mistaken for a 'single' URL
			var http, i, open = url.length, tag, checkDone, changeHandler;
			if(!url || url.length===0){ allDone(); }
			if(type === 'script'){
				// for loading scripts
				checkDone = function(){
					open--;
					if(open===0){
						allDone(); 
					}
				};
				for(i=0;i<url.length;i++){
					scriptTag(url[i],checkDone);
				} 
			}else{
				// for loading CSS
				checkDone = function(c){
					try{ callback(c); }
					catch(e){ /* one bad apple doesn't spoil the bunch... */ }
					open--;
					if(open===0){ 
						allDone(); 
					}
				};
				changeHandler = function () {
					var result = '';
					if (http.readyState == 4) {
						if(http.status == 200) {
							result = "";
							if(http.responseText) { result = http.responseText; }
							HitchCompiler(result, checkDone);
						} else {
							open--;
							if(open===0){ 
								allDone(); 
							}
						}
					}
				};
				for(i=0;i<url.length;i++){
					if(url[i].inline){
						HitchCompiler(url[i].inline, checkDone);
					}else{
						http = this.getHTTPObject(); 
						if(!http) return;
						// TODO: Do we always want to cache-bust?
						url[i] += ((url[i].indexOf("?")+1) ? "&" : "?")	 + "h_id=" + new Date().getTime();
						http.open("GET", url[i], true);
						http.onreadystatechange = changeHandler;
						http.send(null);
					}
				}
			}
		}
	};
})(Hitch);

/**
	Hitch Ready
	Utility to create a Hitch event hook
*/
(function(hitch){
	var conf = { 
		o:{ s: window, a: 'addEventListener', e: 'DOMContentLoaded', r: 'removeEventListener' },
		n:{ s: document, a: 'attachEvent',e: 'onreadystatechange',r: 'detachEvent'}
	},
	o = (document.addEventListener) ? conf.o : conf.n,
	addLoadListener = function(func){
		o.s[o.a](o.e, func, false);
		o.s[o.a]('load', func, false);
	},
	removeLoadListener = function(func){
		o.s[o.r](o.e, func, false);
		o.s[o.r]('load', func, false);
	},
	callbacks = null,
	done = false,
	__onReady = function(){
		done = true;
		removeLoadListener(__onReady);
		if (!callbacks) return;
		for (var i = 0; i < callbacks.length; i++){
			callbacks[i]();
		}
		callbacks = null;
	},
	ready = function(func){
		if (done){
			func();
			return;
		}
		if (!callbacks){
			callbacks = [];
			addLoadListener(__onReady);
		}
		callbacks.push(func);
	};
	hitch.ready = ready;
})(Hitch);

Hitch.ready(function(){
	var loads = [], 
		requires = [],
		toProc, 
		i,
		initer = function(c){
			Hitch.addCompiledRules(c);
		}, 
		url,
		widgetSelector = '[x-hitch-widget]',
		interpretSelector = '[x-hitch-interpret]';
	
	toProc = document.querySelectorAll(widgetSelector);
	
	for(i=0;i<toProc.length;i++){
		url = toProc[i].getAttribute('x-hitch-widget');
		// TODO: This is in 2 places (here and compiler)
		if(url.indexOf('package:')===0){
			requires.push("http://www.hitchjs.com/use/" + url.substring(8) + ".js");
		}else{
			requires.push(url);
		}
	}
	
	// TODO: This is in 2 places (here and compiler)
	if(requires.length > 0){
		Hitch.resources.load(requires, null, 'script', null, function(){ /* do nothing */ });
	}
	
	toProc = document.querySelectorAll(interpretSelector);
	
	for(i=0;i<toProc.length;i++){
		if(toProc[i].tagName === 'STYLE'){
			loads.push({"inline": toProc[i].innerHTML});
		}else{
			loads.push(toProc[i].getAttribute('href'));
		}
	}
	
	if(loads.length > 0){
		Hitch.resources.load(loads, initer, 'css', null, Hitch.init);
	}
});