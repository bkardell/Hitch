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
					return toArray(document.querySelectorAll(sel)).indexOf(e) !== -1;
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

(function(hitch){
	
	var head = document.getElementsByTagName('head')[0], addClass, removeClass, parseClasses;
	parseClasses = function(e){ var list = (e.className || "").split(/\s+/); return (list.length) ? list : []; };
		
	if(head.classList){
		addClass = function(e,cls){ if(!containsClass(e,cls)){ e.classList.add(cls); } }; 
		removeClass = function(e,cls){ if(containsClass(e,cls)){ e.classList.remove(cls); } };
		containsClass = function(e,cls){ return e.classList.contains(cls); }; 
	}else{
		addClass = function(e,cls){ 
			var list = parseClasses(e);
			if(list.indexOf(cls) === -1){
				list.push(cls);
				(e.target || e).className = list.join(" ");
			}
		};
		removeClass = function(e,cls){
			var list = parseClasses(e);
			var foundIndex = list.indexOf(cls);
			if(foundIndex !== -1){
				list.splice(foundIndex,1);
				(e.target || e).className = list.join(" ");
			}
		};
	}

	hitch.dom = {	
		
		addMangledClass: function(t,i){
			var e = (t instanceof NodeList) ? t : [t], list, foundIndex;
			for(var x=0;x<e.length;x++){
				addClass((e[x].target || e[x]),"_" + i);
			}
		}, 
		
		removeMangledClass: function(t,i){
			var e = (t instanceof NodeList) ? t : [t], list;
			for(var x=0;x<e.length;x++){
				removeClass((e[x].target || e[x]),"_" + i);
			}
		},

		scriptTag: function (src, callback) {
			var s = document.createElement('script'), to;
			setTimeout(function(){
				s.type = 'text/' + (src.type || 'javascript');
				s.src = src.src || src;
				s.async = false;

				s.onload = function(){
					if(to){ clearTimeout(to); }
					s.done = true;
					callback();
				};

				s.onreadystatechange = function() {
					var state = s.readyState;
					if(to){ clearTimeout(to); }
					// console.log("state::" + state);
					if (!state || /loaded|complete/.test(state)) {
						// !state is an error case like 404...
						to = setTimeout(function(){
							if(!s.done){
								s.done = true;
								// console.log('calling callback' + state);
								callback();
							}
						},50);
					}
				};
				(document.head || document.getElementsByTagName('head')[0]).appendChild(s);
			},1);
		},

		styleTag: function(text,interp,toReplace){
			var ns = document.createElement('style');
			// TODO: Do we really need to set this at all?
			if(interp){ ns.setAttribute('x-hitch-interpret',true); }
			
			if(toReplace && toReplace.parentNode){
				try{
					ns.innerHTML = text;
					toReplace.parentNode.replaceChild(ns,toReplace);	
				}catch(e){
					toReplace.parentNode.replaceChild(ns,toReplace);
					for (var i=0,el=toReplace;el; ++i){ el = el.previousSibling; }
					document.styleSheets[i].cssText = text;
				}
			}else{
				try{
					head.appendChild(ns);
					ns.innerHTML = text;
					head.appendChild(ns);
				}catch(e){
					head.appendChild(ns);
					document.styleSheets[document.styleSheets.length-1].cssText = text;
				}
			}
		}
	};

})(Hitch);

(function(hitch){
        var hid = 1;
		hitch.add([{ 
			/* OR emulated "super" any/matches - allows full complex selectors in match */ 
			name: "-hitch-anyof",
			base: '',
			filter: function(match, argsString){
				return hitch.matchesSelector(match, argsString);
			}
		},
		{ 
			/* NOR emulated "super" not - allows full complex selectors in match */ 
			name: "-hitch-noneof",
			base: '',
			filter: function(match, argsString){
				return ! hitch.matchesSelector(match, argsString);
			}
		},
		{ 
			/* XOR - allows full complex selectors in match */ 
			name: "-hitch-oneof",
			base: '',
			filter: function(match, argsString){
				var i, ct = 0, pts = argsString.split(",");
				for(i=0;i<pts.length;i++){
					if(hitch.matchesSelector(match, pts[i])){
						ct++;
						if(ct > 1){  return false; }
					}
				}
				return ct === 1;
			}
		},
		{ 
			/* AND - allows full complex selectors in match */ 
			name: "-hitch-allof",
			base: '',
			filter: function(match, argsString){
				var i, pts = argsString.split(",");
				for(i=0;i<pts.length;i++){
					if(!hitch.matchesSelector(match, pts[i])){
						return false;
					}
				}
				return true;
			}
		},
		{ 
			/* emulated "has" allows full complex selectors in match */ 
			name: "-hitch-has",
			base: '',
			filter: function(match, argsString){
				var first = argsString.charAt(0);
                /* 
                if the first char is a combinator, the match itself is implied... 
                While this works in selectors API level 2 with :scope, 
                in CSS :scope means something slightly different... therefore when it is  
                'implied' we mark it with a x-hitch-id attribute and 
                rewrite the selector that we use.
                */
				if(first === '>' || first === '~'){
					if(!match.getAttribute('x-hitch-id')){  
						match.setAttribute('x-hitch-id', hid++);
					}
					argsString = '#' + match.getAttribute('x-hitch-id') + " " + argsString;
				}
				return match.querySelector(argsString) !== null;
			}
		},
		{
			/* 
				vendor-driven const allows for experimental 'unprefixing' for impls 'almost' there
				in terms of universal implementation/api... play with it early, use it wisely, 
				provide feedback about minor incompatibility and _know_ that it is experimental.
			*/
			name: "-hitch-beta-const",
			base: '',
			"const": {name: "-hitch-beta-", replaceWith: hitch.vendor}
		}]);

})(Hitch);

