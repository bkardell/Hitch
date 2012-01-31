var HitchCompiler = function(src, finished){
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
				    // It is possible on mobile webkit to arrive here unable to use the segments
					// beacuse we need to emulate ":any"... 
					// in this case we will use the base instead...
					joint = (segments.length > 0 && segments[0] !== '') ? segments.join(' ') : base;
					
					// assure there is an index for the joined segments
					if(!segIndex[joint]){
						segIndex[joint] = { hitches: {}, orig: rule.rule.split("{")[0] };
					}
					// assure there are filters for the joined segments
					if(!segIndex[joint].hitches[segment.filter]){
						segIndex[joint].hitches[segment.filter] = [];
					}
					
					segIndex[joint].hitches[segment.filter].push({
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
		return (fn) ? fn.name.replace("MatchesSelector", "-any") : '-hitch-any';
	};

	// Returns a string with no comments or whitespace and trimmed
	var trimmedString = function(str){
		return str.replace(/\/\*.*\*\//g, '').replace(/\n|\t/g,'').trim();
	};
	
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
			for(i = 0; i < unGrouped.length; i++){
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
	var transformToNative = function(selector, compiledRule){
		var
			// placeholder for the last segment of the selector (before filter)
			lastSegmentSelector,
			// placeholder for the segment of the selector (past filter)
			pastFilterSelector, 
			temp = trimmedString(selector).replace(getHasFilterRE(), function(m,i,s){
			var 
				// selector returned for use by CSS
				nativeSelector,
				// selector used in compiledRule segment
				segmentSelector, 
				
				tmp;

			// if matched filter isn't in the mapper, initialize it
			if(typeof mapper[m] === 'undefined'){
				mapper[m] = { 
					//TODO: maybe try to create a symbolic name as well for easier reading
					index: mapperCount++, 
					filter: m.split("(")[0],
					args: m.match(/\((.*)\)/)[1] 
				}; 
			}

			base = Hitch.getBase(m.split("(")[0]);

			// if not defined set to wildcard so rule is complete
			// TODO: Determine if this a 'safe' default for performance concerns
			if(!base || base === ''){ base = "*"; }

			// if the any matcher is ours - use nothing, otherwise use vendors
			nativeSelector = (any === '-hitch-any') ? '' : any + "(" + base + ")";
			
			// If there was a filter for this then suffix the native class
			if(typeof mapper[m].index !== 'undefined'){
				nativeSelector +=  "._" + mapper[m].index;
			}
			
			// ungroup the selector based on the match, trim it and add native 
			segmentSelector = trimmedString(unGroupSelector(m, i, s)) + nativeSelector.replace(any+"(*)","");
			
			// match unmatched right parens that can get whacked when inside a native filter
			segmentSelector += (("(" + segmentSelector).match(/\(/g).length !== (")" + segmentSelector).match(/\)/g).length) ? ')' : '';
			
			if(compiledRule.segments.length > 0){
				lastSegmentSelector = compiledRule.segments[compiledRule.segments.length-1].raw;
				pastFilterSelector = segmentSelector.substring(segmentSelector.indexOf(lastSegmentSelector)  + lastSegmentSelector.length);
				if(pastFilterSelector !== '' && pastFilterSelector !== ')'){
					segmentSelector = trimmedString(pastFilterSelector);
				}
			}
	
			compiledRule.segments.push({
				"selector": segmentSelector.replace(":._","._"),
				"raw": ":" + m,
				"filter":   ":"+ mapper[m].filter,
				"filterargs": mapper[m].args, 
				"cid": mapper[m].index, 
				"base": base
			});
			
			if(getHasFilterRE().test(m.substring(m.indexOf("(")+1))){
				compiledRule.segments[compiledRule.segments.length-1].filterargs = 
					transformToNative(
						m.match(/\((.*)\)/)[1] + ")", 
						compiledRule 
					).replace(":._","._");
				
				tmp = Object.create(compiledRule);
				tmp.segments = [compiledRule.segments[compiledRule.segments.length-1]];
				tmp.rule = '';
				compiled.push(tmp);
			}
			return nativeSelector;
		});
		
		// Ick... you can arrive here with mismatched extra parens at the end..
		if( (temp.match(/\(/g) || []).length !== (temp.match(/\)/g) || []).length ){
			temp = temp.substring(0,temp.length-1);
		}
		return temp;
	};
		
	// Process source rules for plugins to require
	src = src.replace(/\@-hitch-requires[^\;]*\;/g, function(m,i,s){
		var parts = m.split(/\s|\;/g);
		if(parts[1].indexOf('package:') === 0){
			requires.push('http://www.hitchjs.com/use/' + parts[1].substring(8) + ".js");
		}else{
			requires.push(parts[1]);
		}
		return '';
	});
	
	
	// Set the any pseudo-class for use in compiling rules
	any = "-" + vendorMatcher();

	// oohhh I hate you mobile webkit!  false, false advertizing!
	try{ 
		if(document.head.querySelectorAll(":" + any + "(*)").length !== -1){
			// Mobile webkit will fail here - we have to emulate the -any- matcher
		}
	}catch(e){ any = "-hitch-any"; }

	// You cannot re-use this or you will have problems in some browsers...
	var getHasFilterRE = function(){
		var	pluginNames = Hitch.list(),
			// Regex string for testing parens --- params declaration
			regExpPart = '\\([^\\)]*\\)';
			
		return new RegExp(pluginNames.join(regExpPart + '|') + regExpPart,"g");
	};
	
	var compile = function(){
		var 
			// placeholder array of source rules
			input, 
			// the compiled rule we build in the processing
			compiledRule, 
			// for handling capture of :-hitch-args to consts
			rep, 
			// for skipping rules inside @media
			mediaSkipMode;
		constants = Hitch.getConsts();
		try{
			// Process source rules for constants
			src = src.replace(/\@-hitch-const[^\;]*\;/g, function(m,i,s){
				var parts = m.split(/\s|\;/g), name;
				parts.shift();
				name = parts.shift();
				constants.push({name: name, replaceWith: parts.join(' ')});
				Hitch.add({name: name, base: parts.join(' ')});
				return '';
			});
			
			constants.sort(function(a,b){
				if(a.name.length > b.name.length){ return -1; }
				if(a.name.length === b.name.length){ return 0; }
				return +1;
			});
			
			rep = function(constant){
				src = src.replace(new RegExp(":" + constant.name,'g'), function(m,i,s){
					var ret, cap;
					
					ret = constant.replaceWith;
					cap = ret.indexOf(':-hitch-args');
					if(cap !== -1){
						ret = ret.replace(':-hitch-args', 
							s.substring(s.indexOf('(') + 1,s.indexOf(')'))
						);
					}
					
					return ret;
				});
			};
			
			
			// Process source rules to replace constant names with selectors
			for(i=0;i<constants.length;i++){
				rep(constants[i]);
			}
			
			// Ugly pre-process to deal with media tags which make our parse problematic...
			src = src.replace(/@media/g, "@@media");
			input = src.split(/\}|@media/);
			
			// iterate over each CSS rule and process
			for(var i = 0; i < input.length; i++){
				
				// initialize a rule to push on stack with a rule id
				compiledRule = { rid: i };
				
				// the raw CSS rule
				raw = input[i].trim();
				
				
				// guard against processing emptiness
				if(mediaSkipMode || raw === '') { 
					if(raw === ''){
						mediaSkipMode = false;
					}
					continue; 
				}else if(raw.indexOf("@")===0){
					if(raw[1] === 'i'){ //quick check for import
						raw = raw.replace(/^@.*;/,'').trim();
					}else{
						console.log('skipping a rule because it was media or page: ' + raw);
						if(raw === '@'){ // quick check for media rule
							mediaSkipMode = true;
						}
						continue; // media rules / page rules, whole block is of no interest
					}
				}
				
				// normalize rule again
				raw = raw + " }";
				
				// placeholder raw rule for use later
				nativeRule = raw;
				
				// split out rule for parts to use later
				ruleParts = raw.split('{');
				
				// get just the selector
				ruleSelector = ruleParts[0]; 
				
				
				// get the body only (normalized with open brace)
				ruleBody = ' {' + ruleParts[1];
				
				// if the rule has a plugin reference (filter) and isn't 'all' wildcard
				if(ruleSelector !== '*' && getHasFilterRE().test(ruleSelector)){
					
					// this compiledRule might have segments
					compiledRule.segments = [];
					
					// get a comment
					comment = buildComment(ruleSelector);
					
					// push the selector into a native form
					ruleSelector = transformToNative(ruleSelector, compiledRule);
				
					// set the rule to the processed rule
					compiledRule.rule = comment + ruleSelector.replace(new RegExp(":" + any + "\\(\\*\\)","g"),"").replace(/:\._/g,"._") + ruleBody;
	
				}else{
					// set the rule to the raw (unprocessed) because there are no filters
					compiledRule.rule = raw;
				}
				
				//console.log("compiled rule:" + JSON.stringify(compiledRule));
				// push the compiled rule into the stack
				compiled.push(compiledRule);
			}
			//console.log(JSON.stringify(compiled,null,4));
			/* TODO: temporarily doing extra work to fix the model contract */
			var outModel = { rules: [], segIndex: getSegIndex(compiled), plugins: requires };
			for(var ccc=0; ccc < compiled.length; ccc++){
				if(compiled[ccc].rule){
					outModel.rules.push(compiled[ccc].rule);
				}
			}
			finished(outModel);
		}catch(e){
			console.error(e);
		}
	}

	
	Hitch.ajax.load(requires,null,'script',null,compile);
};

if(typeof module !== 'undefined' && module.exports){
	module.exports.HitchCompiler = HitchCompiler;
}