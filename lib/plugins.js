(function(hitch){

	hitch.add([
		{ 
			/* emulated "super" matches - allows full complex selectors in match */ 
			name: "-hitch-any",
			base: '',
			filter: function(match, argsString){
				return match.matchesSelector(argsString);
			}
		},
		{ 
			/* emulated "has" allows full complex selectors in match */ 
			name: "-hitch-has",
			base: '',
			filter: function(match, argsString){
				return match.querySelector(args) !== null;
			}
		}
	]);

})(Hitch);
