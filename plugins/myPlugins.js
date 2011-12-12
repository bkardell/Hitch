cssPlugins.addFilters([
	{  /* emulated "super" matches - allows full complex selectors in match */ 
		name: 'test-matches', 
		base: '',
		fn:   function(match,argsString){
			return match.matchesSelector(argsString);
		}
	},
	{ 
		name: 'test-donationover', 
		base: '[donation]', 
		fn:   function(match,argsString){
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
		fn:   function(match,args){
					return match.querySelector(args) !== null;
		},
		selectorargs: [0],
		ancestrallytruthy: true
	},
	{
		name: 'test-locallink',
		base: 'a[href]',
		fn:    function(match,argsString,o){
			var a;
			if(
				match.href && (match.href.indexOf('#') !== -1
				|| match.href.indexOf(o.location) !== -1)){
				
				if(argsString && isNaN(argsString)){
					a = parseInt(argsString,10);
					debugger;
				}
				return true;
			}
		}
	},
	{
		name: '-math-greaterthan',  
		fn:   function(match,argsString){
					var args = argsString.split(",");
					var value = match.getAttribute(args[0]);
					if(!isNaN(value) && !isNaN(args[1])){
					   return (value > parseInt(args[1],10));
					}
					return false;
	   }
	},{
		name: '-math-lessthan',  
		fn:   function(match,argsString){
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
		fn:   function(match,argsString,c){
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
		fn:   function(match,argsString,c){
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