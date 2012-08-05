QUnit.module("Hitch JavaScript API Tests");

asyncTest("Test JS API", function(){
	// This test has the possiblity to fail due to running too quickly.
	// If it fails - first try increasing the timeout.
	setTimeout(function(){
		ok(window['js-hitch'], "js-hitch ran in fixtures.css");
		start();
	}, 100);
});