var cssPlugins = (function(){
	var matchFn, emulate = (
		$ && $.browser.msie && $.browser.version.indexOf('8')===0
	);
	
	// If it's webkit or IE - we have to shim this....
	if(document.head && document.head.webkitMatchesSelector || emulate){
		Element.prototype._setAttribute = Element.prototype.setAttribute;
		Element.prototype.setAttribute = function(name, val) { 
			var e, prev, temp;
			prev = this.getAttribute(name); 
			if(document.createEvent){
				e = document.createEvent("MutationEvents"); 
				this._setAttribute(name, val);
				e.initMutationEvent("DOMAttrModified", true, true, null, prev, val, name, 2);
				this.dispatchEvent(e);
			}else{
				e = $.Event('DomAttrModified', {
						"prevValue": prev, 
						"attrName": name, 
						"newValue": val
					});
				this[name] = val;
				temp = $(this);
				temp.trigger(e);
			}
		}
	};
	var query = function(el,q){
		if(!emulate){
			return el.querySelectorAll(q);
		}
		return $((el.nodeName==='BODY') ? document : el).find(q);
	}
	
	var toArray = function(nl){
		try{
			return Array.prototype.slice.call(nl, 0);
		}catch(e){
			return $.makeArray(nl);
		}
	}
    var perf = { checks: 0, queries: 0 };

    var	vendor,

		// on document load events whether to call ready by default
		defaultInit = true,
		
		// segIndex is how we optimize 
		segIndex, 
		
		// Store the compiled rules...
		compiled_cssplugin_rules = [], 
		
		// basically this is "known plugin configurations"
		cssplugin_selectors = [{ 
				/* emulated "super" matches - allows full complex selectors in match */ 
				name: "-plugins-any",
				base: '',
				fn:   function(match,argsString){
						return match.matchesSelector(argsString);
				}
		}],
		
		// a ready fn... when things are ready to go, kicks things off
		ready, 
		
		// This will track data about rules that have aliases/filters 
		rulesWeCareAbout = [], 
		
		// Rules we register as native -- a superset of rules we care about
		nativeRules = [], 
		
		// This will help prevent infinite recursion
		subtreesemaphor = false,
		
		// applies filters as they match the left part(s)
		searchUpward = function(el,q,last){
			var x, d, tmp, f, a;
			if(el.tagName !== 'BODY' && q.scan !== ''){
				for(var i in q.index){ 		// walk through each one in the index
					try{
						if(matchFn(el,i)){  // Do we match this one?
							for(f in q.index[i].filters){	// walk through each filter
								tmp = q.index[i].filters[f];
								for(a=0;a<tmp.length;a++){
									x = filters.map[f].fn(el,tmp[a].args,{siblings: el.parentNode.children, location: normalizedUrl() })
									d = tmp[a].cid; 
									(x) ? addMangledClass(el,d) : removeMangledClass(el,d);			
								}
							}
						}
					}catch(e){
						console.log('shit');
					}
					
				}
				last = el;			
				return searchUpward(el.parentNode,q,last);
			}
			return last;
		},
		
		/* add the element and all of its parents to an array in depth order (like NodeList) */
		grabAncestralTree = function(e,coll){
			while(e.tagName !== 'BODY'){
				coll.push(e);
				e = e.parentNode;
			}
			return coll;
		},
		
		// tests all elements of a subtree with the tester (see below)... 			
		testSubtree = function(t,isInit){
			var start = new Date().getTime(), ancestralTree;
			var el = t.target || t, potential = [];
			if(el.parentNode === null){ return; /* firebug... */ }
			if(t.type === 'DOMNodeRemoved'){
				// This event is before the removal, so we have to release control...
				setTimeout(function(){
					testSubtree({type: 'DOMNodeInserted', target: t.relatedNode, relatedNode: t.relatedNode},false);
				},1);
				return;
			}
					
			if(!subtreesemaphor){
				perf = { checks: 0, queries: 0 };
				subtreesemaphor = true
				try{
					perf.queries++;
					// returns false if we can't target an upward search
					var maybeRules  = findPotentiallyRelevantRules(t);
					if(maybeRules){
						// we can do this and short-circuit return;
						el = searchUpward(el,maybeRules) || el;  // || document.body);
						return;
					}
					
					for(var i=0;i<potential.length;i++){
						// This allows us to detect class name changes
						potential[i]._oldclasses = potential[i].className;
					}	
					tester(el,(t.type === 'DOMNodeInserted') ? grabAncestralTree(t.relatedNode,[el]) : false);
				}catch(exc){
					// uhoh!
					console.log(exc.message);
				}finally{
					perf.duration = new Date().getTime() - start + "ms";
					//console.log(JSON.stringify(perf));
					subtreesemaphor = false;
				}
			}
		},
		
		hasMangledClass = function(t,i){
			return new RegExp("_" + i).test((t.target || t).className);
		},
		
		addMangledClass = function(t,i){
			var e = (t instanceof NodeList) ? t : [t];
			for(var x=0;x<e.length;x++){
				if(!hasMangledClass(e[x],i)){
					(e[x].target || e[x]).className += " _" + i;
				}
			}
		}, 
		
		removeMangledClass = function(t,i){
			var e = (t instanceof NodeList) ? t : [t];
			for(var x=0;x<e.length;x++){
				if(hasMangledClass(e[x],i)){
				    (e[x].target || e[x]).className = (e[x].target || e[x]).className.replace(' _' + i, ''); 
				}
			}
		},
		
		wrappers = {
			'class': function(v){ return "." + v; },
			'id': function(v){ return "#" + v; },
			'attr': function(v){ return "[" + v; }
		},
		
		//TODO - this is weak... probably a better index for this should also 
		// be built by the native
		findPotentiallyRelevantRules = function(t){
			var temp, wrap, filteredSet = {}, rule, prefix = "", suffix = "", m = [], x = [], wrapped;
			if(t.attrName){  // It's some kind of attribute
				wrap = (wrappers[t.attrName]) ? wrappers[t.attrName] : wrappers['attr'];
				for(var r in segIndex){
					m.push(r);
					temp = r + JSON.stringify(segIndex[r]);
					wrapped = wrap(t.attrName.trim());
					if(temp.indexOf(wrapped) !== -1){
						filteredSet[r] = segIndex[r];
					}
				}
			}else{
				// Something for tag names?
				return false;
			}
			return { scan: m.join(","), index: filteredSet };
		},
		
		
		// This is the primary tester that says "apply this rule" or don't...  
		tester = function(el,list,s){  
			var n,
				test,
				segments,
				x,
				tests,
				maybeRules = rulesWeCareAbout,
				potential,
				t,
				ancestral = {},
				last;
				
			// We have to see if this matches any of the rules we care about....
			for(var test in segIndex){
				try{
					potential = list;
					if(list){ // inserts
						potential = list.concat(toArray(query(el,test)));
					}else if(el.querySelectorAll){
						potential = toArray(query(el,test));
					}
					for(var c=0;c<potential.length;c++){
						n = potential[c];
						t = {target: n};
						fs = segIndex[test].filters;
						for(var filterName in fs){
							tests = fs[filterName];
							for(var i=0;i<tests.length;i++){
								x = filters.map[filterName].fn(n,tests[i].args,{siblings: n.parentNode.children, location: normalizedUrl() });
								(x) ? addMangledClass(t,tests[i].cid) : removeMangledClass(t,tests[i].cid);
							}
						}
					}
				}catch(e){
					console.log(e.message);
					// one invalid rule doesnt spoil the bunch... Example:
					// :not(.x,.y) will be valid someday, but it throws now... 
				}
			}
		},
		
		normalizedUrl = function() {
			var location = window.location.href.split("?")[0].split("/");
			location.pop();
			return location.join('/');
		},
		
		filters = {
			// known filters
			map: {},
			
			/* Simulate the parser so we can figure this shit out... */
			parseFilters:   function(){
				return compiled_cssplugin_rules;
			},
			
			init: function(){
				var head = document.getElementsByTagName('head')[0],
					buff = [], 
					ns = document.createElement('style'), 
					vendors = "-moz-|-ms-|-webkit-|-o-";
					
				if(nativeRules){
					for(i=0;i<nativeRules.length;i++){
						buff.push(nativeRules[i]);
					}
					try{
						console.log(buff.join("\n\n"));
						ns.innerHTML = buff.join("\n\n");
						head.appendChild(ns);
					}catch(e){
						head.appendChild(ns);
						document.styleSheets[document.styleSheets.length-1].cssText = buff.join('\n\n');
					}
				};
				
				testSubtree(document.body,head.webkitMatchesSelector);
				if(!document.body.addEventListener){
					$(document.body).on('DomAttrModified', testSubtree);
				}else{
					document.body.addEventListener('DOMAttrModified',testSubtree);
					document.body.addEventListener('DOMNodeInserted',testSubtree);
					document.body.addEventListener('DOMNodeRemoved',testSubtree);
					document.addEventListener('DOMSubtreeModified',function(t){
						if(!t.target._isSetting && t.target._oldclasses !== t.target.className){
							t.target._isSetting = true;
							t.target.setAttribute('class',t.target.className);
							t.target._oldclasses = t.target.className;
							t.target._isSetting = false;
						}
					});
				}				
			},
			
			registerFilter: function(alias, base, filter, ancestrallytruthy){
				if(filter){
					filters.map[":" + alias] = {  fn: filter, base: base, ancestrallytruthy: ancestrallytruthy };
				};
			}
		};
		
	// Go!
	var ready = function(){
		var matches, compiledForm;
		if(cssplugin_selectors){
			for(var i=0;i<cssplugin_selectors.length;i++){
				filters.registerFilter(
					cssplugin_selectors[i].name,
					cssplugin_selectors[i].base,
					cssplugin_selectors[i].fn,
					cssplugin_selectors[i].ancestrallytruthy
				);
			};
			if(document.body.matchesSelector){ vendor = "", matches = 'matchesSelector'; }
			else if(document.body.mozMatchesSelector){ vendor = "-moz-"; matches = 'mozMatchesSelector'; }
			else if(document.body.webkitMatchesSelector){  vendor = "-webkit-"; matches = 'webkitMatchesSelector'; }
			else if(document.body.oMatchesSelector){  vendor = "-o-"; matches = 'oMatchesSelector'; }
			else if(document.body.msMatchesSelector){ vendor = "-ms-";  matches = 'msMatchesSelector'; } 
			else{
				vendor = '-plugins-'; matches = 'pluginsMatchesSelector';
				matchFn = function(e,sel){
					return $(e).is(sel);
				}
			}
			if(!matchFn){
				matchFn = function(e,s){ 
					return e[matches](s); 
				}
			}
			compiledForm = filters.parseFilters()[0]; // do we need more than 1?
			nativeRules = compiledForm.rules;  
			segIndex = compiledForm.segIndex;
			filters.init();
		};
	};
		
	//TODO: All browsers cool with addEventListener?
	try{
		document.addEventListener( "DOMContentLoaded", function(){
			if(defaultInit){
				ready();
			};
		}, false );
	}catch(e){
		document.onload = function(){
			if(defaultInit){
				ready();
			}
		}
	}		
	return { 
		useManualInit: function(){ defaultInit = false; },
		
		init: function(){
			ready();
		},
		
		addCompiledRules: function(rDescs){
			compiled_cssplugin_rules = compiled_cssplugin_rules.concat(rDescs);
			return this;
		},
		
		addFilters: function(fDescs){
			cssplugin_selectors = cssplugin_selectors.concat(fDescs);
		},
		
		getPluginNames: function(){
			var ret=[], i=0;
			for(var i=0;i<cssplugin_selectors.length;i++){
				ret.push(cssplugin_selectors[i].name);	
			}
			return ret;
		},
		
		getBase: function(p){
			for(var i=0;i<cssplugin_selectors.length;i++){
				if(p===cssplugin_selectors[i].name){
					return cssplugin_selectors[i].base;
				}	
			}
		}
	};
}());

