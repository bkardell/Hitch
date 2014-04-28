(function (window, Hitch) {

    /*********************
     * Introduces a post message hack to employ .nextTick idea
     * Note that I'm following a pattern here I'd like to discuss,
     * but semi-incompletely - the basic idea is that Hitch is a
     * phantom `prollyfill` root whihch shadows and groups things
     * I've leaned a few different ways on this, it would be good
     * to just nail one down
     *********************/
    Hitch.window = Hitch.window || {};
    Hitch.window.nextTick = (function () {
        var q = [];
        window.addEventListener('message', function () {
            var i = 0;
            while (i < q.length) {
                try {
                    q[i++]();
                } catch (e) {
                    q = q.slice(i);
                    window.postMessage('tic!', '*');
                    throw e;
                }
            }
            q.length = 0;
        }, false);

        return function (fn) {
            if (!q.length) window.postMessage('tic!', '*');
            q.push(fn);
        };
    }());


    Hitch.startedAt = Date.now();
    Hitch.loadTime = function () {
        return Hitch.lastRunAt - Hitch.startedAt;
    };

    /********************
     * I'm using this so that I can make sure it happens only once.
     */
    var mutationObserver;

    // This is where we wire up new nodes, it's really all you call...
    Hitch.observe = function () {
        // TODO: No way I can think of offhand to say `a browser that supports
        var supportParseMutations = !navigator.mozGetUserMedia;
        // connect is actually the thing that wires things up, it is geared to 
        // happen as soon as possible
        if (supportParseMutations && !mutationObserver) {
            console.log("adding wiring...");
            observer = new MutationObserver(function (mutations) {
                // pick the configured strategy and employ it
                Hitch.window.nextTick(function () {
                    mutations.forEach(function (mutation) {
                        var targetedRules, elementsToTest;
                        // This seems like always the right thing to do for these...
                        Array.prototype.slice.call(mutation.addedNodes).forEach(function (el) {
                            if (el.nodeType === 1) {
                                Hitch.selectors.unique.forEach(function (selector) {
                                    el.Hitch().matchesSelector(selector, true);
                                });
                            }
                        });
                        // Handle attr/class mutations by simply looking up in selectorIndex (see example.html which is mocking this)
                        // Walk the elements and do .matchesSelector for each entry in selectorIndex['class'] or selectorIndex['attr'];

                        if (mutation.type === "attributes") {
                            if (mutation.attributeName === "class") {
                                // look for rules involving .class filters
                                Array.prototype.slice.call(mutation.target.classList).forEach(function (className) {
                                    targetedRules = Hitch.selectors.map.CLASS["." + className] || [];
                                });
                            } else if (mutation.attributeName == "id") {
                                // look for rules involving #id filters
                                targetedRules = Hitch.selectors.map.ID["#" + mutation.target.id] || [];
                            } else if (mutation.attributeName) {
                                // look for rules involving normal [] attr filters
                                targetedRules = Hitch.selectors.map.ATTR["[" + mutation.attributeName + "]"] || [];
                            } else {
                                targetedRules = Hitch.selectors.map.TAG[mutation.target.tagName];
                            }
                            // You've got to check these and all children...
                            elementsToTest = Array.prototype.slice.call(mutation.target.querySelectorAll("*"));
                            elementsToTest.unshift(mutation.target);
                            targetedRules.forEach(function (selector) {
                                elementsToTest.forEach(function (el) {
                                    el.Hitch().matchesSelector(selector, true);
                                });
                            });
                        }

                    });
                });
            });


            // Note that I've moved this from body to documentElement so we can start processing much earlier
            observer.observe(document.documentElement, {
                attributes: true,
                childList: true,
                subtree: true
            });
        } else if (!supportParseMutations) {
            document.addEventListener("DOMContentLoaded", function () {
                var elementsToTest = Array.prototype.slice.call(document.body.querySelectorAll("*"));
                elementsToTest.forEach(function (el) {
                    var targetedRules = Hitch.selectors.unique;
                    targetedRules.forEach(function (selector) {
                        el.Hitch().matchesSelector(selector, true);
                    });
                });
                
            });
        }
    };

})(window, Hitch);