(function(hitch){

		hitch.add([{ 
			/* emulated "super" matches - allows full complex selectors in match */ 
			name: "-hitch-is",
			base: '',
			filter: function(match, argsString){
				return hitch.matchesSelector(match, argsString);
			}
		},
		{ 
			/* emulated "has" allows full complex selectors in match */ 
			name: "-hitch-has",
			base: '',
			filter: function(match, argsString){
				return match.querySelector(argsString) !== null;
			}
		}, 
		{
			/* 
				vendor-driven const allows for experimental 'unprefixing' for impls 'almost' there
				in terms of universal implementation/api... play with it early, use it wisely, 
				provide feedback about minor incompatibility and _know_ that it is experimental.
			*/
			"const": {name: "-hitch-experimental-", replaceWith: hitch.vendor}
		}]);

})(Hitch);
