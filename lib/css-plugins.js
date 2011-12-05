(function(){
	var cssPlugins;
	((typeof exports !== "undefined" && exports !== null) ? exports : this).cssPlugins = (function() {
		
		var 
			// Rules supplied to be used for plugins
			rules = [],
			// Plugins to execute against DOM
			plugins = [],
			// Object to hold info about current browser
			browser = {
				// The CSS vendor prefix for the browser
				vendor: '',
				// The matchesSelector function name
				matchesSelector: '',
				// whether info is set and ready to use
				ready: false
			},
			
			// semaphore to help prevent recursion in checkDOM
			subTreeSemaphor = false;
		
		// if there is no matchesSelector shim one
		if(!document.head.matchesSelector){
			Element.prototype.matchesSelector = function(s){ 
				return this[matches](s); 
			}
		}
			
		// If it's webkit - we have to shim setAttribute
		if(document.head.webkitMatchesSelector){
			Element.prototype._setAttribute = Element.prototype.setAttribute
			Element.prototype.setAttribute = function(name, val) { 
				var e = document.createEvent("MutationEvents"); 
				var prev = this.getAttribute(name); 
				this._setAttribute(name, val);
				e.initMutationEvent("DOMAttrModified", true, true, null, prev, val, name, 2);
				this.dispatchEvent(e);
			}
		}

		// Compiles rules from CSS into objects useable by plugins
		var compiler = function(src){
			// take care of any aliases right away
			// TODO: Test this for multiple @alias rules (not sure it grabs all now)
			src = src.replace(/\@alias[^\;]*\;/g, function(m,i,s){
				var parts = m.split(/\s|\;/g);
				cssPlugins.add({name: parts[1], base: parts[2]});
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
				regExpPart = '\\([^\\)]*\\)', 
				care =  /(\[|#|\.|:|\w)[A-z|0-9|\-]*/g,
				compiled = [], 
				mapper = {},
				reverse = [];
				mc = 0,
				opts = { tags: {}, attributes: {}, ids: {}, classes: {} },
				any = "-" + browser.matchesSelector.replace("MatchesSelector", "-any"), 
				lastPluginSegment,
				pastLastPluginSegment,
				names = pluginNames(),
				reHasPlugin = new RegExp(names.join('|')),
				reHasFn = new RegExp(names.join(regExpPart + '|') + regExpPart,"g");

			var selectorTransform = function(match,i,str){
				var ret;
				//each unique one gets an index
				if(typeof mapper[match] === 'undefined'){
					mapper[match] = { index: mc++, args: match.match(/\((.*)\)/)[1] }; 
					reverse.push(match);
				}
				base = getBase(match.split("(")[0]);
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
								base = getBase(pluginsFound[x]);
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
		};
		
		// Returns an array of just the names of the plugins
		var pluginNames = function(){
			var ret = [], count = plugins.length;
			while(count--){ ret.push(plugins[count].name); };
			return ret;
		};
		
		// Returns the base for the named plugin
		var getBase = function(name){
			var count = plugins.length;
			while(count--){
				if(name === plugins[count].name){
					return plugins[count].base;
				}
			}
		};
		
		// Sets information about the browser used in Selector processing
		var setBrowserInfo = function(){
			// Populate browser object with current browser info
			if(document.body.mozMatchesSelector){ 			browser.vendor = "-moz-"; 		browser.matchesSelector = 'mozMatchesSelector'; }
			else if(document.body.webkitMatchesSelector){  	browser.vendor = "-webkit-"; 	browser.matchesSelector = 'webkitMatchesSelector'; }
			else if(document.body.oMatchesSelector){ 		browser.vendor = "-o-"; 		browser.matchesSelector = 'oMatchesSelector'; }
			else{ 											browser.vendor = "-ms-";  		browser.matchesSelector = 'msMatchesSelector'; }
			// now set ready to true so that processing can happen
			browser.ready = true; 
		};
		
		var loadStyleSheet = function(){
			var 
				// style we will use to add our transformed rules too
				style = document.createElement('style'), 
				// reference to the style as pulled from document
				sheet, 
				// memoized count of the rules
				rulesCount = rules.length,
				// Rule part of rules used in processing loop below
				intermediateRule,
				// array of known plugins?
				known = pluginNames();
			
			// add our style tag to the head
			document.getElementsByTagName('head')[0].appendChild(style);
			// retrieve our style tag back from styleSheets collection
			sheet = document.styleSheets[document.styleSheets.length -1];
			// add the browser vendor prefix to known (why?)
			known.push(browser.vendor);
			// turn known into a RegEx with pipe separated 'knowns'
			known = new RegExp(known.join('|'));
			
			console.log('Rules:',rules);
			
			while(rulesCount--){
				intermediateRule = rules[rulesCount].rule.split(',');
				var irc = intermediateRule.length;
				var finalRule = [];
				//TODO: Is this a necessary iteration? 
				while(irc--){
					if(/-[A-z\0...9]*/.test(intermediateRule[irc]) && known.test(intermediateRule[irc])){
						finalRule.push(intermediateRule[irc]);
					}
				}
				try{
					sheet.insertRule(finalRule.join(','), sheet.length-1);
				} catch(e) {
					console.log('Failed to insert rule: ' + finalRule.join(',') + ' Error: ' + e);
				}
			}
		};
		
		var checkDOM = function(t){
			var start = new Date().getTime(), 
				ancestralTree,
				el = t.target || t, 
				potential = [];
				
			if(t.type === 'DOMNodeRemoved'){
				// This event is before the removal, so we have to release control...
				setTimeout(function(){
					checkDOM({type: 'DOMNodeInserted', target: t.relatedNode, relatedNode: t.relatedNode});
				},1);
				return;
			}
					
			if(!subTreeSemaphor){
				perf = { checks: 0, queries: 0 };
				subTreeSemaphor = true;
				try{
					perf.queries++;
					// returns false if we can't target an upward search
					var maybeRules  = findPotentiallyRelevantRules(t);

					if(maybeRules){
						// we can do this and short-circuit return;
						var p = getFirstSegments(maybeRules);
						searchUpward(el,maybeRules);
						return;
					}

					// compile segment groups...
					groups = compileSegmentGroups();

					for(var i=0;i<potential.length;i++){
						// This allows us to detect class name changes
						potential[i]._oldclasses = potential[i].className;
					}

					tester(el, (t.type === 'DOMNodeInserted') ? grabAncestralTree(t.relatedNode,[el]) : false);

				} catch(exc) {
					console.log(exc.message);
				} finally {
					perf.duration = new Date().getTime() - start + "ms";
					console.log(JSON.stringify(perf));
					subTreeSemaphor = false;
				}
			}
		};
		
		var findPotentiallyRelevantRules = function(t){
			var wrap, 
				ret = [], 
				rule, 
				ruleCount = rules.length, 
				prefix = "", 
				suffix = "", 
				m = [], 
				x = [], 
				wrapped,
				wrappers = {
					'class': function(v){ return "." + v; },
					'id': function(v){ return "#" + v; },
					'attr': function(v){ return "[" + v + "]"; }
				};
			if(t.attrName){  // It's some kind of attribute
				wrap = (wrappers[t.attrName]) ? wrappers[t.attrName] : wrappers['attr'];
				while(ruleCount--){
					rule = rules[ruleCount];
					if(!rule.segments) continue;
					if(!rule.str){ rule.str = JSON.stringify(rule); }
					wrapped = wrap(t.newValue.trim());
					if(rule.str.indexOf(wrapped) !== -1 || (wrap === wrappers.attr && rule.str.indexOf(t.attrName) !== -1)){
						rule.index = i;
						var ttt = findSegments(rule,wrapped,t);
						if(ttt.a && m.indexOf(ttt.a) === -1){
							m.push(ttt.a);
						}
						rule.segments[ttt.b].rid = i;
						ret.push(rule.segments[ttt.b]);
					}
				}
			}else{
				// Something for tag names?
				return false;
			}
			return { scan: m.join(","), rules: ret };
		};
		
		var compileSegmentGroups = function(){
			var ret = [], group, rule, ruleCount = rules.length;
			while(ruleCount--){
				rule = rules[ruleCount];
				group = getSegmentsGroup(rule);
				if(ret.indexOf(group) === -1){
					ret.push(group);
				}
			}
			return ret;
		};
		
		// gets a comma seperated list of all segments in a filter (without compiled indexes)
		var getSegmentsGroup = function(r){
			var ret = [];
			if(!r.segmentsGroup){
				for(var i=0;i<r.segments.length;i++){
					if(r.segments[i].filter){
						ret.push(r.segments[i].selector.replace(/._\d/,''));
					}
				}
				r.segmentsGroup = ret.join(',').replace("\:-" + browser.vendor + "-any\(\)","");
			}				
			return r.segmentsGroup;
		};
		
		// This is the primary tester that says "apply this rule" or don't...  
		var tester = function(el,list,s){  
			var n,
				test,
				segments,
				x,
				tests,
				potential,
				t,
				ancestral = {},
				last;
				
			// We have to see if this matches any of the rules we care about....
			var indx = getSegIndex();
			
			for(var test in indx){
				potential = list;
				if(list){ // inserts
					potential = list.concat(Array.prototype.slice.call(el.querySelectorAll(test),0));
				}else if(el.querySelectorAll){
					potential = Array.prototype.slice.call(el.querySelectorAll(test),0);
				}
				for(var c=0;c<potential.length;c++){
					n = potential[c];
					t = {target: n};
					fs = indx[test].filters;
					for(var filterName in fs){
						tests = fs[filterName];
						for(var i=0;i<tests.length;i++){
							x = filters.map[filterName].fn(n,tests[i].args,{siblings: n.parentNode.children, location: normalizedUrl() });
							(x) ? addMangledClass(t,tests[i].rid) : removeMangledClass(t,tests[i].rid);
						}
					}
				}
			}
		};
		
		var getSegIndex = function(){
			var ret = [], segs, rule, segment, lastSeg = 0, sans, joint,
			//if(!segIndex){
				segIndex = {};
				for(var i=0;i<rules.length;i++){
					rule = rules[i];
					segs = [];
					for(var x=0;x<rule.segments.length;x++){
						segment = rule.segments[x];
						sans = segment.selector.replace(/\._\d/, "");
						
						segs.push(sans);
						if(segment.filter){
							//debugger;
							joint = segs.join(' ');
							if(!segIndex[joint]){
								segIndex[joint] = { filters: {} };
							}
							if(!segIndex[joint].filters[segment.filter]){
								segIndex[joint].filters[segment.filter] = [];
							}
							segIndex[joint].filters[segment.filter].push({rid: i, args: segment.filterargs});
						}
					}
				}
			//}
			return segIndex;
		};
		
		// When content is ready do the browser work 
		document.addEventListener('DOMContentLoaded', setBrowserInfo);
		
		return {
			
			// Adds a plugin to the collection 
			add: function(plugin){ 
				plugins.push(plugin); 
				console.log('Plugins:', plugins);
			},
			
			// Compiles CSS into rules useable by plugins
			compile: function(input){ 
				rules = rules.concat(compiler(input)); 
			},
			
			// Perform the application of rules to the DOM and execute plugins
			execute: function(){
				// if browser info is not set we can't go forward
				if(!browser.ready) return;
				// get our stylesheet setup with rules
				loadStyleSheet();
				// now check DOM for applying rules (check body since we want to 'start')
				checkDOM(document.body);
			},
			
			// A 'ready' function to be used for DOM loaded events
			onReady: function(){
				var styles = document.querySelectorAll('[data-css-plugins=true]');
				for(var i = 0; i < styles.length; i++){ 
					this.compile(styles[i].innerHTML); 
				}
				this.execute();
			}
		};
	})();
})();


document.addEventListener('DOMContentLoaded', function(){ cssPlugins.onReady(); });