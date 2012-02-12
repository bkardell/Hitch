var Hitch = (function(){
	
	var 
		// reference to document's head
		head = document.getElementsByTagName('head')[0],
        
		// prefix of the vendor (browser)
		vendor,
		
		// Vendor-specific match function name
		matches,
		
		// Vendor-specific match function
		matchesSelector = (function(){
			// based on the UA set vendor and matchesSelector function properly
			if(head.matchesSelector){ vendor = ""; matches = 'matchesSelector'; }
			else if(head.mozMatchesSelector){ vendor = "-moz-"; matches = 'mozMatchesSelector'; }
			else if(head.webkitMatchesSelector){  vendor = "-webkit-"; matches = 'webkitMatchesSelector'; }
			else if(head.oMatchesSelector){  vendor = "-o-"; matches = 'oMatchesSelector'; }
			else if(head.msMatchesSelector){ vendor = "-ms-";  matches = 'msMatchesSelector'; } 
			else{
				vendor = '-hitch-'; matches = 'hitchMatchesSelector';
				return function(e,sel){
					// slow, but sure... necessary for testing at least... IE8?  
					return Array.prototype.slice.call(
						document.getElementsByTagName('body')[0].querySelectorAll(sel),
						0
					).indexOf(e) !== -1;
				};
			}
			// if matchesSelector function is not defined base it on UA
			if(!matchesSelector){
				return function(e,s){ 
					return e[matches](s); 
				};
			}
        }()),
        
		// Whether we need to emulate for IE8 
		emulate = (typeof navigator !== 'undefined' && 
			navigator.appName == 'Microsoft Internet Explorer' && 
			navigator.userAgent.indexOf('MSIE 8') !== -1
		),
		// proxy for querySelectorAll
		query = function(el,q){ return el.querySelectorAll(q); },
		// converts NodeList to array
		toArray = function(nl){
			var ret,i;
			if(!emulate){
				return Array.prototype.slice.call(nl, 0);
			}else{
				ret = [];
				for(i=0;i<nl.length;i++){
					ret.push(nl[i]);
				}
				return ret;
			}
		},
		// performance data collector
		perf = { checks: 0, queries: 0 },

		// on document load events whether to call ready by default
		defaultInit = true,
		// segIndex is how we optimize 
		segIndex, 
		// Store the compiled rules...
		rules = [], 
		// basically this is "known plugin configurations"
		plugins = [],
		// the names of known hitches
		knownHitchNames = [],
		// hitch-defined constants 
		consts = [],
		// a ready fn... when things are ready to go, kicks things off
		ready, 
		// This will track data about rules that have aliases/hitches 
		rulesWeCareAbout = [], 
		// Rules we register as native -- a superset of rules we care about
		nativeRules = [], 
		// This will help prevent infinite recursion
		subtreesemaphor = false,
		// Determines whether to apply hitch index class on element(s)
		apply = function(name,potential,t,test,n){
				// Collects only which things really need init'ing 
			var requireInits, 
				// the hitch in question
				h = hitches.map[name];
			try{
				if(h.init){
					requireInits = [];
					for(var i=0;i<potential.length;i++){
						// filter down the potential ones as they are not guaranteed to match
						// we also add a :not(init'ed) pattern around them so that what we are 
						// collecting here are the ones that have not yet been init'ed ... 
						// Note that this really should let the selector do the work with :not, as:
						// matchFn(potential[i],test.base + ":not([" + test.name + "-inited])")
						// but this causes a problem with our current testing strategy which blows
						// up on this... The method will probably be considerably slower so we 
						// should eventually try to mitigate this and do the appropriate thing
						// optimizing to above :not where possible...
						if(
							matchesSelector(potential[i],h.base)  && 
							!matchesSelector(potential[i],"[" + h.name + "-inited]")
						){
							requireInits.push(potential[i]);
							potential[i].setAttribute(h.name + "-inited", "true");
						}
					}	
					// "if it fits you must init...." :)
					h.init(requireInits);
				}
				if(h.filter){
					x = h.filter(n,test.args,{siblings: n.parentNode.children, location: normalizedUrl() });
					if(x){ 
						Hitch.dom.addMangledClass(t,test.cid);
					}else{
						Hitch.dom.removeMangledClass(t,test.cid);
					}
				}
			}catch(e){
				console.log(e.message);
			}
		},
		// applies as they match the left part(s)
		searchUpward = function(el,q,last){
			var x, d, tmp, f, a;
			if(el.tagName !== 'BODY' && q.scan !== ''){
			for(var i in q.index){ // walk through each one in the index
					try{
						if(matchesSelector(el,i)){  // Do we match this one?
							for(f in q.index[i].hitches){	// walk through each hitch
								tmp = q.index[i].hitches[f];
								for(a=0;a<tmp.length;a++){
									apply(f,[el],el,tmp[a],el);	
								}
							}
						}
					}catch(e){
						console.log('whoops...' + e.message);
					}
					
				}
				last = el;			
				return searchUpward(el.parentNode,q,last);
			}
			return last;
		},
		// add the element and all of its parents to an array in depth order (like NodeList) 
		grabAncestralTree = function(e,coll){
			while(e.tagName !== 'BODY'){
				coll.push(e);
				e = e.parentNode;
			}
			return coll;
		},
		// tests all elements of a subtree with the tester (see below)...
		testSubtree = function(t,isInit){
			var // holds the parents up to root (if necessary)
				ancestralTree, 
				
				el = t.target || t, 
				
				// things we need to test based on what happened and where
				potential = [];
				
			// Arg... firebug... why do you cause DOM events so?
			if(el.parentNode === null){ return; /* firebug... */ }
			
			// This event is before the removal, so we have to release control...
			// Essentially we we do the same as saying that the parent of the thing removed
			// was inserted... This allows things like innerHTML to work appropriately without
			// causing nasty...
			if(t.type === 'DOMNodeRemoved'){
				setTimeout(function(){
					testSubtree({type: 'DOMNodeInserted', target: t.relatedNode, relatedNode: t.relatedNode},false);
				},1);
				return;
			}
					
			// Without this semaphor you would be so screwed :)
			if(!subtreesemaphor){
				subtreesemaphor = true;
				
				try{
					
					// .. as opposed to changes to the physical structure of the tree
					var maybeRules  = getMetadataChangedRules(t);
					
					// if there are any...
					if(maybeRules){
					
						// we can do this and short-circuit return -- really fast, not unlike native.
						el = searchUpward(el,maybeRules) || el;  
						return;
					}
					
					// if there aren't though... 
					
					// first, we collect 'old classes' real quick incase setting classname
					// in a particular browser doesn't cause an attribute change event...			
					// in those cases we can use this to 'shim'...
					for(var i=0;i<potential.length;i++){					
						potential[i]._oldclasses = potential[i].className;
					}	
					
					// if this is an insert we grab upwards as potential matches too just to
					// be safe... There are some cases of 'contain' or 'has' like behavior that 
					// might require you to look at the parent of where the event occurs...
					doTreeModificationTests(el,(t.type === 'DOMNodeInserted') ? grabAncestralTree(t.relatedNode,[el]) : false);

				}catch(exc){
					// uhoh!
					console.log('uh oh...' + exc.message);
				}finally{
					// gotta release the semaphor no matter what...
					subtreesemaphor = false;
				}
			}
		},
		// helper functions for applying CSS syntax to names
		wrappers = {
			'class': function(v){ return "." + v; },
			'id': function(v){ return "#" + v; },
			'attr': function(v){ return "[" + v + "]"; }
		},
		//TODO - this is weak... probably a better index for this should also be built by the native
		getMetadataChangedRules = function(t){
			var temp, wrap, filteredSet = {}, rule, prefix = "", suffix = "", m = [], x = [], wrapped;
			if(t.attrName){  // It's some kind of attribute
				wrap = (wrappers[t.attrName]) ? wrappers[t.attrName] : wrappers.attr;
				for(var r in segIndex){
					m.push(r);
					temp = r + JSON.stringify(segIndex[r]); //segIndex[r].orig;
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
		doTreeModificationTests = function(el,list,s){  
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
			for(test in segIndex){
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
						fs = segIndex[test].hitches;
						for(var name in fs){
							tests = fs[name];
							for(var i=0;i<tests.length;i++){
								if(matchesSelector(n,tests[i].base)){ 
									apply(name,potential,t,tests[i],n);
								}
							}
						}
					}
				}catch(e){
					// console.log("invalid rule selector... " + e.message);
					// one invalid rule doesnt spoil the bunch... Example:
					// :not(.x,.y) will be valid someday, but it throws now... 
				}
			}
		},
		
		// helper function to drop the file.ext and return just the URL
		normalizedUrl = function() {
			var location = window.location.href.split("?")[0].split("/");
			location.pop();
			return location.join('/');
		},
		
		hitches = {
			// known hitches
			map: {},

			/* Simulate the parser so we can figure this shit out... */
			parse: function(){
				var m = {rules: [], segIndex: {}, plugins: []};
				for(var i=0;i<rules.length;i++){
					m.rules = m.rules.concat(rules[i].rules);
					for(var n in rules[i].segIndex){
						m.segIndex[n] = rules[i].segIndex[n];
					}
					m.plugins = m.plugins.concat(rules[i].plugins);
				}
				return m;
			},

			init: function(){
				var bod = document.getElementsByTagName('body')[0],
					buff = []; 
					
				if(nativeRules){
					for(i=0;i<nativeRules.length;i++){
						buff.push(nativeRules[i]);
					}
					Hitch.dom.styleTag(buff.join("\n\n"),head);
				}
				
				testSubtree(bod,Hitch.matchesSelector);

				if(bod.addEventListener){ // IE8 grafts attribute modification... what about tree mod?
					bod.addEventListener('DOMAttrModified',testSubtree);
					bod.addEventListener('DOMNodeInserted',testSubtree);
					bod.addEventListener('DOMNodeRemoved',testSubtree);
					document.addEventListener('DOMSubtreeModified',function(t){
						var targ = t.target;
						if(!targ._isSetting && targ._oldclasses !== targ.className){
							targ._isSetting = true;
							targ.setAttribute('class',targ.className);
							targ._oldclasses = targ.className;
							targ._isSetting = false;
						}
					});
				}
			},
			
			register: function(o){
				var x = o;
				if(!o.length){ x = [o]; }
				for(var i=0;i<x.length;i++){
					var h = x[i];
					if(h.filter || h.init){
						hitches.map[":" + h.name] = h;
					}
				}
			}
		};
		
	// If it's webkit or IE - we have to shim the ability to watch attribute mods....
	if((document.head && document.head.webkitMatchesSelector) || emulate){
		Element.prototype._setAttribute = Element.prototype.setAttribute;
		Element.prototype.setAttribute = function(name, val) { 
			var e, prev, temp;
			prev = this.getAttribute(name); 
			this._setAttribute(name,val);
			testSubtree({
					"target": this, 
					"prevValue": prev, 
					"attrName": name, 
					"newValue": val
			});
		};
	}

	

	// Go!
	ready = function(){
		var compiledForm;
		if(plugins){ // how could this be null/undefined?!
			hitches.register(plugins);
			compiledForm = hitches.parse(); 
			nativeRules = compiledForm.rules;  
			segIndex = compiledForm.segIndex;
			hitches.init();
		}
	};
		
	//TODO: Refactor this to land in /lib/events.js 
	try{
		document.addEventListener( "DOMContentLoaded", function(){
			if(defaultInit){
				ready();
			}
		}, false );
	}catch(e){
		document.onload = function(){
			if(defaultInit){
				ready();
			}
		};
	}
	
	return { 
		useManualInit: function(){ defaultInit = false; },
		
		init: function(){ ready(); },
		
		addCompiledRules: function(rDescs){
			rules = rules.concat(rDescs);
			return this;
		},
		
		add: function(h){
		    var i, descs = (h.length) ? h : [h], hitchDesc;
		    for(i=0;i<descs.length;i++){
				hitchDesc = descs[i];
				if(hitchDesc['const']){
					consts.push(hitchDesc['const']);
				}
				if(hitchDesc.name){
					plugins.push(hitchDesc);
					knownHitchNames.push(hitchDesc.name);
				}
				if(hitchDesc.init && hitchDesc.type && hitchDesc.type === 'html'){
					Hitch.dom.styleTag(":" + hitchDesc.name + "(){}",true);
				}
			}
		},
		
		list: function(){
			return knownHitchNames;
		},
		
		getBase: function(p){
			for(var i=0;i<plugins.length;i++){
				if(p===plugins[i].name){
					return plugins[i].base;
				}	
			}
		},
		
		getSegIndex: function(){ return segIndex; },
		
		getRules: function(){ return rules; },
		
		getHitches: function(){ return plugins; }, 
		
		getConsts: function(){ return consts; },

		matchesSelector: matchesSelector,

		vendor: vendor
	};
}());

if(typeof module !== 'undefined' && module.exports){
	module.exports.Hitch = Hitch;
}
