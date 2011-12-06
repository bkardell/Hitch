var cssPlugins = (function(){

	// If it's webkit - we have to shim this....
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
	
    var perf = { checks: 0, queries: 0 };

    var	vendor,

		// on document load events whether to call ready by default
		defaultInit = true,
		
		// segIndex is how we optimize 
		segIndex, 
		
		// Store the compiled rules...
		compiled_cssplugin_rules = [], 
		
		// basically this is "known plugin configurations"
		cssplugin_selectors = [],
		
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
				if(el.matchesSelector(q.scan)){ // quick out if we match none
					for(var i in q.index){ 		// walk through each one in the index
						if(el.matchesSelector(i)){  // Do we match this one?
							for(f in q.index[i].filters){	// walk through each filter
								tmp = q.index[i].filters[f];
								for(a=0;a<tmp.length;a++){
									x = filters.map[f].fn(el,tmp[a].args,{siblings: el.parentNode.children, location: normalizedUrl() })
									d = tmp[a].cid; 
									(x) ? addMangledClass(el,d) : removeMangledClass(el,d);			
								}
							}
						}
						
					}
					last = el;
				}
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
					debugger;
					console.log(exc.message);
				}finally{
					perf.duration = new Date().getTime() - start + "ms";
					console.log(JSON.stringify(perf));
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
				potential = list;
				if(list){ // inserts
					potential = list.concat(Array.prototype.slice.call(el.querySelectorAll(test),0));
				}else if(el.querySelectorAll){
					potential = Array.prototype.slice.call(el.querySelectorAll(test),0);
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
				var ss, known, temp, real, ns = document.createElement('style'), vendors = "-moz-|-ms-|-webkit-|-o-";
				document.getElementsByTagName('head')[0].appendChild(ns);
				ss = document.styleSheets[document.styleSheets.length-1];
				if(nativeRules){
					for(i=0;i<nativeRules.length;i++){
						ss.insertRule(nativeRules[i],ss.length-1);
					}
				}
				testSubtree(document.body,document.head.webkitMatchesSelector);
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
		
			if(document.body.mozMatchesSelector){ vendor = "-moz-"; matches = 'mozMatchesSelector'; }
			else if(document.body.webkitMatchesSelector){  vendor = "-webkit-"; matches = 'webkitMatchesSelector'; }
			else if(document.body.oMatchesSelector){  vendor = "-o-"; matches = 'oMatchesSelector'; }
			else{ vendor = "-ms-";  matches = 'msMatchesSelector'; } 
			if(!document.head.matchesSelector){
				Element.prototype.matchesSelector = function(s){ 
					return this[matches](s); 
				}
			}
			compiledForm = filters.parseFilters()[0]; // do we need more than 1?
			nativeRules = compiledForm.rules;  
			segIndex = compiledForm.segIndex;
			filters.init();
		};
	};
		
	//TODO: All browsers cool with addEventListener?
	document.addEventListener( "DOMContentLoaded", function(){
		if(defaultInit){
			ready();
		};
	}, false );
		
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
			var ret=[], s = cssplugin_selectors.length-1;
			while(s){ ret.push(cssplugin_selectors[s].name); s--; }
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
}