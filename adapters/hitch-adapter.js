Hitch = window.Hitch || { useManualInit: function(){}}; // for unit testing..
// queue some files and call a callback with the result for each
Hitch.ajax = (function(){  // temporary until we get Hitch created elsewhere...
	var loaded = {};
	var scriptTag =  function (src, callback) {
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
			(document.body || document.getElementsByTagName('head')[0]).appendChild(s);
		},1);
    };
	return {
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
		load : function(url,callback,type,errCallback,allDone) {
			var http, i, open = url.length, tag, checkDone, changeHandler;
			Hitch.scriptsReady = allDone;
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
					try{
						callback(c);
					}catch(e){ 
						/* one bad apple doesn't spoil the bunch... */
					}
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
							if(http.responseText) result = http.responseText;
							HitchCompiler(result,checkDone);
						} else {
							open--;
							if(open===0){ allDone(); }
						}
					}
				};
				for(i=0;i<url.length;i++){
					http = this.init(); 
					if(!http) return;
					url[i] += ((url[i].indexOf("?")+1) ? "&" : "?")  + "h_id=" + new Date().getTime();
					http.open("GET", url[i], true);
					http.onreadystatechange = changeHandler;
					http.send(null);
				}
			}
		},
		init: function(){ return this.getHTTPObject(); }
	};
}());

(function(){
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
	}
	Hitch.ready = ready;
})();

Hitch.useManualInit();
Hitch.ready(function(){
	var loads = [], 
		cache, 
		toProc, 
		i,
		requires = [],
		href,
		initer = function(c){
			Hitch.addCompiledRules(c);
		};
	
	toProc = document.querySelectorAll('[x-hitch-requires]');
	for(i=0;i<toProc.length;i++){
		requires.push(toProc[i].getAttribute('x-hitch-requires'));
	}
	
	Hitch.ajax.load(requires,null,'script',null,function(){
		toProc = document.querySelectorAll('[x-hitch-interpret]');
		for(i=0;i<toProc.length;i++){
			if(toProc[i].tagName === 'STYLE'){
				HitchCompiler(toProc[i].innerHTML,initer,window.location.path);
			}else{
				href = toProc[i].getAttribute('href');
				loads.push(href);
			}
		};
		Hitch.ajax.load(loads,initer,'css',null,function(){
			Hitch.init();
		});	
	});
	
	
});