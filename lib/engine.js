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
					return toArray(e.parentNode.querySelectorAll(sel)).indexOf(e) !== -1;
				};
			}
			// if matchesSelector function is not defined base it on UA
			if(!matchesSelector){
				return function(e,s){ 
					if(e[matches]) return e[matches](s); 
				};
			}
		}()),
        
		// Whether we need to emulate for IE8 
		emulate = (typeof navigator !== 'undefined' && 
			navigator.appName == 'Microsoft Internet Explorer' && 
			navigator.userAgent.indexOf('MSIE 8') !== -1
		),
		// proxy for querySelectorAll
		query = function(el,q){// if(typeof HITCH_TESTS !== "undefined"){ /* ack this sucks! */ q = q.replace(/:not(.*)/,''); } 
			var ret = [];
			try{
				ret =  el.querySelectorAll(q);
				return ret;
			}catch(e){ // some (shitty) browsers don't support :not() yet...
				var  i=0, x, nots = [], rew, rst, isMatch;
				rew = q.replace(/\:not\([^\)]+\)/g, function(a,b,c){
					nots.push(a.substring(a.indexOf(":not(") + 5, a.lastIndexOf(")")));
					i = b + a.length;
					return "";
				});
				rst = toArray(el.querySelectorAll(rew)) || [];
				for(i=rst.length-1;i>=0;i--){
					isMatch = true;
					for(x=0;x<nots.length;x++){
						if(!matchesSelector(rst[i],nots[x])){isMatch=false;}
					}
					if(!isMatch){
						ret.push(rst[i]);
					}
				}
				return ret;
            }	
		},
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
		// segIndex is how we optimize 
		segIndex = {}, 
		// Store the compiled rules...
		rules = [], 
		// basically this is "known plugin configurations"
		plugins = [],
		// the names of known hitches
		knownHitchNames = [],
		// hitch-defined constants 
		consts = [],
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
							// For selector hitches, we still have to keep track of inits with valid
							// attributes, so we'll prefix 'x' to the already css dashed name
							// and this will be saved so next time through !matches above won't.
							if(h.name.charAt(0) === '-'){
								h.name = "x" + h.name;
							}
							potential[i].setAttribute(h.name + "-inited", "true");
							requireInits.push(potential[i]);
						}
					}	
					// "if it fits you must init...." :)
					h.init(requireInits);
				}
				if(h.filter){
					x = h.filter(n,test.args,{siblings: n.parentNode.children, location: normalizedUrl() });
					if(x){ 
						Hitch.dom.addMangledClass(t,test.classId);
					}else{
						Hitch.dom.removeMangledClass(t,test.classId);
					}
				}
			}catch(e){
				//console.log(e.message);
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
							//console.log('whoops...' + e.message);
						}
						
				}
				last = el;			
				return searchUpward(el.parentNode,q,last);
			}
			return last;
		},
		// add the element and all of its parents to an array in depth order (like NodeList) 
		grabAncestralTree = function(e,coll){
			while(e && e.tagName !== 'BODY'){
				coll.push(e);
				e = e.parentNode;
			}
			return coll;
		},

		modsQueue = [],
		modsAttrOnly = true,
		addMod = function(t){
			if(!t.attrName || !/^src$|^style$/.test(t.attrName)){
				modsQueue.push(t);
				//console.log("a?" + modsAttrOnly + ":" + t.target + "::" + t.type);
				modsAttrOnly = modsAttrOnly && t.target && (t.type === "DOMAttrModified");
				//console.log("b?" + modsAttrOnly + ":" + t.target + "::" + t.type);
				throttleRetest(t); // he can pass along
			}
		},

				getCommonAncestor = function(nodes) {
			var i,
				node1 = nodes[0].target || nodes[0], 
				method = "compareDocumentPosition" in node1 ? "compareDocumentPosition" : "contains",
				test   = method === "contains" ? 1 : 0x0010, 
				iNode;
		
			checking:
			while ((node1 = node1.parentNode)) {
				i = nodes.length;   
				while (i--) {
					iNode = nodes[i].target || nodes[i];
					if(!iNode.tagName){ return document.getElementsByTagName('body')[0]; }
					if(node1[method]){
						if((node1[method](nodes[i].target || nodes[i]) & test) !== test){
							continue checking;   
						}
					}
				}
				return node1;
			}
		
			return document.getElementsByTagName('BODY')[0];
		},
		throttleId = null, 
		throttleDuration  = 100, 
		throttleRetest = function(optionalT){
			if(throttleId){
				clearTimeout(throttleId);
			}
			throttleId = setTimeout(function(){
				var el, mods = modsAttrOnly, evt = optionalT;
				
				if(modsQueue.length>1 || !(optionalT || {}).attrName){
					el = getCommonAncestor(modsQueue);
					if(el.tagName==='HTML'){ el = document.getElementsByTagName('BODY')[0]; }
					evt = {type: 'DOMNodeInserted', target: el, relatedNode: el};
				}
				// reset the queue...
				modsQueue = [];
				modsAttrOnly = true;

				// Insert is the most complete (and expensive), but we only have to do it
				// once this way... It would be nice if we knew, for example, that it was a "cheap"
				// operation so we could avoid the scan for CSS that inevitably follows in testSubtree
				// which is way too expensive for things that don't mod the tree
				
				// The problem with this is that when just a single change happens, 
				// we dont have the new/previous value, so attr mods dont optimize...
				//if(!mods){
				//	t = {type: 'DOMNodeInserted', target: el, relatedNode: el};
				//}
				testSubtree(evt);
	
	
			}, throttleDuration);
		},
		// runs tests through the pipe...
		testSubtree = function(t){
			var targ = (t.target) ? t : { target: (t || document.getElementsByTagName('body')[0]), type: 'DOMNodeInserted'};
			if(targ.type !== 'DOMAttrModified'){
				scanSubtree(targ,function(){
					ready(function(){
						realTest(targ);
					});
				});
			}else{
				realTest(targ);
			}
		},
		// tests all elements of a subtree with the tester (see below)...
		realTest = function(t){
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
					testSubtree({type: 'DOMNodeInserted', target: t.relatedNode, relatedNode: t.relatedNode});
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
						//console.log("short tests...");
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
					//console.log("long tests...");
					doTreeModificationTests(el,(t.type === 'DOMNodeInserted') ? grabAncestralTree(t.relatedNode,[el]) : false);

				}catch(exc){
					// uhoh!
					//console.log('uh oh...' + exc.message);
				}finally{
					// gotta release the semaphor no matter what...
					subtreesemaphor = false;
					
					// If the queue isn't empty, we have to go again...
					if(modsQueue.length > 0){
						
						// Add a very small throttle to retest since it is often
						// caused by script tag insertions which can cause multiple
						// calls back here - we may get lucky and cut some...
						throttleRetest();
					}
				}
			}else{
				// We still have to handle these, but we want to make sure 
				// we collect as many changes as possible in one batch...
				// html hitches may change the tree during processing
				modsQueue.push(el);
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
					// This is re-stringifying unnecessarily - could be done once on creating the segindex...right?
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
				last,
				q;
				
				
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
								// TODO... can we just precompile this?  It was shortsighted to not have this already...
								if(matchesSelector(n,test + tests[i].base.replace(/\*$/,''))){ 
									apply(name,potential,t,tests[i],n);
								}
							}
						}
					}
				}catch(e){
					// console.log("invalid rule selector... " + e.message);
					// one invalid rule doesnt spoil the bunch... Example:
					// :not(.x,.y) will be valid someday, but it throws now... 
					// this has proven useful in debugging cross-browser capabilities...
				}
			}
		},
		
		// helper function to drop the file.ext and return just the URL
		normalizedUrl = function() {
			var location = window.location.href.split("?")[0].split("/");
			location.pop();
			return location.join('/');
		},
		wired = false,
		hitches = {
			// known hitches
			map: {},

			/* Simulate the parser so we can figure this shit out... */
			parse: function(){
				return {rules: rules, segIndex: segIndex, plugins: plugins};
			},
			wire: function(){
				var applyStateRules, delegateStateRules, stateRulesThrottle;
				
				applyStateRules = function(hitchName,segName,seg,origElement,toggleType,type){

					// We will save the really hard work from being repeated like mad if they are
					// changing...
					if(toggleType === 'out' && stateRulesThrottle){ clearTimeout(stateRulesThrottle); }
				
					stateRulesThrottle =  setTimeout(function(){
						var selector, x, potentialMatches, matchesToggle = (toggleType==='out') ? seg.args.replace(":" + type, "") : seg.args;

						selector = matchesToggle.split(",").map(function(x){ return x + "," + x + " *"; }).join(',');
						selector = selector.replace(/,$/,"");

						// it should match 'in' and the selector or 'out' and the selector sans ':hover'
						//console.log(origElement + "---" + selector);
						if(matchesSelector(origElement,selector)){
							potentialMatches = document.querySelectorAll(segName);

							// matchingThings, test, name
							for(x=0;x<potentialMatches.length;x++){
								subtreesemaphor = true; 
								Hitch.apply(hitchName,[],potentialMatches[x],seg,potentialMatches[x]);
							}
						}
					},50);
				};
				// All rules involving a potential state reference within a hitch enter 
				// here... The goal is for segIndex to efficiently:
				//   -  Tell us immediately if it is the case that there are no rules 
				//      like this so we can bail.
				//   -  If there are rules like this
				//      -  whip through them and grab the ones pertaining to the state in 
				//      -  question...
				// 
				//         
				delegateStateRules = function(e,toggleType,type){
					var segName,seg, potentialSegs, potentialMatches, i, x; 
					for(segName in segIndex){
						seg = segIndex[segName];

						try{
							if(seg.hitchState[type].length>0){
								for(x=0;x<seg.hitchState[type].length;x++){
									potentialSegs = seg.hitches[seg.hitchState[type][x].hitch];
									// everything from here up in fn really should be precomputed and updated when segIndex is....
									for(i=0;i<potentialSegs.length;i++){
										applyStateRules(seg.hitchState[type][x].hitch, segName, potentialSegs[i],e.target,toggleType,type);
									}	
								}
							}
						}catch(ex){
							// debugger;
						}
							
					}
				};
				document[Hitch.events.getAttacherFnName()]('mouseover',function(e){delegateStateRules(e,"in","hover");});
				document[Hitch.events.getAttacherFnName()]('mouseout',function(e){delegateStateRules(e,"out","hover");});
				document[Hitch.events.getAttacherFnName()]('focus',function(e){delegateStateRules(e,"in","focus");},true);
				document[Hitch.events.getAttacherFnName()]('blur',function(e){delegateStateRules(e,"out","focus");},true);

				if(document.addEventListener){ // IE8 grafts attribute modification... what about tree mod?
					var bod = document.getElementsByTagName('body')[0];
					if(!bod){
						// is it possible just short-circuit this till there is a body?
						wired = false;
						return;
					}
					bod.addEventListener('DOMAttrModified',addMod);
					bod.addEventListener('DOMNodeInserted',addMod);
					bod.addEventListener('DOMNodeRemoved',addMod);
					bod.addEventListener('DOMSubtreeModified',function(t){
						var targ = t.target;
						if(!targ._isSetting && targ._oldclasses !== targ.className){
							targ._isSetting = true;
							targ.setAttribute('class',targ.className);
							targ._oldclasses = targ.className;
							targ._isSetting = false;
						}
					});
				}

				wired = true; 
			},
			init: function(){ /* Legacy... TODO: remove this once we are sure... */ },
			
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
		},



		scanForWidgets = function(root,complete){
			var resources,
				i,
				requires = [],
				url, 
				r;

			try{
				resources = query(root || document,'[data-hitch-widget]');
				for(i=0;i<resources.length;i++){

					r = resources[i];
					url = r.getAttribute('data-hitch-widget');
					if(url.indexOf('package:')===0){
						requires.push({uri: "http://www.hitchjs.com/use/" + url.substring(8) + ".js"});
					}else{
						requires.push({uri: url});
					}
				}
				Hitch.resource.load(requires,null,'script',null,complete);
			}catch(e){
				//console.log('scanning widgets....' + e);
			}
		},

		scanCSS = function(root, complete){
			var loads = [], 
				cache, 
				href,
				url, 
				r;
				
			try{
				// :not falls apart in tests..
				resources = query((root||document),'[data-hitch-interpret]:not([data-hitch-parsed])');

				for(i=0;i<resources.length;i++){
					if(resources[i].tagName === 'STYLE'){
						loads.push({"inline": resources[i].innerHTML, ref:resources[i]});
					}else{
						href = resources[i].getAttribute('href');
						loads.push({uri: href, ref:resources[i]});
					}
					if(!resources[i].getAttribute("data-hitch-parsed")){
						resources[i].setAttribute('data-hitch-parsed',true);
					}
				}
				Hitch.resource.load(loads,Hitch.addCompiledRules,'css',null,complete);
			}catch(e){
				//console.log('scanning CSS ...' + e);
			}
		},

		scanSubtree = function(root,cb){
			var el = root.target || root;
			scanForWidgets(el,function(){
				scanCSS(el, function(){ cb.apply({},arguments); });
			});
		},

		// Go!
		ready = function(cb){
			var compiledForm;
			window.addMod = addMod;
			if(!wired){ wired = true; hitches.wire(); }
			if(plugins){ // how could this be null/undefined?!
				hitches.register(plugins);
				compiledForm = hitches.parse(); 
				nativeRules = compiledForm.rules;  
				segIndex = compiledForm.segIndex;
				if(typeof cb === "function")cb.apply({},arguments);
			}
		};

	// If it's webkit or IE - we have to shim the ability to watch attribute mods....
	if((document.head && document.head.webkitMatchesSelector) || emulate){
		Element.prototype._setAttribute = Element.prototype.setAttribute;
		Element.prototype.setAttribute = function(name, val) { 
			var e, prev, temp;
			prev = this.getAttribute(name); 
			try{
				this._setAttribute(name,val);
			}catch(ex){
				// This causes us some nightmare in IE right now...
			}
			addMod({
					"target": this, 
					"prevValue": prev, 
					"attrName": name, 
					"newValue": val
			});
		};
	}

	if(![].indexOf){
		Array.prototype.indexOf = function(obj, start) {
			for (var i = (start || 0), j = this.length; i < j; i++) {
				if (this[i] === obj) { return i; }
			}
			return -1;
		};
	}
	
	return { 

		init: ready,

		addCompiledRules: function(rDescs){
			Hitch.dom.styleTag(rDescs.rules.join("\n\n"),false,(/LINK|STYLE/.test(rDescs.originNode.tagName)) ? rDescs.originNode : null);
				
			rules = rules.concat(rDescs);
			for(var n in rDescs.segIndex){
				segIndex[n] = rDescs.segIndex[n];
			}
			plugins = plugins.concat(rDescs.plugins);
			return this;
		},

		add: function(h){
			var i, descs = (h.length) ? h : [h], hitchDesc, loads = [];
			for(i=0;i<descs.length;i++){
				hitchDesc = descs[i];

				if(!hitchDesc.name){
					throw "Must have a name!";
				}
				
				if(hitchDesc['const']){
					consts.push(hitchDesc['const']);
				}
				if(hitchDesc.name){
					plugins.push(hitchDesc);
					knownHitchNames.push(hitchDesc.name);
				}
				if(hitchDesc.init && hitchDesc.type && hitchDesc.type === 'html'){
					loads.push({"inline": ":" + hitchDesc.name + "(){}", ref: head.childNodes[head.childNodes.length-1]});
				}
			}
			// Once here, we have it all - right?
			if(Hitch.resource){
				Hitch.resource.load(loads,Hitch.addCompiledRules,'css',null,ready);
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

		apply: apply, 

		query: query,

		getSegIndex: function(){ return segIndex; },

		getRules: function(){ return rules; },

		getHitches: function(){ return plugins; }, 

		getConsts: function(){ return consts; },

		matchesSelector: matchesSelector,

		vendor: vendor, 

		scanCSS: scanCSS, 
		
		scanForWidgets: scanForWidgets,
		
		scan: scanSubtree
	};
}());



if(typeof module !== 'undefined' && module.exports){
	module.exports.Hitch = Hitch;
}
