QUnit.module("HitchCompiler");
asyncTest("compiler is global", function(){
	var g = helper();
	setTimeout(function(){
		ok(g.window.HitchCompiler, "HitchCompiler is global... Just checkin..");
		start();
	},200);
});