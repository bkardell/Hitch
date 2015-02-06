Hitch.customSelector.set("--math-lessthan", {
      parseArgs: function (argsString) {
            var args = argsString.split(",");
            return [args[0], parseInt(args[1], 10)];
      },
      matches: function (attributeName) {
            return "[" + attributeName + "]";
      },
      predicate: function (el, attributeName, expectedValue) {
            var realValue = parseInt(el.getAttribute(attributeName), 10);
            return realValue < expectedValue;
      }
});

Hitch.customSelector.set("--math-greaterthan", {
      parseArgs: function (argsString) {
            var args = argsString.split(",");
            return [args[0], parseInt(args[1], 10)];
      },
      matches: function (attributeName) {
            return "[" + attributeName + "]";
      },
      predicate: function (el, attributeName, expectedValue) {
            var realValue = parseInt(el.getAttribute(attributeName), 10);
            return realValue > expectedValue;
      }
});

Hitch.customSelector.set("--math-lessthan", {
      parseArgs: function (argsString) {
            var args = argsString.split(",");
            return [args[0], parseInt(args[1], 10)];
      },
      matches: function (attributeName) {
            return "[" + attributeName + "]";
      },
      predicate: function (el, attributeName, expectedValue) {
            var realValue = parseInt(el.getAttribute(attributeName), 10);
            return realValue < expectedValue;
      }
});

Hitch.customSelector.set("--math-greaterthan", {
      parseArgs: function (argsString) {
            var args = argsString.split(",");
            return [args[0], parseInt(args[1], 10)];
      },
      matches: function (attributeName) {
            return "[" + attributeName + "]";
      },
      predicate: function (el, attributeName, expectedValue) {
            var realValue = parseInt(el.getAttribute(attributeName), 10);
            return realValue > expectedValue;
      }
});

Hitch.selectors.register(["h1:--math-lessthan(data-x,2)","h2:--math-lessthan(data-x,10)","ul:--math-lessthan(data-x,10) li","p:--math-lessthan(data-score,1000)","p .foo:--math-lessthan(data-score,1000)[bar]","p .foo :--math-lessthan(data-score,1000)[bar]","p .foo:--math-lessthan(data-score,1000) [bar]","#content :--math-greaterthan(data-score,1000)","p:--math-lessthan(data-score,1000)","p .foo:--math-lessthan(data-score,1000)[bar]","p .foo :--math-lessthan(data-score,1000)[bar]","p .foo:--math-lessthan(data-score,1000) [bar]","#content :--math-greaterthan(data-score,1000)"]);
Hitch.observe();