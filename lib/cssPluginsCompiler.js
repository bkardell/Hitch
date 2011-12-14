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
						args: segment.filterargs
					});
				}
			}
		}
		return segIndex;
	};

	// Returns the documents vendor matcher Function
	var vendorMatcher = function(){
		var h = document.head,
			fn = h.mozMatchesSelector || h.webkitMatchesSelector || h.msMatchesSelector || h.oMatchesSelector;
		return fn.name.replace("MatchesSelector", "-any");
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
				"cid": mapper[m].index
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
			reHasFilter = new RegExp(pluginNames.join(regExpPart + '|') + regExpPart,"g"),
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
				compiledRule.rule = comment + ruleSelector.replace(new RegExp(":" + "-moz-any\\(\\*\\)","g"),"").replace(":._","._") + ruleBody;
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
}