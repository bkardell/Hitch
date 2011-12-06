cssPlugins.addFilters([	
{
	name: 'math-greaterthan',  
	fn:   function(match,argsString){
				var args = argsString.split(",");
				var value = match.getAttribute(args[0]);
				if(!isNaN(value) && !isNaN(args[1])){
				   return (value > parseInt(args[1],10));
				}
				return false;
   }
},{
	name: 'math-lessthan',  
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
	name: 'math-greatest',  
	fn:   function(match,argsString,c){
				var value, biggest, args = argsString.split(",");
				for(var i=0;i<c.siblings.length;i++){
					value = match.getAttribute(args[0]);
					if(!isNaN(value) && !isNaN(args[1])){
					   value = parseInt(args[1],10);
					   biggest = (!biggest || value > biggest) ? value : biggest;
					}
				}
				return biggest === match;
	}
},
{
	name: 'math-least',  
	fn:   function(match,argsString,c){
				var value, smallest, args = argsString.split(",");
				for(var i=0;i<c.siblings.length;i++){
					value = match.getAttribute(args[0]);
					if(!isNaN(value) && !isNaN(args[1])){
					   value = parseInt(args[1],10);
					   smallest = (!smallest || value < smallest) ? value : smallest;
					}
				}
				return smallest === match;
	}
}]);