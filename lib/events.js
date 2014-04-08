/*
	Hitch Events Manager
	Small setup for building a "ready" event system for hitches
*/
(function(hitch, global, doc){
	
	var 
		conf = { 
			o:{ s: global, a: 'addEventListener', e: 'DOMContentLoaded', r: 'removeEventListener' },
			n:{ s: doc, a: 'attachEvent',e: 'onreadystatechange',r: 'detachEvent'}
		},
		callbacks = null,
		done = false,
		o = (doc.addEventListener) ? conf.o : conf.n;

	hitch.events = {
		getAttacherFnName: function(){
			return o.a;
		},

		addLoadListener: function(func){
			o.s[o.a](o.e, func, false);
			o.s[o.a]('load', func, false);
		},

		removeLoadListener: function(func){
			o.s[o.r](o.e, func, false);
			o.s[o.r]('load', func, false);
		},

		DOMHitchReady: function(){
			done = true;
			hitch.events.removeLoadListener(hitch.events.DOMHitchReady);
			if (!callbacks) return;
			for (var i = 0; i < callbacks.length; i++){
				callbacks[i]();
			}
			callbacks = null;
		},

		ready: function(func){
			if (done){
				func();
				return;
			}
			if (!callbacks){
				callbacks = [];
				hitch.events.addLoadListener(hitch.events.DOMHitchReady);
			}
			callbacks.push(func);
		}

	};

})(Hitch, window, document);
