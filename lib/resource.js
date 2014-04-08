/*
	Hitch Resource Manager
	Helper methods to download and process filters/rules.
*/
(function(hitch, global){

	var 
		// placeholder for resources to load
		loaded = {},
		// HTTP object for ajax requests (helper method)
		getHTTPObject = function() {
			var http = false;
			if (global.XMLHttpRequest) {
				try { http = new XMLHttpRequest();}
				catch (ex) {http = false;}
			}else if(typeof ActiveXObject != 'undefined') {
				try {http = new ActiveXObject("Msxml2.XMLHTTP");}
				catch (e) {
					try {http = new ActiveXObject("Microsoft.XMLHTTP");}
					catch (E) {http = false;}
				}
			} 
			return http;
		},
		enclose = function(a){
			return a;
		};
	

	hitch.resource =  {
		load : function(resources, callback, type, errCallback, allDone) {
			var 
				// http object to make ajax requests for links
				http = getHTTPObject(),
				// loop counter
				i,
				uri,
				// obj in iteration
				resource,
				// semaphore for resources to load
				open = resources.length,
				// intermediate callback to receive compiler callback
				checkDone = function(rules){
					try{ callback(rules); } catch(e) {}
					loadDone.apply({},arguments);
				},
				// handler for when resources are loaded
				changeHandler = function (originNode) {
					var result = '';
					if (http.readyState == 4) {
						if(http.status == 200) {
							if(http.responseText) result = http.responseText;
							HitchCompiler(result, checkDone, originNode);
						} else {
							loadDone.apply({},arguments);
						}
					}
				},
				// called when load process done and runs callback for caller
				loadDone = function(){
					open--;
					if(open === 0) allDone.apply({},arguments);
				};
			
			// if we have no resources to load - finish
			if(!resources || resources.length === 0){ allDone.apply({},arguments); return; }

			if(type === 'script'){
				for(i=0;i<resources.length;i++){
					resource = resources[i].uri.split("#")[0];
					if(!loaded[resource]){ 
						loaded[resource] = true; 
						Hitch.dom.scriptTag(resource,loadDone);
					}else{
						loadDone();
					}
				} 
			}else{
				var makeChangeHandler = function(resource){
					return function(){ changeHandler(resource.ref); };
				};
				for(i=0;i<resources.length;i++){
					if(resources[i].inline){
						HitchCompiler(resources[i].inline, checkDone, enclose(resources[i].ref));
					}else{
						resource = resources[i];
						uri = resource.uri.split("#")[0]; 
						if(!loaded[uri]){ 
							loaded[uri] = true; 
							if(!http){
								loadDone();
								continue;
							}
							//TODO: Do we really want to cache-bust all the time?
							http.open("GET", uri + "?", true);
							http.onreadystatechange = makeChangeHandler(resource);
							http.send(null);
						}else{
							loadDone();
						}
					}
				}
			}
		}
	};

})(Hitch, global);
