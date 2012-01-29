(function(){
	// parseUri 1.2.2
	// (c) Steven Levithan <stevenlevithan.com>
	// MIT License
	var parseUri = function(str) {
		var	o   = parseUri.options,
			m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
			uri = {},
			i   = 14;
	
		while (i--) uri[o.key[i]] = m[i] || "";
	
		uri[o.q.name] = {};
		uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
			if ($1) uri[o.q.name][$1] = $2;
		});
	
		return uri;
	};
	
	parseUri.options = {
		strictMode: true,
		key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
		q:   {
			name:   "queryKey",
			parser: /(?:^|&)([^&=]*)=?([^&]*)/g
		},
		parser: {
			strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
			loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
		}
	};
	
	Hitch.add([
		{  /* emulated "super" matches - allows full complex selectors in match */ 
			name: 'test-matches', 
			base: '',
			filter:   function(match,argsString){
				return match.matchesSelector(argsString);
			}
		},
		{ 
			name: 'test-donationover', 
			base: '[donation]', 
			filter:   function(match,argsString){
						var value = match.getAttribute('donation');
						if(!isNaN(value) && !isNaN(argsString)){
						   return (value > parseInt(argsString,10));
						}
						return false;
		   }
		},
		{
			name: 'test-has', 
			base: '', 
			filter:   function(match,args){
						return match.querySelector(args) !== null;
			},
			selectorargs: [0],
			ancestrallytruthy: true
		},
		{
			name: 'test-locallink',
			base: 'a[href]',
			filter:    function(match,argsString,o){
				var a, i, wp, lp, 
					w = parseUri(o.location),
					l = parseUri(match.href);
					if(w.host===l.host){
					if(argsString && !isNaN(argsString)){
						a = parseInt(argsString,10);
						wp = w.path.split('/');
						lp = l.path.split('/');
						for(i=0;i<a+1;i++){
							if(wp[i]!==lp[i]){
								return false;
							}
						}
					}
					return true;
				}
			}
		},
		{
			name: 'test-target',
			base: 'a[name]',
			filter:    function(match,argsString,o){
				console.log(window.location.hash && ("#" + match.name === window.location.hash));
				return (window.location.hash && ("#" + match.name === window.location.hash));
			}
		},
		{
			name: '-math-greaterthan',  
			filter:   function(match,argsString){
						var args = argsString.split(",");
						var value = match.getAttribute(args[0]);
						if(!isNaN(value) && !isNaN(args[1])){
						   return (value > parseInt(args[1],10));
						}
						return false;
		   }
		},{
			name: '-math-lessthan',  
			filter:   function(match,argsString){
						var args = argsString.split(",");
						var value = match.getAttribute(args[0]);
						if(!isNaN(value) && !isNaN(args[1])){
						   return (value < parseInt(args[1],10));
						}
						return false;
		   }
		},
		{
			name: '-math-greatest',  
			filter:   function(match,argsString,c){
						var v1, vTemp, temp, biggest, el, args = argsString.split(",");
						v1 = match.getAttribute(args[0]);
						if(v1 && !isNaN(v1)){	
							for(var i=0;i<c.siblings.length;i++){
								temp = c.siblings[i];
								vTemp = temp.getAttribute(args[0]);
								if(vTemp && !isNaN(vTemp)){
									vTemp = parseInt(vTemp, 10);
								   if(!biggest || vTemp > biggest){
										el = temp;
										biggest = vTemp;
								   };
								}
							}
							return match === el;
						}
						return false;
			}
		},
		{
			name: '-math-least',  
			filter:   function(match,argsString,c){
						var v1, vTemp, temp, smallest, el, args = argsString.split(",");
						v1 = match.getAttribute(args[0]);
						if(v1 && !isNaN(v1)){	
							for(var i=0;i<c.siblings.length;i++){
								temp = c.siblings[i];
								vTemp = temp.getAttribute(args[0]);
								if(vTemp && !isNaN(vTemp)){
									vTemp = parseInt(vTemp, 10);
								   if(!smallest || vTemp < smallest){
										el = temp;
										smallest = vTemp;
								   };
								}
							}
							return match === el;
						}
						return false;
			}
		}
	]);
}());