/*
	Hitch Resource Manager
	Helper methods to download and process filters/rules.
*/
(function(hitch){

	var 
		// placeholder for resources to load
		loaded = {},
		// HTTP object for ajax requests (helper method)
		getHTTPObject = function() {
			var http = false;
			if (window.XMLHttpRequest) {
				try { http = new XMLHttpRequest();}
				catch (ex) {http = false;}
			}else if(typeof ActiveXObject != 'undefined') {
				try {http = new ActiveXObject("Msxml2.XMLHTTP");}
				catch (e) {
					try {http = new ActiveXObject("Microsoft.XMLHTTP");}
					catch (E) {http = false;}
				}
			} 
			return http;
		},
		enclose = function(a){
			return a;
		};
	

	hitch.resource =  {
		load : function(resources, callback, type, errCallback, allDone) {
			var 
				// http object to make ajax requests for links
				http = getHTTPObject(),
				// loop counter
				i,
				uri,
				// obj in iteration
				resource,
				// semaphore for resources to load
				open = resources.length,
				// intermediate callback to receive compiler callback
				checkDone = function(rules){
					try{ callback(rules); } catch(e) {}
					loadDone.apply({},arguments);
				},
				// handler for when resources are loaded
				changeHandler = function (originNode) {
					var result = '';
					if (http.readyState == 4) {
						if(http.status == 200) {
							if(http.responseText) result = http.responseText;
							HitchCompiler(result, checkDone, originNode);
						} else {
							loadDone.apply({},arguments);
						}
					}
				},
				// called when load process done and runs callback for caller
				loadDone = function(){
					open--;
					if(open === 0) allDone.apply({},arguments);
				};
			
			// if we have no resources to load - finish
			if(!resources || resources.length === 0){ allDone.apply({},arguments); return; }

			if(type === 'script'){
				for(i=0;i<resources.length;i++){
					resource = resources[i].uri.split("#")[0];
					if(!loaded[resource]){ 
						loaded[resource] = true; 
						Hitch.dom.scriptTag(resource,loadDone);
					}else{
						loadDone();
					}
				} 
			}else{
				var makeChangeHandler = function(resource){
					return function(){ changeHandler(resource.ref); };
				};
				for(i=0;i<resources.length;i++){
					if(resources[i].inline){
						HitchCompiler(resources[i].inline, checkDone, enclose(resources[i].ref));
					}else{
						resource = resources[i];
						uri = resource.uri.split("#")[0]; 
						if(!loaded[uri]){ 
							loaded[uri] = true; 
							if(!http){
								loadDone();
								continue;
							}
							//TODO: Do we really want to cache-bust all the time?
							http.open("GET", uri + "?", true);
							http.onreadystatechange = makeChangeHandler(resource);
							http.send(null);
						}else{
							loadDone();
						}
					}
				}
			}
		}
	};

})(Hitch);

/*
	Hitch Events Manager
	Small setup for building a "ready" event system for hitches
*/
(function(hitch){
	
	var 
		conf = { 
			o:{ s: window, a: 'addEventListener', e: 'DOMContentLoaded', r: 'removeEventListener' },
			n:{ s: document, a: 'attachEvent',e: 'onreadystatechange',r: 'detachEvent'}
		},
		callbacks = null,
		done = false,
		o = (document.addEventListener) ? conf.o : conf.n;

	hitch.events = {
		getAttacherFnName: function(){
			return o.a;
		},

		addLoadListener: function(func){
			o.s[o.a](o.e, func, false);
			o.s[o.a]('load', func, false);
		},

		removeLoadListener: function(func){
			o.s[o.r](o.e, func, false);
			o.s[o.r]('load', func, false);
		},

		DOMHitchReady: function(){
			done = true;
			hitch.events.removeLoadListener(hitch.events.DOMHitchReady);
			if (!callbacks) return;
			for (var i = 0; i < callbacks.length; i++){
				callbacks[i]();
			}
			callbacks = null;
		},

		ready: function(func){
			if (done){
				func();
				return;
			}
			if (!callbacks){
				callbacks = [];
				hitch.events.addLoadListener(hitch.events.DOMHitchReady);
			}
			callbacks.push(func);
		}

	};

})(Hitch);

