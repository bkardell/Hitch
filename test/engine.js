var engineTestPlugins = require('./fixtures/engine-plugins');

QUnit.module("Hitch");
asyncTest("engine is global", function(){
	var g = helper();
	setTimeout(function(){
		ok(g.window.Hitch, "Hitch is global");
		start();
	},200);
});

QUnit.module("Hitch API");
asyncTest("rules and plugins exposed", function(){
	var g = helper();
	setTimeout(function(){
		ok(g.window.Hitch.getRules(), "Rules are exposed");
		equals(g.window.Hitch.getRules().length, 0, "Rule count is 0 on initialization");
		ok(g.window.Hitch.getHitches(), "Plugins are exposed");
		equals(g.window.Hitch.getHitches().length, 5, "Plugin count is 5 on initialization");
		start();
	},200);
});

asyncTest("plugins contain default set", function(){
	// TODO: Maybe the data structure should be a hash instead of array 
	// to allow for named indexing?
	var g = helper();
	expect(10);
	setTimeout(function(){
		
		var hitches = g.window.Hitch.getHitches(),
		    any = hitches[0],
			none = hitches[1],
			one = hitches[2],
			all = hitches[3],
	        has = hitches[4];
	        
		equals(any.name, "-hitch-anyof", "-hitch-anyof name");
		equals(any.base, '', "-hitch-anyof has an empty base");
		
		equals(none.name, "-hitch-noneof", "-hitch-noneof name");
		equals(none.base, '', "-hitch-noneof has an empty base");
		
		equals(all.name, "-hitch-allof", "-hitch-allof name");
		equals(all.base, '', "-hitch-allof has an empty base");
		
		equals(one.name, "-hitch-oneof", "-hitch-oneof name");
		equals(one.base, '', "-hitch-oneof has an empty base");
		
		// TODO: Work up fixtures for these and make sure they really work...
		equals(has.name, "-hitch-has", "-hitch-has name");
		equals(has.base, '', "-hitch-has has an empty base");
		start();
	},200);
});

asyncTest("plugins addition", function(){
	var g = helper();
	setTimeout(function(){
		var testPlugin = {
			name: 'testPlugin',
			base: '',
			filter: function(){ return false; }
		},
		badPlugin = { name: '' },
		pluginsCount = g.window.Hitch.list().length;
		g.window.Hitch.add(testPlugin);
		
		equals(pluginsCount + 1, 6, "test plugin added");
		raises(function(){
			Hitch.add(badPlugin);
		},"must not allow plugins without names");
		start();
	},200);
});


QUnit.module("mods registered ok with link and @ rule requires...");
asyncTest("false-return registered with link", function(){
	var g = helper(
		'<link type="text/css" href="support/libs/fake.css" rel="stylesheet" data-hitch-interpret="true"></link>',
		'',
		'<div>Testing...</div>'
	);
	setTimeout(function(){
		ok(g.window.added, "the window.added property should have been set when hitch was fetched/loaded");
		ok(g.window['false-return'], "false-return global should be set");
		// see notes on false-return registered via data-hitch-widget url as to why this is commented out - same problem
		// ok(g.window['false-return-inited'], "init should have been called");
		ok(g.document.querySelectorAll('._0').length===0, 'The filter should not affect the test-fixture node');
		start();
	},500);
	
});


QUnit.module("mods registered ok with inline style and JS API");
asyncTest("false-return registered with JS API", function(){
	var g = helper(
		'<style data-hitch-interpret="true"> div:-false-return() { color: red; } </style>',
		'<script type="text/javascript" data-hitch-manual>  window.added=true; Hitch.add({name: "-false-return",base: "",filter: function(match, args){ '
			 + 'window["false-return"] = true; return true;}}); Hitch.go();</script>'
	);
	setTimeout(function(){
		ok(g.window.added, "the window.added property should have been set when hitch was fetched/loaded");
		ok(g.window['false-return'], "false-return global should be set");

		ok(g.document.querySelectorAll('._0').length===1, 'The filter should affect the test-fixture node');
		start();
	},500);
	
});


QUnit.module("Unrequired/Unprovided modules should be left 'as is' and not registered...");
asyncTest("false-return unregistered no breaking", function(){
	var g = helper('<style data-hitch-interpret="true"> div:-false-return() { color: red; } </style>');
	setTimeout(function(){		
		ok(g.window.Hitch.list().indexOf('-false-return')===-1,'no module should be defined');
		ok(!g.window['false-return'], "false-return global should be set");
		ok(!g.window['false-return-inited'], "init should have been called");
		ok(g.document.querySelectorAll('._0').length===0, 'Filter should not affect the test-fixture node');
		start();
	},200);
	
});



/**
This test needs review, it might not be any good for reasons pointed out by our test fixture...
Essentially the system today uses the 'default empty rule' to make this widget matter --
essentially something like :-foo-bar{} 

The questionable bit is that those are currently only generated for something that has an init and is
of type: "html".  This test is not that - I realize that the hitch itself is nonsense,  but it is 
also invalid - or is there some rationale use-case for these features to be used all together
like that)...


QUnit.module("Hitch HTML hitch-widget attribute registers correctly... ");
asyncTest("false-return registered via data-hitch-widget url", function(){
	var g = helper(
		'',
		'<span data-hitch-widget="fake-hitch.js"> </span>',
		''
	);	
	setTimeout(function(){		
		ok(g.window.added, "the window.added property should have been set when hitch was fetched/loaded");
		ok(g.window['false-return'], "false-return global should be set");
		ok(g.document.querySelectorAll('._0').length===0, 'Filter should not affect the test-fixture node');
		start();
	},200);
});
*/

QUnit.module("Hitch HTML hitch-widget attribute accepts package: correctly...");
asyncTest("bkardell.social via data-hitch-widget package", function(){
	var g = helper(
		'',
		'',
		'<div data-hitch-widget="package:bkardell.social#g-plusone"><div>'
	);	
	setTimeout(function(){		
		// All we can really do in this env (I think) is verify the url of the script tag
		ok(
			g.window.document.head.innerHTML.indexOf(
				'src="http://www.hitchjs.com/use/bkardell.social'
			) !== -1
		);
		start();
	},2000);
	
});

/* There used to be a test here about adding precompiled rules... We dont have that setup
   yet anyway and we've drastically changed how the method that it was testing worked...
   Use git history if you need to see how it worked - I think it was just wrong :) 
*/



QUnit.module("Hitch Defined Constants...");
asyncTest("make sure hitch defined constants are added and recallable", function(){
	// Note the fact that \n's in the object create a problem for our test...
	var g = helper(
		'',
		'<script type="text/javascript" src="fake-hitch.js"></script>'
	);	
	expect(4);
	setTimeout(function(){		
		ok(g.window.Hitch.getConsts(), "there should be defined consts");
		
		// Should be two because we predefine one currently -hitch-experimental-
		equals(g.window.Hitch.getConsts().length, 2, "there should be 2 defined consts");
		equals(g.window.Hitch.getConsts()[1].name, ":-apple", "the const name should be :-apple");
		equals(g.window.Hitch.getConsts()[1].replaceWith, "div span.apple", "the const replaceWith should be 'div span.apple'");		
		start();
	},200);
	
});

