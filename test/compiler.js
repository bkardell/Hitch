QUnit.module("HitchCompiler");
asyncTest("compiler is global", function(){
	var g = helper();
	setTimeout(function(){
		ok(g.window.HitchCompiler, "HitchCompiler is global... Just checkin..");
		start();
	},200);
});

asyncTest("const check", function(){
	var g = helper();
	setTimeout(function(){
		g.window.HitchCompiler('@-hitch-const -foo-bar div, .x; \n h1{ color: green; } \n:-foo-bar{ color: red; } \nspan{ color: green; } \n',function(comp){
			ok(comp.rules.length===3, 'there should be 3 rules');
			equals(comp.rules[1].trim(), 'div, .x { color: red; }');
			start();
		})
	},200);
});

// Make sure that all instances of the constant are replaced, not just the first...
asyncTest("const check - all replaced", function(){
	var g = helper();
	setTimeout(function(){
		g.window.HitchCompiler('@-hitch-const -foo-bar div, .x; \n h1{ color: green; } \n:-foo-bar{ color: red; } \nspan :-foo-bar{ color: green; } \n',function(comp){
			ok(comp.rules.length===3, 'there should be 3 rules');
			equals(comp.rules[1].trim(), 'div, .x { color: red; }','the rule should contain swapped constant values');
			equals(comp.rules[2].trim(), 'span div, .x { color: green; }','the rule should contain swapped constant values');
			start();
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
			ok(comp.rules.length===3, 'there should be 3 rules');
			equals(comp.rules[1].trim(), 'div, .x { color: red; }','the rule should contain swapped constant values');
			equals(comp.rules[2].trim(), 'span, .y { color: green; }','the rule should contain swapped constant values');
			start();
		})
	},200);
});




