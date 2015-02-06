(function (Hitch){
	"use strict";

	/* 
		We create a `pseudoTree` which allows us to do intelligent lookups and convenient 
		calling faster and more conveniently... Given a change in the dom, we should be 
		able to very quickly winnow rules down (via another index, like the browser) and this will 
		be called only when necessary. 
		{
			pseudo-class {
				specific-arguments {
					hash-code          // will be the class name attached
					parsed-args        // already parsed arguments which will be apply'ed to filter
					matches-selector   // already run/built quick match selector for limiting calls to filter itself
				}
			}
		}
	*/
	var pseudosTree = {};
	Hitch.pseudosTree = pseudosTree;

	Hitch.customSelector = (function () {

		// when args have to be parse, specifically in terms of css, they don't have to be re-parsed 
		// each time, this would be wasteful, we can do better, store it away and just recall it.
		// similarly, we can use this to capture the matches based on the arg
		// { argsHash: { args: [], matches: str }
		var parsedArgs = {}, simple = function (args) { return args; };
		return {
			set: function (name, conf) {
				var predicateArgsParser = conf.parseArgs || simple;
				pseudosTree[name] = pseudosTree[name] || {};

				Sizzle.selectors.pseudos[name] = Sizzle.selectors.createPseudo(function (argsString) {
					var argsArr, compiled = pseudosTree[name][argsString];
					if (!compiled) {
						argsArr = (conf.parseArgs) ? predicateArgsParser(argsString) : argsString;
						compiled = { args: argsArr, hash:  Hitch.hashCode(name + argsString) };
						if (typeof conf.matches === "function") {
							compiled.matches = conf.matches.apply(this, argsArr);
						} else {
							compiled.matches = conf.matches || "*";
						}
						pseudosTree[name][argsString] = compiled;
					}

					// This is the actual instance
					return function (elem) {
						var result = Sizzle.matchesSelector(elem, compiled.matches) && conf.predicate.apply(elem, [elem].concat(compiled.args));
						if (elem.__hitchMarkMatch) {
							elem.classList[result ? "add" : "remove"](compiled.hash);
						}
						return result;
					};
				});
			}
		};
	}());

	HTMLElement.prototype.Hitch = function () {
		return {
			querySelectorAll: function (selector) { 
				/* jshint -W064 */
				return Sizzle(selector, this);
			}.bind(this),
			querySelector: function (selector) { 
				/* jshint -W064 */
				return Sizzle(selector + ":first", this);
			}.bind(this), 
			matchesSelector: function (selector, mark) {
				this.__hitchMarkMatch = mark;
				return Sizzle.matchesSelector(this, selector);
			}.bind(this)
		};
	};
}(Hitch || {}));