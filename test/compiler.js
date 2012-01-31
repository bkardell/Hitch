QUnit.module("HitchCompiler");
asyncTest("compiler is global", function(){
	var g = helper();
	setTimeout(function(){
		ok(g.window.HitchCompiler, "HitchCompiler is global... Just checkin..");
		start();
	},200);
});

// Test simple const functionality in trivial case
asyncTest("const check", function(){
	var g = helper();
	setTimeout(function(){
		g.window.HitchCompiler('@-hitch-const -foo-bar div, .x; \n h1{ color: green; } \n:-foo-bar{ color: red; } \nspan{ color: green; } \n',function(comp){
			start();
			ok(comp.rules.length===3, 'there should be 3 rules');
			equals(comp.rules[1].trim(), 'div, .x { color: red; }', 'should be div, .x { color: red; }');
		})
	},200);
});

// Make sure that all instances of the constant are replaced, not just the first...
asyncTest("const check - all replaced", function(){
	var g = helper();
	setTimeout(function(){
		g.window.HitchCompiler('@-hitch-const -foo-bar div, .x; \n h1{ color: green; } \n:-foo-bar{ color: red; } \nspan :-foo-bar{ color: green; } \n',function(comp){
			start();
			ok(comp.rules.length===3, 'there should be 3 rules');
			equals(comp.rules[1].trim(), 'div, .x { color: red; }','the rule should contain swapped constant values');
			equals(comp.rules[2].trim(), 'span div, .x { color: green; }','the rule should contain swapped constant values');
		})
	},200);
});

// Make sure that shorter consts defined earlier don't incorrectly swap out longer ones... As in:
// @-hitch-const -foo-bar div;
// @-hitch-const -foo-bar2 span;
// :foo-bar2{ color: blue; }
// You don't want that to become:
// div2{ color: blue; }
asyncTest("const check substring problem", function(){
	var g = helper();
	setTimeout(function(){
		g.window.HitchCompiler('@-hitch-const -foo-bar div, .x; \n @-hitch-const -foo-bar2 span, .y; \n h1{ color: green; } \n:-foo-bar{ color: red; } \n:-foo-bar2{ color: green; } \n',function(comp){
			start();
			ok(comp.rules.length===3, 'there should be 3 rules');
			equals(comp.rules[1].trim(), 'div, .x { color: red; }','the rule should contain swapped constant values');
			equals(comp.rules[2].trim(), 'span, .y { color: green; }','the rule should contain swapped constant values');
		})
	},200);
});

asyncTest("const check with definition from requires", function(){
	var g = helper();
	expect(2);
	setTimeout(function(){
		g.window.HitchCompiler('@-hitch-requires ./fake-hitch.js;\n\n:-apple:-false-return(1){ color: green; } \n',function(comp){
			start();
			ok(comp.rules.length===1, 'there should be 1 rule');
			equals(comp.rules[0].trim(), '/* was: div span.apple:-false-return(1) */\ndiv span.apple._0 { color: green; }','the rule should contain swapped constant values');
		})
	},200);
});

asyncTest("simple rule compiler test", function(){
	var g = helper();
	setTimeout(function(){
		g.window.HitchCompiler('@-hitch-requires ./fake-hitch.js;\n\ndiv:-false-return(1){ color: green; } \n',function(comp){
			start();
			expect(9);
			ok(comp.rules.length===1, 'there should be 1 rule');
			ok(comp.segIndex.div, 'there should be a div entry in segIndex');
			ok(comp.segIndex.div.hitches[":-false-return"], "false return hitch should be in the segIndex");
			ok(comp.segIndex.div.hitches[":-false-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex.div.hitches[":-false-return"][0].sid,"0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].rid,"0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].cid,"0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].args,"1");
			equals(comp.segIndex.div.hitches[":-false-return"][0].base,"*");
		})
	},200);
});


asyncTest("simple rule compiler test trailing irrelevant segment", function(){
	var g = helper();
	setTimeout(function(){
		g.window.HitchCompiler('@-hitch-requires ./fake-hitch.js;\n\ndiv:-false-return(1) span{ color: green; } \n',function(comp){
			start();
			expect(9);
			
			ok(comp.rules.length===1, 'there should be 1 rule');
			ok(comp.segIndex.div, 'there should be a div entry in segIndex');
			ok(comp.segIndex.div.hitches[":-false-return"], "false return hitch should be in the segIndex");
			ok(comp.segIndex.div.hitches[":-false-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex.div.hitches[":-false-return"][0].sid,"0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].rid,"0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].cid,"0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].args,"1");
			equals(comp.segIndex.div.hitches[":-false-return"][0].base,"*");
		})
	},200);
});

