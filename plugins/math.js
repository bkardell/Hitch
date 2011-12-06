cssPlugins.addFilters([	
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