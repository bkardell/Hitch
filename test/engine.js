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
		ok(g.window.Hitch.rules, "Rules are exposed");
		equals(g.window.Hitch.rules.length, 0, "Rule count is 0 on initialization");
		ok(g.window.Hitch.plugins, "Plugins are exposed");
		equals(g.window.Hitch.plugins.length, 1, "Plugin count is 1 on initialization");
		start();
	},200);
});

test("plugins contain default set", function(){
	// TODO: Maybe the data structure should be a hash instead of array 
	// to allow for named indexing?
	var g = helper();
	setTimeout(function(){
		var pluginsAny = g.window.Hitch.plugins[0];
		equals(g.window.Hitch.getPluginNames()[0], '-plugins-any', "-plugins-any shows up in names");
		equals(pluginsAny.name, "-plugins-any", "-plugins-any name");
		equals(pluginsAny.base, '', "-plugins-any has an empty base");
		// TODO: Work up a fixture for this test
		// ok(pluginsAny.fn(match, '#test-fixture'), "-plugins-any fn works");
		start();
	},200);
});

test("plugins addition", function(){
	var g = helper();
	setTimeout(function(){
		var testPlugin = {
			name: 'testPlugin',
			base: '',
			fn: function(){ return false; }
		},
		badPlugin = { name: '' },
		pluginsCount = g.window.Hitch.plugins.length;
		g.window.Hitch.add(testPlugin);
		equals(pluginsCount + 1, 2, "test plugin added");
		raises(function(){
			Hitch.add(badPlugin);
		},"must not allow plugins without names");
		start();
	},200);
});


QUnit.module("mods registered ok with link and @ rule requires...");
asyncTest("false-return registered with link", function(){
	var g = helper(
		'<link type="text/css" href="support/libs/fake.css" rel="stylesheet" -plugins-interpret="true"></link>'
	);
	setTimeout(function(){
		//g.window.Hitch.init();
		setTimeout(function(){
			ok(g.window.added, "the window.added property should have been set when hitch was fetched/loaded");
			ok(g.window['false-return'], "false-plugin global should be set");
			start();
		},200);
	},200);
	
});


QUnit.module("mods registered ok with inline style and JS API");
asyncTest("false-return registered with JS API", function(){
	var g = helper(
		'<style -plugins-interpret="true"> div:-false-return() { color: red; } </style>',
		'<script type="text/javascript">  window.added=true; Hitch.add({name: "-false-return",base: "",fn: function(match, args){ '
			 + 'window["false-return"] = true; return false;}});  </script>'
	);
	setTimeout(function(){
		ok(g.window.added, "the window.added property should have been set when hitch was fetched/loaded");
		ok(g.window['false-return'], "false-plugin global should be set");
		start();
	},200);
	
});


QUnit.module("Unrequired/Unprovided modules should be left 'as is' and not registered...");
asyncTest("false-return unregistered no breaking", function(){
	var g = helper('<style -plugins-interpret="true"> div:-false-return { color: red; } </style>');
	setTimeout(function(){		
		ok(g.window.Hitch.getPluginNames().indexOf('-false-return')===-1,'no module should be defined');
		ok(!g.window['false-return'], "false-plugin global should be set");
		start();
	},200);
	
});
