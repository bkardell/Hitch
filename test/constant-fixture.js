/*
	This fixture is loaded via a @hitch-requires statement in fixtures.css
*/
Hitch.add({
	name: '-constant-fixture',
	base: '',
	"const": {
		name: ":-apple",
		replaceWith: "span.apple"
	}
});