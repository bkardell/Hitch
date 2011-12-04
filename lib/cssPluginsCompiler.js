var cssPluginsCompiler = function(src){
	
	// take care of any aliases right away
	// TODO: Test this for multiple @alias rules (not sure it grabs all now)
	src = src.replace(/\@alias[^\;]*\;/g, function(m,i,s){
		var parts = m.split(/\s|\;/g);
		cssPlugins.addFilters([{name: parts[1], base: parts[2]}]);
		return '';
	});
	
	var inp = src.split("}"), 
		raw, 
		rawSelector, 
		nativeRule, 
		pluginsFound, 
		base,  
		li,
		sans,
		h = document.head;
		matcherFn = h.mozMatchesSelector || h.webkitMatchesSelector || h.msMatchesSelector || h.oMatchesSelector,
		regExpPart = '\\([^\\)]*\\)', 
		care =  /(\[|#|\.|:|\w)[A-z|0-9|\-]*/g,
		compiled = [], 
		mapper = {},
		reverse = [];
		mc = 0,
		opts = { tags: {}, attributes: {}, ids: {}, classes: {} },
		any = "-" + matcherFn.name.replace("MatchesSelector", "-any"), 
		lastPluginSegment,
		pastLastPluginSegment,
		pluginNames = cssPlugins.getPluginNames(),
		reHasPlugin = new RegExp(pluginNames.join('|')),
		reHasFn = new RegExp(pluginNames.join(regExpPart + '|') + regExpPart,"g");
		
	var selectorTransform = function(match,i,str){
		var ret;
		//each unique one gets an index
		if(typeof mapper[match] === 'undefined'){
			mapper[match] = { index: mc++, args: match.match(/\((.*)\)/)[1] }; 
			reverse.push(match);
		}
		base = cssPlugins.getBase(match.split("(")[0]);
		if(!base || base === ''){
			base = "*";
		}
		ret = any + "(" + base + ")"; 
		if(mapper[match].index){
			ret +=  "._" + mapper[match].index;
		}
		compiled[compiled.length-1].segments.push({
			"selector": (str.substring(li,i) + ret).trim(), 
			"filter":   ":"+ match.split("(")[0],
			"filterargs": mapper[match].args
		});
		return ret;
	};
		
	for(var i=0;i<inp.length;i++){   // for each rule...
		li = 0;
		raw = inp[i].trim();
		if(raw !== ''){
			raw = inp[i] + "}";
			nativeRule = raw;
			o = raw.split("{");
			rawSelector = o[0]; //raw.substring(0,raw.indexOf("{"));
			if(rawSelector !== '*' && reHasPlugin.test(rawSelector)){   // if the rule has a plugin reference
				
				compiled.push({segments:[]});
				
				rawSelector = rawSelector.replace(reHasFn, selectorTransform);
					
				pluginsFound = rawSelector.match(reHasPlugin);  
				
				if(pluginsFound){
					for(var x=0;x<pluginsFound.length;x++){
						base = cssPlugins.getBase(pluginsFound[x]);
						//stragglers...
						rawSelector = rawSelector.replace(new RegExp(":" + pluginsFound[x],"g"),function(){
							return base || '';
						});
					}
				}
				
				if(compiled[compiled.length-1].segments.length === 0){
					delete compiled[compiled.length-1].segments; 
				}else{
					var lastPluginSegment = compiled[compiled.length-1].segments[compiled[compiled.length-1].segments.length-1];
					var pastLastPluginSegment = rawSelector.substring(rawSelector.indexOf(lastPluginSegment.selector)  + lastPluginSegment.selector.length ).trim();
					if(pastLastPluginSegment!==''){
						compiled[compiled.length-1].segments.push({"selector": pastLastPluginSegment});
					}
				}

				sans = rawSelector.match(care);
					
				for(var x=sans.length-1;x>=0;x--){
					if(sans[x][0]===':'){
						sans.splice(x,1);  // get rid of these, need a better regex...
					}
				};
				
				compiled[compiled.length-1].rule = rawSelector.trim() + "{" + o[1];
			}
			
		}
	}
	
	return compiled;
}