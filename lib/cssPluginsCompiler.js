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
		sans,
		care =  /(\[|#|\.|:|\w)[A-z|0-9|\-]*/g,
		// object to store rule information during compilation - see transformToNative
		mapper = {},
		// index counter for mapped rules - see transformToNative
		mapperCount = 0,
		// collection of require statements
		requires = [],
		// collection of JS source files requested for plugins
		pluginSources = [],
		// collection of constants defined
		constants = [],
		lastPluginSegment,
		pastLastPluginSegment,
		// TODO: re-map this to just the local pluginNames within the cssPlugins
		pluginNames = cssPlugins.getPluginNames(),
		// Plugins put together in an 'or' regex for testing rules
		reHasFilter = new RegExp(pluginNames.join('|')),
		// Regex string for testing parens --- params declaration
		regExpPart = '\\([^\\)]*\\)', 
		// Regex of Plugins and parens for testing filter has arguments
		reHasFn = new RegExp(pluginNames.join(regExpPart + '|') + regExpPart,"g"),
		// Regex for comments
		reComment = /\/\*.*\*\//g,
		// Regex for tabs and newlines
		reWhiteSpace = /\n|\t/g;

		var getSegIndex = function(rulez){
			var segs, rule, segment, lastSeg = 0, sans, joint;
				segIndex = {};
				for(var i=0;i<rulez.length;i++){
					rule = rulez[i];
					segs = [];
					if(rule.segments){
						for(var x=0;x<rule.segments.length;x++){						
							segment = rule.segments[x];
							sans = segment.selector.replace(/\._\d/, "").replace(":not()","");
							
							segs.push(sans);
							if(segment.filter){
								joint = segs.join(' ');
								if(joint===""){ joint = "*"; }
								if(!segIndex[joint]){
									segIndex[joint] = { filters: {} };
								}
								if(!segIndex[joint].filters[segment.filter]){
									segIndex[joint].filters[segment.filter] = [];
								}
								segIndex[joint].filters[segment.filter].push({sid: x, rid: i, cid: segment.cid, args: segment.filterargs});
							};
						};
					};
				}
			return segIndex;
		};

		// Returns the documents vendor matcher Function
		var vendorMatcher = function(){
			var h = document.head,
				fn = h.mozMatchesSelector || h.webkitMatchesSelector || h.msMatchesSelector || h.oMatchesSelector;
			return fn.name.replace("MatchesSelector", "-any");
		};
		
		// Returns a comment for a selector that comes from the compiler
		var buildComment = function(selector){
			return "/* was: " + selector.replace(reComment,'').replace(reWhiteSpace,'').trim() + " */\n";
		};

		// Returns the selector without the colon
		var dropColon = function(selector){
			return selector.trim().replace(/:$/, "").replace(":._","._");
		};

		// Returns a selector transformed for native CSS use
		var transformToNative = function(selector, compiledRule){
			return selector.replace(reComment,'').replace(reHasFn, function(m,i,s){

				var nativeSelector, sel;

				// if matched filter isn't in the mapper, initialize it
				//TODO: Test that args overloading might change this logic
				if(typeof mapper[m] === 'undefined'){
					mapper[m] = { 
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

				if(any === '-plugin-any'){
					nativeSelector = '';
				}else{
					nativeSelector = any + "(" + base + ")"; 
				}

				if(typeof mapper[m].index !== 'undefined'){
					nativeSelector +=  "._" + mapper[m].index;
				}

				sel = (s.substring(0,i) + nativeSelector).replace(reComment,'').replace(reWhiteSpace,'').trim();
				sel += (/\(\.\_\d$/.test(sel) )  ? ')' : '';
				
				compiledRule.segments.push({
					"selector": sel, 
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
			//pluginSources.push($.getScript(parts[1]));
			pluginSources.push('/* some js comment */');
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
				// placeholder array of source rules
				input = src.split("}"), 
				// the compiled rule we build in the processing
				compiledRule;

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
				
				// get the body only
				ruleBody = ruleParts[1];
				
				// if the rule has a plugin reference (filter) and isn't 'all' wildcard
				if(ruleSelector !== '*' && reHasFilter.test(ruleSelector)){
					
					// this compiledRule might have segments
					compiledRule.segments = [];
					
					// get a comment
					comment = buildComment(ruleSelector);
					
					// push the selector into a native form
					ruleSelector = transformToNative(ruleSelector, compiledRule);
					
					// clean up colon
					ruleSelector = dropColon(ruleSelector);
					
					// build a match for the filter(s)
					filtersFound = ruleSelector.match(reHasFilter);  
					
					if(filtersFound){
						for(var x = 0; x < filtersFound.length; x++){
							//TODO: re-map to getBase in cssPlugins
							base = cssPlugins.getBase(filtersFound[x]);
							//stragglers...
							ruleSelector = ruleSelector.replace(new RegExp(":" + filtersFound[x],"g"),function(){
								return base || '';
							});
						};
					};	
					
					if(compiledRule.segments.length === 0){
						delete compiledRule.segments;  
					}else{
						var lastPluginSegment = compiledRule.segments[compiledRule.segments.length-1];
						var pastLastPluginSegment = ruleSelector.substring(ruleSelector.indexOf(lastPluginSegment.selector)  + lastPluginSegment.selector.length ).trim();
						if(pastLastPluginSegment !== '' && pastLastPluginSegment !== ')'){
							compiledRule.segments.push({"selector": pastLastPluginSegment});
						}
					};
					sans = ruleSelector.match(care);
					for(var x = sans.length-1; x >= 0; x--){
						if(sans[x][0]===':'){
							sans.splice(x,1);  // get rid of these, need a better regex...
						}
					};
					compiledRule.rule = comment + ruleSelector.trim() + "{" + ruleBody;
				}else{
					// initialize a compiled rule in raw form (no segments) and a rule id
					compiledRule.rule = raw;
				};
				
				// push the compiled rule into the stack
				compiled.push(compiledRule);
			};
			
			console.log('compiled rules:', compiled);
			
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