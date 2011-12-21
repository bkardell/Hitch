var engineTestPlugins = require('./fixtures/engine-plugins');

QUnit.module("Hitch");

test("engine is global", function(){
	ok(Hitch, "Hitch is global");
});

QUnit.module("Hitch API");

test("rules and plugins exposed", function(){
	ok(Hitch.rules, "Rules are exposed");
	equals(Hitch.rules.length, 0, "Rule count is 0 on initialization");
	ok(Hitch.plugins, "Plugins are exposed");
	equals(Hitch.plugins.length, 1, "Plugin count is 1 on initialization");
});

test("plugins contain default set", function(){
	// TODO: Maybe the data structure should be a hash instead of array 
	// to allow for named indexing?
	var pluginsAny = Hitch.plugins[0];
	equals(Hitch.getPluginNames()[0], '-plugins-any', "-plugins-any shows up in names");
	equals(pluginsAny.name, "-plugins-any", "-plugins-any name");
	equals(pluginsAny.base, '', "-plugins-any has an empty base");
	// TODO: Work up a fixture for this test
	// ok(pluginsAny.fn(match, '#test-fixture'), "-plugins-any fn works");
});

test("plugins addition", function(){
	var testPlugin = {
		name: 'testPlugin',
		base: '',
		fn: function(){ return false; }
	},
	badPlugin = { name: '' },
	pluginsCount = Hitch.plugins.length;
	Hitch.add(testPlugin);
	equals(pluginsCount + 1, 2, "test plugin added");
	raises(function(){
		Hitch.add(badPlugin);
	},"must not allow plugins without names");
});

QUnit.module("Hitch test plugin execution");

test("false-return", function(){
	addStyleToDocument("div:-false-return { color: red; }", document);
	ok(window['false-return'], "false-plugin global should be set");
});