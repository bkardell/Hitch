// queue some files and call a callback with the result for each
var Hitch = (function(){  // temporary until we get Hitch created elsewhere...
	var loaded = {};
	var scriptTag =  function (src, callback) {

        var s = document.createElement('script');
        s.type = 'text/' + (src.type || 'javascript');
        s.src = src.src || src;
        s.async = false;

        s.onreadystatechange = s.onload = function() {

            var state = s.readyState;

            if (!callback.done && (!state || /loaded|complete/.test(state))) {
                callback.done = true;
                callback();
            }
        };

        (document.body || document.getElementsByTagName('head')[0]).appendChild(s);
    };
    
	return {
		ajax: {
			getHTTPObject: function() {
				var http = false;
				if(typeof ActiveXObject != 'undefined') {
					try {http = new ActiveXObject("Msxml2.XMLHTTP");}
					catch (e) {
						try {http = new ActiveXObject("Microsoft.XMLHTTP");}
						catch (E) {http = false;}
					};
				} else if (window.XMLHttpRequest) {
					try {http = new XMLHttpRequest();}
					catch (e) {http = false;};
				}
				return http;
			}, 
			load : function(url,callback,type,errCallback,allDone) {
				var http, i, open = url.length, tag;
				Hitch.scriptsReady = allDone;
				if(!url) return;	
				if(type === 'script'){
					// for loading scripts
					//var frag = document.createDocumentFragment();
					for(i=0;i<url.length;i++){
						scriptTag(url[i],function(){
							open--;
							if(open===0){ 
								allDone();
							}
						})
					}; 
				}else{
					// for loading CSS
					for(i=0;i<url.length;i++){
						http = this.init(); 
						if(!http) return;
						
						url[i] += ((url[i].indexOf("?")+1) ? "&" : "?")  + "h_id=" + new Date().getTime();
						http.open("GET", url[i], true);
				
						http.onreadystatechange = function () {
							var result = '';
							if (http.readyState == 4) {
								if(http.status == 200) {
									var result = "";
									if(http.responseText) result = http.responseText;
									cssPluginsCompiler(result, function(c){
										callback(c);
										open--;
										if(open===0){
											allDone();
										}
									});
								} else {
									open--;
									if(errCallback) errCallback(http.status);
								};
								
							};
						};
						http.send(null);
					}
				};
			},
			init: function(){ return this.getHTTPObject(); }
		}
	};
}());


cssPlugins.useManualInit();
window.onload = function(){
	var loads = [], 
		cache, 
		toProc, 
		i,
		href,
		initer = function(c){
			cssPlugins.addCompiledRules(c);
		};
		
	toProc = document.querySelectorAll('[-plugins-interpret]');
	for(i=0;i<toProc.length;i++){
		if(toProc[i].tagName === 'STYLE'){
			cssPluginsCompiler(toProc[i].innerHTML,initer,window.location.path);
		}else{
			href = toProc[i].href;
			loads.push(href);
		}
	};
	Hitch.ajax.load(loads,initer,'css',null,function(){
		cssPlugins.init();
	});
};