(function(hitch){

	var head = document.getElementsByTagName('head')[0];

	hitch.dom = {	
		hasMangledClass: function(t,i){
			return new RegExp("_" + i).test((t.target || t).className);
		},
		
		addMangledClass: function(t,i){
			var e = (t instanceof NodeList) ? t : [t];
			for(var x=0;x<e.length;x++){
				if(!this.hasMangledClass(e[x],i)){
					(e[x].target || e[x]).className += " _" + i;
				}
			}
		}, 
		
		removeMangledClass: function(t,i){
			var e = (t instanceof NodeList) ? t : [t];
			for(var x=0;x<e.length;x++){
				if(this.hasMangledClass(e[x],i)){
				    (e[x].target || e[x]).className = (e[x].target || e[x]).className.replace(' _' + i, ''); 
				}
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
