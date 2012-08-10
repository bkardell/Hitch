(function(hitch){
	
	var head = document.getElementsByTagName('head')[0], addClass, removeClass, parseClasses;
	parseClasses = function(e){ var list = (e.className || "").split(/\s+/); return (list.length) ? list : []; };
		
	if(head.classList){
		addClass = function(e,cls){ if(!containsClass(e,cls)){ e.classList.add(cls); } }; 
		removeClass = function(e,cls){ if(containsClass(e,cls)){ e.classList.remove(cls); } };
		containsClass = function(e,cls){ return e.classList.contains(cls); }; 
	}else{
		addClass = function(e,cls){ 
			var list = containsClass(e,cls);
			if(!list){
				list.push(cls);
				(e.target || e).className = list.join(" ");
			}
		};
		removeClass = function(e,cls){
			var list = containsClass(e,cls);
			if(list){
				list.splice(foundIndex,1);
				(e.target || e).className = list.join(" ");
			}
		};
		containsClass = function(e,cls){
			var list = parseClasses(e);
			return (list.indexOf(cls) !== -1) ? list : false;
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
		},

		styleTag: function(text,interp,toReplace){
			var ns = document.createElement('style');
			// TODO: Do we really need to set this at all?
			if(interp){ ns.setAttribute('x-hitch-interpret',true); }
			
			if(toReplace && toReplace.parentNode){
				try{
					ns.innerHTML = text;
					toReplace.parentNode.replaceChild(ns,toReplace);	
				}catch(e){
					toReplace.parentNode.replaceChild(ns,toReplace);
					for (var i=0,el=toReplace;el; ++i){ el = el.previousSibling; }
					document.styleSheets[i].cssText = text;
				}
			}else{
				try{
					head.appendChild(ns);
					ns.innerHTML = text;
					head.appendChild(ns);
				}catch(e){
					head.appendChild(ns);
					document.styleSheets[document.styleSheets.length-1].cssText = text;
				}
			}
		}
	};

})(Hitch);
