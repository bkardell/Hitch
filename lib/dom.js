(function(hitch, doc){
	'use strict';
	
	var head = doc.getElementsByTagName('head')[0], addClass, removeClass, parseClasses;
	parseClasses = function(e){ var list = (e.className || "").split(/\s+/); return (list.length) ? list : []; };
		
	if(head.classList){
		addClass = function(e,cls){ if(!containsClass(e,cls)){ e.classList.add(cls); } }; 
		removeClass = function(e,cls){ if(containsClass(e,cls)){ e.classList.remove(cls); } };
		containsClass = function(e,cls){ return e.classList.contains(cls); }; 
	}else{
		addClass = function(e,cls){ 
			var list = parseClasses(e);
			if(list.indexOf(cls) === -1){
				list.push(cls);
				(e.target || e).className = list.join(" ");
			}
		};
		removeClass = function(e,cls){
			var list = parseClasses(e);
			var foundIndex = list.indexOf(cls);
			if(foundIndex !== -1){
				list.splice(foundIndex,1);
				(e.target || e).className = list.join(" ");
			}
		};
	}

	hitch.dom = {	
		
		addMangledClass: function(t,i){
			var e = (t instanceof NodeList) ? t : [t], list, foundIndex;
			for(var x=0;x<e.length;x++){
				addClass((e[x].target || e[x]),"_" + i);
			}
		}, 
		
		removeMangledClass: function(t,i){
			var e = (t instanceof NodeList) ? t : [t], list;
			for(var x=0;x<e.length;x++){
				removeClass((e[x].target || e[x]),"_" + i);
			}
		},

		scriptTag: function (src, callback) {
			var s = doc.createElement('script'), to;
			setTimeout(function(){
				s.type = 'text/' + (src.type || 'javascript');
				s.src = src.src || src;
				s.async = false;

				s.onload = function(){
					if(to){ clearTimeout(to); }
					s.done = true;
					callback();
				};

				s.onreadystatechange = function() {
					var state = s.readyState;
					if(to){ clearTimeout(to); }
					// console.log("state::" + state);
					if (!state || /loaded|complete/.test(state)) {
						// !state is an error case like 404...
						to = setTimeout(function(){
							if(!s.done){
								s.done = true;
								// console.log('calling callback' + state);
								callback();
							}
						},50);
					}
				};
				(doc.head || doc.getElementsByTagName('head')[0]).appendChild(s);
			},1);
		},

		styleTag: function(text,interp,toReplace){
			var ns = doc.createElement('style');
			// TODO: Do we really need to set this at all?
			if(interp){ ns.setAttribute('x-hitch-interpret',true); }
			
			if(toReplace && toReplace.parentNode){
				try{
					ns.innerHTML = text;
					toReplace.parentNode.replaceChild(ns,toReplace);	
				}catch(e){
					toReplace.parentNode.replaceChild(ns,toReplace);
					for (var i=0,el=toReplace;el; ++i){ el = el.previousSibling; }
					doc.styleSheets[i].cssText = text;
				}
			}else{
				try{
					head.appendChild(ns);
					ns.innerHTML = text;
					head.appendChild(ns);
				}catch(e){
					head.appendChild(ns);
					doc.styleSheets[doc.styleSheets.length-1].cssText = text;
				}
			}
		}
	};

})(Hitch, document);