asyncTest("2 simple rule compiler test", function(){
	var g = helper();
	setTimeout(function(){
		g.window.HitchCompiler('@-hitch-requires ./fake-hitch.js;\n\ndiv:-false-return(1){ color: green; } \ndiv:-true-return(2){ color: blue; }\n',function(comp){
			start();
			expect(16);
			ok(comp.rules.length===2, 'there should be 2 rules');
			ok(comp.segIndex.div, 'there should be a div entry in segIndex');
			ok(comp.segIndex.div.hitches[":-false-return"], "false return hitch should be in the segIndex");
			ok(comp.segIndex.div.hitches[":-false-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex.div.hitches[":-false-return"][0].sid,"0", "the sid of hitch 1 should be 0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].rid,"0", "the rid of hitch 1 should be 0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].cid,"0", "the cid of hitch 1 should be 0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].args,"1", "the args of hitch 1 should be 1");
			equals(comp.segIndex.div.hitches[":-false-return"][0].base,"*", "the base of hitch 1 should be *");
			
			ok(comp.segIndex.div.hitches[":-true-return"], "true return hitch should be in the segIndex");
			ok(comp.segIndex.div.hitches[":-true-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex.div.hitches[":-true-return"][0].sid,"0", "the sid of hitch 2 should be 0");
			equals(comp.segIndex.div.hitches[":-true-return"][0].rid,"1", "the rid of hitch 2 should be 1");
			equals(comp.segIndex.div.hitches[":-true-return"][0].cid,"1", "the cid of hitch 1 should be 1");
			equals(comp.segIndex.div.hitches[":-true-return"][0].args,"2", "the args of hitch 2 should be 2");
			equals(comp.segIndex.div.hitches[":-true-return"][0].base,"*", "the base of hitch 2 should be *");
		})
	},200);
});

asyncTest("simple rule compiler test trailing relevant segment", function(){
	var g = helper();
	setTimeout(function(){
		g.window.HitchCompiler('@-hitch-requires ./fake-hitch.js;\n\ndiv:-false-return(1) span:-true-return(2){ color: green; } \n',function(comp){
			start();
			expect(17);
			
			ok(comp.rules.length===1, 'there should be 1 rule');
			ok(comp.segIndex.div, 'there should be a div entry in segIndex');
			ok(comp.segIndex.div.hitches[":-false-return"], "false return hitch should be in the segIndex");
			ok(comp.segIndex.div.hitches[":-false-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex.div.hitches[":-false-return"][0].sid,"0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].rid,"0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].cid,"0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].args,"1");
			equals(comp.segIndex.div.hitches[":-false-return"][0].base,"*");
			
			ok(comp.segIndex['div span'], 'there should be a div span entry in segIndex');
			ok(comp.segIndex['div span'].hitches[":-true-return"], "true return hitch should be in the segIndex");
			ok(comp.segIndex['div span'].hitches[":-true-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].sid,"1", "the sid should be 1");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].rid,"0", "the rid should be 0");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].cid,"1", "the cid should be 1");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].args,"2", "the args should be '2'");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].base,"*", "the base should be *");
		})
	},200);
});

asyncTest("a inside b", function(){
	var g = helper();
	setTimeout(function(){
		g.window.HitchCompiler('@-hitch-requires ./fake-hitch.js;\n\ndiv:-false-return(span:-true-return(2)){ color: green; } \n',function(comp){
			start();
			expect(25);
			
			ok(comp.rules.length===1, 'there should be 1 rule');
		
			ok(comp.segIndex.span, 'there should be a span entry in segIndex');
			ok(comp.segIndex.span.hitches[":-true-return"], "false return hitch should be in the segIndex");
			ok(comp.segIndex.span.hitches[":-true-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex.span.hitches[":-true-return"][0].sid,"0");
			equals(comp.segIndex.span.hitches[":-true-return"][0].rid,"0");
			equals(comp.segIndex.span.hitches[":-true-return"][0].cid,"1");
			equals(comp.segIndex.span.hitches[":-true-return"][0].args,"2");
			equals(comp.segIndex.span.hitches[":-true-return"][0].base,"*");
			
		
			ok(comp.segIndex.div, 'there should be a div entry in segIndex');
			ok(comp.segIndex.div.hitches[":-false-return"], "false return hitch should be in the segIndex");
			ok(comp.segIndex.div.hitches[":-false-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex.div.hitches[":-false-return"][0].sid,"0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].rid,"1");
			equals(comp.segIndex.div.hitches[":-false-return"][0].cid,"0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].args,"span._1");
			equals(comp.segIndex.div.hitches[":-false-return"][0].base,"*");
			
		
			ok(comp.segIndex['div span'], 'there should be a div span entry in segIndex');
			ok(comp.segIndex['div span'].hitches[":-true-return"], "true return hitch should be in the segIndex");
			ok(comp.segIndex['div span'].hitches[":-true-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].sid,"1", "the sid should be 1");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].rid,"1", "the rid should be 1");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].cid,"1", "the cid should be 1");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].args,"2", "the args should be '2'");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].base,"*", "the base should be *");
		})
	},200);
});


asyncTest("a inside b - single line comment outside rule", function(){
	var g = helper();
	setTimeout(function(){
		g.window.HitchCompiler('@-hitch-requires ./fake-hitch.js;\n/* You suck */\ndiv:-false-return(span:-true-return(2)){ color: green; } \n',function(comp){
			start();
			expect(25);
			
			ok(comp.rules.length===1, 'there should be 1 rule');
		
			ok(comp.segIndex.span, 'there should be a span entry in segIndex');
			ok(comp.segIndex.span.hitches[":-true-return"], "false return hitch should be in the segIndex");
			ok(comp.segIndex.span.hitches[":-true-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex.span.hitches[":-true-return"][0].sid,"0");
			equals(comp.segIndex.span.hitches[":-true-return"][0].rid,"0");
			equals(comp.segIndex.span.hitches[":-true-return"][0].cid,"1");
			equals(comp.segIndex.span.hitches[":-true-return"][0].args,"2");
			equals(comp.segIndex.span.hitches[":-true-return"][0].base,"*");
			
		
			ok(comp.segIndex.div, 'there should be a div entry in segIndex');
			ok(comp.segIndex.div.hitches[":-false-return"], "false return hitch should be in the segIndex");
			ok(comp.segIndex.div.hitches[":-false-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex.div.hitches[":-false-return"][0].sid,"0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].rid,"1");
			equals(comp.segIndex.div.hitches[":-false-return"][0].cid,"0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].args,"span._1");
			equals(comp.segIndex.div.hitches[":-false-return"][0].base,"*");
			
		
			ok(comp.segIndex['div span'], 'there should be a div span entry in segIndex');
			ok(comp.segIndex['div span'].hitches[":-true-return"], "true return hitch should be in the segIndex");
			ok(comp.segIndex['div span'].hitches[":-true-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].sid,"1", "the sid should be 1");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].rid,"1", "the rid should be 1");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].cid,"1", "the cid should be 1");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].args,"2", "the args should be '2'");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].base,"*", "the base should be *");
		})
	},200);
});

asyncTest("a inside b - multi line comment outside rule", function(){
	var g = helper();
	setTimeout(function(){
		g.window.HitchCompiler('@-hitch-requires ./fake-hitch.js;\n/* \n You suck \n */\ndiv:-false-return(span:-true-return(2)){ color: green; } \n',function(comp){
			start();
			expect(25);
			ok(comp.rules.length===1, 'there should be 1 rule');
		
			ok(comp.segIndex.span, 'there should be a span entry in segIndex');
			ok(comp.segIndex.span.hitches[":-true-return"], "false return hitch should be in the segIndex");
			ok(comp.segIndex.span.hitches[":-true-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex.span.hitches[":-true-return"][0].sid,"0");
			equals(comp.segIndex.span.hitches[":-true-return"][0].rid,"0");
			equals(comp.segIndex.span.hitches[":-true-return"][0].cid,"1");
			equals(comp.segIndex.span.hitches[":-true-return"][0].args,"2");
			equals(comp.segIndex.span.hitches[":-true-return"][0].base,"*");
			
		
			ok(comp.segIndex.div, 'there should be a div entry in segIndex');
			ok(comp.segIndex.div.hitches[":-false-return"], "false return hitch should be in the segIndex");
			ok(comp.segIndex.div.hitches[":-false-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex.div.hitches[":-false-return"][0].sid,"0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].rid,"1");
			equals(comp.segIndex.div.hitches[":-false-return"][0].cid,"0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].args,"span._1");
			equals(comp.segIndex.div.hitches[":-false-return"][0].base,"*");
			
		
			ok(comp.segIndex['div span'], 'there should be a div span entry in segIndex');
			ok(comp.segIndex['div span'].hitches[":-true-return"], "true return hitch should be in the segIndex");
			ok(comp.segIndex['div span'].hitches[":-true-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].sid,"1", "the sid should be 1");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].rid,"1", "the rid should be 1");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].cid,"1", "the cid should be 1");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].args,"2", "the args should be '2'");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].base,"*", "the base should be *");
		})
	},200);
});


asyncTest("a inside b - @import", function(){
	var g = helper();
	setTimeout(function(){
		g.window.HitchCompiler('@-hitch-requires ./fake-hitch.js;\n@import url("poop.css");\n\ndiv:-false-return(span:-true-return(2)){ color: green; } \n',function(comp){
			start();
			expect(25);
			ok(comp.rules.length===1, 'there should be 1 rule');
		
			ok(comp.segIndex.span, 'there should be a span entry in segIndex');
			ok(comp.segIndex.span.hitches[":-true-return"], "false return hitch should be in the segIndex");
			ok(comp.segIndex.span.hitches[":-true-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex.span.hitches[":-true-return"][0].sid,"0");
			equals(comp.segIndex.span.hitches[":-true-return"][0].rid,"0");
			equals(comp.segIndex.span.hitches[":-true-return"][0].cid,"1");
			equals(comp.segIndex.span.hitches[":-true-return"][0].args,"2");
			equals(comp.segIndex.span.hitches[":-true-return"][0].base,"*");
			
		
			ok(comp.segIndex.div, 'there should be a div entry in segIndex');
			ok(comp.segIndex.div.hitches[":-false-return"], "false return hitch should be in the segIndex");
			ok(comp.segIndex.div.hitches[":-false-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex.div.hitches[":-false-return"][0].sid,"0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].rid,"1");
			equals(comp.segIndex.div.hitches[":-false-return"][0].cid,"0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].args,"span._1");
			equals(comp.segIndex.div.hitches[":-false-return"][0].base,"*");
			
		
			ok(comp.segIndex['div span'], 'there should be a div span entry in segIndex');
			ok(comp.segIndex['div span'].hitches[":-true-return"], "true return hitch should be in the segIndex");
			ok(comp.segIndex['div span'].hitches[":-true-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].sid,"1", "the sid should be 1");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].rid,"1", "the rid should be 1");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].cid,"1", "the cid should be 1");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].args,"2", "the args should be '2'");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].base,"*", "the base should be *");
		})
	},200);
});



asyncTest("a inside b - @page", function(){
	var g = helper();
	setTimeout(function(){
		g.window.HitchCompiler('@-hitch-requires ./fake-hitch.js;\n@page :right { \nmargin: 1em; \n}\n\ndiv:-false-return(span:-true-return(2)){ color: green; } \n',function(comp){
			start();
			expect(25);
			ok(comp.rules.length===1, 'there should be 1 rule');
		
			ok(comp.segIndex.span, 'there should be a span entry in segIndex');
			ok(comp.segIndex.span.hitches[":-true-return"], "false return hitch should be in the segIndex");
			ok(comp.segIndex.span.hitches[":-true-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex.span.hitches[":-true-return"][0].sid,"0");
			equals(comp.segIndex.span.hitches[":-true-return"][0].rid,"0");
			equals(comp.segIndex.span.hitches[":-true-return"][0].cid,"1");
			equals(comp.segIndex.span.hitches[":-true-return"][0].args,"2");
			equals(comp.segIndex.span.hitches[":-true-return"][0].base,"*");
			
		
			ok(comp.segIndex.div, 'there should be a div entry in segIndex');
			ok(comp.segIndex.div.hitches[":-false-return"], "false return hitch should be in the segIndex");
			ok(comp.segIndex.div.hitches[":-false-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex.div.hitches[":-false-return"][0].sid,"0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].rid,"1");
			equals(comp.segIndex.div.hitches[":-false-return"][0].cid,"0");
			equals(comp.segIndex.div.hitches[":-false-return"][0].args,"span._1");
			equals(comp.segIndex.div.hitches[":-false-return"][0].base,"*");
			
		
			ok(comp.segIndex['div span'], 'there should be a div span entry in segIndex');
			ok(comp.segIndex['div span'].hitches[":-true-return"], "true return hitch should be in the segIndex");
			ok(comp.segIndex['div span'].hitches[":-true-return"].length===1,'There should be only 1 applicable hitch');
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].sid,"1", "the sid should be 1");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].rid,"1", "the rid should be 1");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].cid,"1", "the cid should be 1");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].args,"2", "the args should be '2'");
			equals(comp.segIndex['div span'].hitches[":-true-return"][0].base,"*", "the base should be *");
		})
	},200);
});


