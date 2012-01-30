(function(hitch){
	
	var head = document.getElementsByTagName('head')[0];
	
	hitch.dom = {

		hasMangledClass: function(t,i){
			return new RegExp("_" + i).test((t.target || t).className);
		},

		addMangledClass: function(t,i){
			var e = (t instanceof NodeList) ? t : [t], x;
			for(x=0;x<e.length;x++){
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
		
		addSheet: function(text,interp){
			var ns = document.createElement('style');
			if(interp){ ns.setAttribute('x-hitch-interpret',true); }
			head.appendChild(ns);
			try{
				ns.innerHTML = text;
				head.appendChild(ns);
			}catch(e){
				head.appendChild(ns);
				document.styleSheets[document.styleSheets.length-1].cssText = text;
			}
		}
	}
	
})(Hitch);