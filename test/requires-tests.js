QUnit.module("Hitch Requires Tests");

asyncTest("Test @hitch-requires", function(){
	// This test has the possiblity to fail due to running too quickly.
	// If it fails - first try increasing the timeout.
	setTimeout(function(){
		ok(window['requires-hitch-added'], "@hitch-require statement loaded proper JS.");
		ok(window['requires-hitch'], "requires-hitch ran in fixtures.css");
		start();
	},100);

});