/*
	Hitch Resource Manager
	Helper methods to download and process filters/rules.
*/
(function(hitch){

	var 
		// placeholder for resources to load
		loaded = {},
		// HTTP object for ajax requests (helper method)
		getHTTPObject = function() {
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
		}; 

	hitch.resource =  {
		load : function(resources, callback, type, errCallback, allDone) {
			var 
				// http object to make ajax requests for links
				http = getHTTPObject(),
				// loop counter
				i,
				// semaphore for resources to load
				open = resources.length,
				// intermediate callback to receive compiler callback
				checkDone = function(rules){
					try{ callback(rules); } catch(e) {};
					loadDone();
				},
				// handler for when resources are loaded
				changeHandler = function () {
					var result = '';
					if (http.readyState == 4) {
						if(http.status == 200) {
							if(http.responseText) result = http.responseText;
							HitchCompiler(result,checkDone);
						} else {
							loadDone();
						}
					}
				},
				// called when load process done and runs callback for caller
				loadDone = function(){
					open--;
					if(open === 0) allDone();
				};
			
			// if we have no resources to load - finish
			if(!resources || resources.length === 0){ allDone(); }

			if(type === 'script'){
				for(i=0;i<resources.length;i++){
					if(!loaded[resources[i]]){ 
						loaded[resources[i]] = true; 
						Hitch.dom.scriptTag(resources[i],loadDone);
					}
				} 
			}else{
				for(i=0;i<resources.length;i++){
					if(resources[i].inline){
						HitchCompiler(resources[i].inline, checkDone);
					}else{
						if(!loaded[resources[i]]){ 
							loaded[resources[i]] = true; 
							if(!http){
								loadDone();
								continue;
							}
							//TODO: Do we really want to cache-bust all the time?
							resources[i] += ((resources[i].indexOf("?")+1) ? "&" : "?")  + "h_id=" + new Date().getTime();
							http.open("GET", resources[i], true);
							http.onreadystatechange = changeHandler;
							http.send(null);
						}
					}
				}
			}
		},
	};

})(Hitch);
