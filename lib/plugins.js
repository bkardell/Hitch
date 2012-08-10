(function(hitch){
        var hid = 1;
		hitch.add([{ 
			/* OR emulated "super" any/matches - allows full complex selectors in match */ 
			name: "-hitch-anyof",
			base: '',
			filter: function(match, argsString){
				return hitch.matchesSelector(match, argsString);
			}
		},
		{ 
			/* NOR emulated "super" not - allows full complex selectors in match */ 
			name: "-hitch-noneof",
			base: '',
			filter: function(match, argsString){
				return ! hitch.matchesSelector(match, argsString);
			}
		},
		{ 
			/* XOR - allows full complex selectors in match */ 
			name: "-hitch-oneof",
			base: '',
			filter: function(match, argsString){
				var i, ct = 0, pts = argsString.split(",");
				for(i=0;i<pts.length;i++){
					if(hitch.matchesSelector(match, pts[i])){
						ct++;
						if(ct > 1){  return false; }
					}
				}
				return ct === 1;
			}
		},
		{ 
			/* AND - allows full complex selectors in match */ 
			name: "-hitch-allof",
			base: '',
			filter: function(match, argsString){
				var i, pts = argsString.split(",");
				for(i=0;i<pts.length;i++){
					if(!hitch.matchesSelector(match, pts[i])){
						return false;
					}
				}
				return true;
			}
		},
		{ 
			/* emulated "has" allows full complex selectors in match */ 
			name: "-hitch-has",
			base: '',
			filter: function(match, argsString){
				var first = argsString.charAt(0);
                /* 
                if the first char is a combinator, the match itself is implied... 
                While this works in selectors API level 2 with :scope, 
                in CSS :scope means something slightly different... therefore when it is  
                'implied' we mark it with a x-hitch-id attribute and 
                rewrite the selector that we use.
                */
				if(first === '>' || first === '~'){
					if(!match.getAttribute('x-hitch-id')){  
						match.setAttribute('x-hitch-id', hid++);
					}
					argsString = '#' + match.getAttribute('x-hitch-id') + " " + argsString;
				}
				return match.querySelector(argsString) !== null;
			}
		},
		{
			/* 
				vendor-driven const allows for experimental 'unprefixing' for impls 'almost' there
				in terms of universal implementation/api... play with it early, use it wisely, 
				provide feedback about minor incompatibility and _know_ that it is experimental.
			*/
			name: "-hitch-beta-const",
			base: '',
			"const": {name: "-hitch-beta-", replaceWith: hitch.vendor}
		}]);

})(Hitch);
