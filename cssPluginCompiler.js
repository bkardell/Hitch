var cssPluginCompiler = function(src){
	var inp, 
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
		any = "-" + matcherFn.name.replace("MatchesSelector", "-any"); 
		src = src.replace(/\@-plugin-alias[^\;]*\;/g, function(m,i,s){
			var parts = m.split(/\s|\;/g);
			cssPlugin.addFilters([{name: parts[1], base: parts[2]}]);
			return '';
		}),
		lastPluginSegment,
		pastLastPluginSegment,
		pluginNames = cssPlugin.getPluginNames(),
		reHasPlugin = new RegExp(pluginNames.join('|')),
		reHasFn = new RegExp(pluginNames.join(regExpPart + '|') + regExpPart,"g"),
		inp = src.split("}");
		
		try{ // oohhh I hate you mobile webkit!  false, false advertizing!
			document.head.querySelectorAll(":" + any + "(*)").length;
			//throw e; // make it work in reg webkit for debugging.
		}catch(e){
			any = "-plugin-any";
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
					rawSelector = rawSelector.replace(reHasFn, function(m,i,s){
						var ret;
						//each unique one gets an index
						if(typeof mapper[m] === 'undefined'){
							mapper[m] = { index: mc++, args: m.match(/\((.*)\)/)[1] }; 
							reverse.push(m);
						}
						base = cssPlugin.getBase(m.split("(")[0]);
						if(!base || base === ''){
							base = "*";
						};
						if(any === '-plugin-any'){
							ret = '';
							i=i-1;
						}else{					
							ret = any + "(" + base + ")"; 
						};
						if(typeof mapper[m].index !== 'undefined'){
							ret +=  "._" + mapper[m].index;
						};
						compiled[compiled.length-1].segments.push({
							"selector": (s.substring(li,i) + ret).trim(), 
							"filter":   ":"+ m.split("(")[0],
							"filterargs": mapper[m].args
						});
						return ret;
					});
					rawSelector = rawSelector.trim().replace(/:$/, "").replace(":._","._");
					pluginsFound = rawSelector.match(reHasPlugin);  
					if(pluginsFound){
						for(var x=0;x<pluginsFound.length;x++){
							base = cssPlugin.getBase(pluginsFound[x]);
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