var HitchCompiler = (function(){	
	var mapper = {},
		// index counter for mapped rules - see transformToNative
		mapperCount = 0;

	return function(src, finished, originNode){
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
			// collection of require statements
			requires = [],
			// collection of JS source files requested for plugins
			pluginSources = [],
			// collection of constants defined
			constants = [],
			invokeFinished = function(outModel){
				outModel.originNode = originNode;
				finished(outModel);
			};
				
		if(!String.prototype.trim) {  
			String.prototype.trim = function () {  
				return this.replace(/^\s+|\s+$/g,'');  
			};  
		}  
		
		// The segIndex is basically how we make quick sense of 
		// things efficiently when rules are applied
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
					sans = segment.selector.replace(/\._\d*/, "").replace(":not()","");
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
						if(!segIndex[joint].hitchState){
							segIndex[joint].hitchState = {hover:[],focus:[]};
						}
						if(/\:hover/.test(segment.filterargs)){
							segIndex[joint].hitchState.hover.push({hitch:segment.filter});
						}
						if(/\:focus/.test(segment.filterargs)){
							segIndex[joint].hitchState.focus.push({hitch:segment.filter});
						}
						segIndex[joint].hitches[segment.filter].push({
							segmentId: x, 
							ruleId: i, 
							classId: segment.classId, 
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
			return (fn) ? Hitch.vendor + "-any"  : '-hitch-any';
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
				// yuck... if there is a mismatched paren or bracket we need to fix it...
				if((temp[i] + "(").match(/\(/g).length < (temp[i] + ")").match(/\)/g).length){
					unGrouped[unGrouped.length-1] = unGrouped[unGrouped.length-1] + "," + temp[i]; 
				}else if((temp[i] + "[").match(/\[/g).length < (temp[i] + "]").match(/\]/g).length){
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
					"classId": mapper[m].index, 
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
				return nativeSelector.replace(any+"(*)","");
			});
			
			// Ick... you can arrive here with mismatched extra parens at the end..
			if( (temp.match(/\(/g) || []).length !== (temp.match(/\)/g) || []).length ){
				temp = temp.replace(/\)(?!.*[\)]+)/, "");
			}
			return temp;
		};
			
		// Process source rules for plugins to require
		src = src.replace(/\@-hitch-requires[^\;]*\;/g, function(m,i,s){
			var parts = m.split(/\s|\;/g);
			if(parts[1].indexOf('package:') === 0){
				// populating with name and base to make models accurate with rest
				requires.push({uri:'http://www.hitchjs.com/use/' + parts[1].substring(8) + ".js", name: parts[1].substring(8), base: '', type: 'require'});
			}else{
				// populating with name and base to make models accurate with rest
				requires.push({uri:parts[1], name: parts[1], base: '', type: 'require'});
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
	
		var	filterRE; 
		
		
		// You cannot re-use this without resetting...creating is much more expensive
		var getHasFilterRE = function(){
			var pluginNames, regExpPart;
			if(!filterRE){
				pluginNames = Hitch.list();

				// Regex string for testing parens --- params declaration
				regExpPart = '\\([^\\)]*\\)';
					
				filterRE =  new RegExp(pluginNames.join(regExpPart + '|') + regExpPart,"g");		
			}
			filterRE.lastIndex = 0;
			return filterRE;
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
					src = src.replace(new RegExp(constant.name,'g'), function(m,i,s){
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
					compiledRule = { ruleId: i };
					
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
							//console.log('skipping a rule because it was media or page: ' + raw);
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
					
					// push the compiled rule into the stack
					compiled.push(compiledRule);
				}

				/* TODO: temporarily doing extra work to fix the model contract */
				var outModel = { rules: [], segIndex: getSegIndex(compiled), plugins: requires };
				for(var ccc=0; ccc < compiled.length; ccc++){
					if(compiled[ccc].rule){
						outModel.rules.push(compiled[ccc].rule);
					}
				}
				invokeFinished(outModel);
			}catch(e){
				console.error(e);
			}
		};
		
		Hitch.resource.load(requires,null,'script',null,compile);
	};
}());


if(typeof module !== 'undefined' && module.exports){
	module.exports.HitchCompiler = HitchCompiler;
}

/*
	Hitch Pre-compiled loader
	Immediately inspects the document head for compiled rules 
	and loads them right away, this will prevent a lot of work
	whe it is true and has almost no cost since it is scanning the head only
*/
(function(){
	var h = document.getElementsByTagName('head')[0],
		compiled = h.querySelectorAll('link[x-hitch-compiled]'),
		linktag, 
		precompileds = [];
		
	for(var i=0;i<compiled.length;i++){
		linktag = compiled[i];
		precompileds.push({uri:linktag.getAttribute('href').replace('.css', '-compiled.js')});
	}
	
	
	Hitch.resource.load(precompileds,null,'script',null,function(){});


	/*
		Hitch Main Entry
		This is the official "start" of Hitch in interpreted mode.
	*/
	Hitch.go = function(){
		Hitch.scanCSS(document.getElementsByTagName('head')[0],function(){
			var bod = document.getElementsByTagName('body')[0];
			Hitch.init();
			Hitch.scan(bod,function(){
				addMod(bod,Hitch.matchesSelector);
			});	
		});
	};
	
	if(Hitch.query(h,'script[data-hitch-manual]').length===0){ 
		Hitch.events.ready(Hitch.go);
	}
})();
