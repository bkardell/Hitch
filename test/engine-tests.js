QUnit.module("Hitch Engine Tests");

test("Hitch is global", function(){
	ok(Hitch, "Hitch is set to global context");
	ok(Hitch.getRules, "Hitch rules exposed");
	ok(Hitch.getHitches, "Hitch hitches exposed");
	ok(Hitch.getConsts, "Hitch constants exposed");
});

/*
	This test needs some thought. Originally we tested for the 'default' plugins.
	In new test env it's hard to isolate the originals from all those that are added for
	test purposes. This will likely need an entire QUnit html for itself.

test("Hitch default hitches", function(){
	for(var h = 0; h < Hitch.getHitches().length; h++){
		var hitch = Hitch.getHitches()[h];
		ok(hitch.name, "Default hitch: " + hitch.name);
		equal(hitch.base, "", "Default hitch: " + hitch.name + " base is empty");
	}
});
*/

test("Hitch add API", function(){
	var fake = {
		name: "fake",
		base: "",
		filter: function(){ return false; }
	};
	var currentHitchCount = Hitch.getHitches().length;
	
	Hitch.add(fake);
	equal(Hitch.getHitches().length, currentHitchCount+1, "Fake Hitch added successfully");

	// Did we take out this protection?
	//raises(function(){ Hitch.add({name: ''}); }, "must not allow plugins without names");

});