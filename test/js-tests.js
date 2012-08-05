QUnit.module("Hitch JavaScript API Tests");

asyncTest("Test JS API", function(){
	setTimeout(function(){
		ok(window['js-hitch'], "js-hitch ran in fixtures.css");
		start();
	}, 50);
});