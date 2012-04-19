var g, jsdom = require('jsdom').jsdom,
Url = require("url"),
spawn = require("child_process").spawn,
fs = require('fs'),
helper = function(headStuffPreHitch, headStuffPostHitch, fixtureCode) {
	var document, window; // mask these
	document = jsdom("<html><head>" + (headStuffPreHitch || '') + '<script type="text/javascript" src="../../dist/hitch.js"></script>' + (headStuffPostHitch || '') + '<title>Hitch Test Fixture</title>' + '</head>' + '<body><div id="test-fixture">' + (fixtureCode || '') + '</div></body> </html>', null, {
		features: {
			ProcessExternalResources: ['script'],
			FetchExternalResources: ['script', 'img', 'css', 'frame', 'link'],
			MutationEvents: '2.0',
			QuerySelector: true
		}
	}),
	window = document.createWindow();
	window.console = console;
	window.XMLHttpRequest = function() {
		var url;
		this.open = function(m, u) {
			url = u;
			console.log("open: " + url);
		};
		this.send = function(m, u) {
			var path;			
			try {
				console.log('sending: ' + url);
				path = url.split('?')[0],
				file = url.substring(url.lastIndexOf('/'), url.indexOf('?'));
				path = path.substring(0, path.lastIndexOf('/'));
				//console.log("open: " + fs.realpathSync(path) + file);
				this.readyState = 4;
				this.status = '200';
	
					this.responseText = fs.readFileSync(fs.realpathSync(path) + file, 'UTF-8');
				} catch(e) {
					console.log(e.message);
				}
			this.onreadystatechange();
		}
	};
	window.HITCH_TESTS = true;
	return {
		window: window,
		document: document
	}
};

module.exports.helper = helper;

