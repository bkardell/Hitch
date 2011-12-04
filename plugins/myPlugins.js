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
	}
]);