if(typeof module !== 'undefined' && module.exports){
	module.exports = cssPlugins;
};
var cssPluginsCompiler = function(src, finished){
	var 
		// placeholder for the full CSS rule during processing
		raw, 
		// selector portion of CSS rule during processing
		ruleSelector, 
		// body portion of CSS rule during processing
		ruleBody,
		// array of CSS rule part for use during processing
		ruleParts,
		// full CSS rule during processing
		nativeRule, 
		// regex match of filters found in rule during processing
		filtersFound, 
		// a comment created and added to each rule processed
		comment,
		// collection of compiled rules
		compiled = [],
		// base selector for a plugin  
		base,  
		// place holder for the any pseduo-class
		any,
		// object to store rule information during compilation - see transformToNative
		mapper = {},
		// index counter for mapped rules - see transformToNative
		mapperCount = 0,
		// collection of require statements
		requires = [],
		// collection of JS source files requested for plugins
		pluginSources = [],
		// collection of constants defined
		constants = [];

	if(!String.prototype.trim) {  
	  String.prototype.trim = function () {  
		return this.replace(/^\s+|\s+$/g,'');  
	  };  
	}  

	var getSegIndex = function(rulez){
		var 
			// segments of all the rules
			segments = [], 
			// rule being processed
			rule, 
			// segment of rule being indexed
			segment, 
			// placeholder for selector cleaned of our suffixes
			sans, 
			// placeholder for segments being joined 
			joint, 
			// return object 
			segIndex = {};
		for(var i = 0; i < rulez.length; i++){
			// new set of segments to process
			segments = [];
			// rule to process
			rule = rulez[i];
			// don't index non-segmented rules
			if(!rule.segments || rule.segments.length === 0) { continue; }
			for(var x = 0; x < rule.segments.length; x++){
				segment = rule.segments[x];
				// drop our classes to create the native CSS for indexing
				sans = segment.selector.replace(/\._\d/, "").replace(":not()","");
				// add the cleaned selector to the segments
				segments.push(sans);
				// if there is a filter add meta-data for easy lookup later
				if(segment.filter){
					joint = (segments.length > 0) ? segments.join(' ') : "*";
					// assure there is an index for the joined segments
					if(!segIndex[joint]){
						segIndex[joint] = { filters: {} };
					}
					// assure there are filters for the joined segments
					if(!segIndex[joint].filters[segment.filter]){
						segIndex[joint].filters[segment.filter] = [];
					}
					
					segIndex[joint].filters[segment.filter].push({
						sid: x, 
						rid: i, 
						cid: segment.cid, 
						args: segment.filterargs, 
						base: segment.base
					});
				}
			}
		}
		return segIndex;
	};

	// Returns the documents vendor matcher Function
	var vendorMatcher = function(){
		var h = document.getElementsByTagName('head')[0],
			fn = h.mozMatchesSelector || h.webkitMatchesSelector || h.msMatchesSelector || h.oMatchesSelector;
		return (fn) ? fn.name.replace("MatchesSelector", "-any") : '-plugins-any';
	};

	// Returns a string with no comments or whitespace and trimmed
	var trimmedString = function(str){
		return str.replace(/\/\*.*\*\//g, '').replace(/\n|\t/g,'').trim();
	}
	
	// Returns a comment for a selector that comes from the compiler
	var buildComment = function(selector){
		return "/* was: " + trimmedString(selector) + " */\n";
	};

	// Take a selector and replace the filter, considering grouping
	var unGroupSelector = function(match, index, selector){
		var scanned = 0, temp = selector.split(/\,/), unGrouped=[];		
		for(var i = 0; i < temp.length; i++){
			// yuck... if there is a mismatched paren we need to fix it...
			if((temp[i] + "(").match(/\(/g).length < (temp[i] + ")").match(/\)/g).length){
				unGrouped[unGrouped.length-1] = unGrouped[unGrouped.length-1] + "," + temp[i]; 
			}else{
				unGrouped.push(temp[i]);
			}
		}
		// if there is no grouping - return normally
		if(unGrouped.length === 1) { 
			return selector.substring(0, index); 
		} else {
			for(var i = 0; i < unGrouped.length; i++){
				// position to cut based on real index and scanned
				// minus the loop index because of the dropped commas
				var cut = index - scanned - i; 
				// aggregate scanned based on next group length
				scanned += unGrouped[i].length;
				// if the index from original match is less than scanned
				// meaning we've scanned far enough return a substring from this group
				if(index < scanned){
					return unGrouped[i].substring(0,unGrouped[i].length - match.length - 1);
				}
			}
		}
	};
	
	// Returns a selector transformed for native CSS use
	var transformToNative = function(reHasFn, selector, compiledRule){
		return trimmedString(selector).replace(reHasFn, function(m,i,s){
			var 
				// selector returned for use by CSS
				nativeSelector,
				// selector used in compiledRule segment
				segmentSelector;

			// if matched filter isn't in the mapper, initialize it
			//TODO: Test that args overloading might change this logic
			if(typeof mapper[m] === 'undefined'){
				mapper[m] = { 
					//TODO: maybe try to create a symbolic name as well for easier reading
					index: mapperCount++, 
					filter: m.split("(")[0],
					args: m.match(/\((.*)\)/)[1] 
				}; 
			}

			//TODO: re-map this to just getBase within cssPlugins
			base = cssPlugins.getBase(m.split("(")[0]);

			// if not defined set to wildcard so rule is complete
			// TODO: Determine if this a 'safe' default for performance concerns
			if(!base || base === ''){ base = "*"; }

			// if the any matcher is ours - use nothing, otherwise use vendors
			nativeSelector = (any === '-plugin-any') ? '' : any + "(" + base + ")";
			
			// If there was a filter for this then suffix the native class
			if(typeof mapper[m].index !== 'undefined'){
				nativeSelector +=  "._" + mapper[m].index;
			}
			
			// ungroup the selector based on the match, trim it and add native 
			segmentSelector = trimmedString(unGroupSelector(m, i, s)) + nativeSelector.replace(any+"(*)","");
			
			// match unmatched right parens that can get whacked when inside a native filter
			segmentSelector += (("(" + segmentSelector).match(/\(/g).length !== (")" + segmentSelector).match(/\)/g).length) ? ')' : '';
								
			compiledRule.segments.push({
				"selector": segmentSelector.replace(":._","._"),
				"filter":   ":"+ mapper[m].filter,
				"filterargs": mapper[m].args, 
				"cid": mapper[m].index, 
				"base": base
			});
			
			return nativeSelector;
		});
	};
	
	// Process source rules for constants
	src = src.replace(/\@-plugins-const[^\;]*\;/g, function(m,i,s){
		var parts = m.split(/\s|\;/g), name;
		parts.shift();
		name = parts.shift();
		constants[name] = parts.join(' ');
		cssPlugins.addFilters([{name: name, base: parts.join(' ')}]);
		return '';
	});
	
	// Process source rules for plugins to require
	src = src.replace(/\@-plugins-require[^\;]*\;/g, function(m,i,s){
		var parts = m.split(/\s|\;/g);
		requires.push(parts[1]);
		// TODO: drop jQuery dependency
		pluginSources.push($.getScript(parts[1]));
		//pluginSources.push('/* some js comment */');
		return '';
	});
	
	// Process source rules to replace constant names with selectors
	for(var constname in constants){
		src = src.replace(":" + constname, constants[constname]);
	};
	
	// Set the any pseudo-class for use in compiling rules
	any = "-" + vendorMatcher();

	// oohhh I hate you mobile webkit!  false, false advertizing!
	try{ document.head.querySelectorAll(":" + any + "(*)").length; }
	catch(e) { any = "-plugin-any"; };

	$.when.apply($,pluginSources).then(function(pluginSource){
		var 
			pluginNames = cssPlugins.getPluginNames(),
			// Regex string for testing parens --- params declaration
			regExpPart = '\\([^\\)]*\\)', 
			// Regex of Plugins and parens for testing filter has arguments
			reHasFilter,
			// placeholder array of source rules
			input = src.split("}"), 
			// the compiled rule we build in the processing
			compiledRule,
			// placeholder for the last segment of the selector (before filter)
			lastSegmentSelector,
			// placeholder for the segment of the selector (past filter)
			pastFilterSelector;

		// iterate over each CSS rule and process
		for(var i = 0; i < input.length; i++){
			// You cannot re-use this or you will have problems in some browsers...
			reHasFilter = new RegExp(pluginNames.join(regExpPart + '|') + regExpPart,"g")
			
			// initialize a rule to push on stack with a rule id
			compiledRule = { rid: i };
			
			// the raw CSS rule
			raw = input[i].trim();
			
			
			// guard against processing emptiness
			if(raw === '') { continue; }
			
			
			// normalize rule again
			raw = input[i] + "}";
			
			// placeholder raw rule for use later
			nativeRule = raw;
			
			// split out rule for parts to use later
			ruleParts = raw.split('{');
			
			// get just the selector
			ruleSelector = ruleParts[0]; 
			
			
			// get the body only (normalized with open brace)
			ruleBody = ' {' + ruleParts[1];
			
			// if the rule has a plugin reference (filter) and isn't 'all' wildcard
			if(ruleSelector !== '*' && reHasFilter.test(ruleSelector)){
				
				// this compiledRule might have segments
				compiledRule.segments = [];
				
				// get a comment
				comment = buildComment(ruleSelector);
				
				// push the selector into a native form
				ruleSelector = transformToNative(reHasFilter, ruleSelector, compiledRule);

				if(compiledRule.segments.length > 0){
					lastSegmentSelector = compiledRule.segments[compiledRule.segments.length-1].selector;
					pastFilterSelector = ruleSelector.substring(ruleSelector.indexOf(lastSegmentSelector)  + lastSegmentSelector.length);
					if(pastFilterSelector !== '' && pastFilterSelector !== ')'){
						compiledRule.segments.push({ "selector": trimmedString(pastFilterSelector) });
					}
				}
				
				// set the rule to the processed rule
				compiledRule.rule = comment + ruleSelector.replace(new RegExp(":" + any + "\\(\\*\\)","g"),"").replace(/:\._/g,"._") + ruleBody;
			}else{
				// set the rule to the raw (unprocessed) because there are no filters
				compiledRule.rule = raw;
			}
			
			// push the compiled rule into the stack
			compiled.push(compiledRule);
		}
		//console.log(JSON.stringify(compiled,null,4));
		/* TODO: temporarily doing extra work to fix the model contract */
		var outModel = { rules: [], segIndex: getSegIndex(compiled), plugins: requires };
		for(var ccc=0; ccc < compiled.length; ccc++){
			outModel.rules.push(compiled[ccc].rule);
		}
		finished(outModel);
	});
}

if(typeof module !== 'undefined' && module.exports){
	module.exports = cssPluginsCompiler;
};
cssPlugins.useManualInit();
 $(document).ready(
	function(){ 
		var loads = [], 
			cache;
			
		$('[-plugins-interpret]').each( 
			function(i,el){ 
				var href, 
					deferred = $.Deferred(), 
					initer = function(c){
						cssPlugins.addCompiledRules(c);
						deferred.resolve();
					};
				loads.push(deferred);
				if(el.tagName === 'STYLE'){
					cssPluginsCompiler(el.innerHTML,initer,window.location.path);
				}else{
					href = el.href;
					$.get(href, function(src){
						cssPluginsCompiler(src,initer,href.substring(0,href.lastIndexOf('/')));
					}, 'text');
				}
			}
		);
		$.when.apply($,loads).then(function(){
			cssPlugins.init();
		});
	}
);