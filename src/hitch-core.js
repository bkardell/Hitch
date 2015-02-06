var Hitch = (function(){
      /*
        I'm calling this bikeshed for now because I lack a better name :)
        TODO: remedy that
            ATTR:
               [bar]: 
                  [rules]
      */
      var bikeshed = {};
      var uniqueSelectors = [];
      var subjects = [];
      
      var findNext = function (coll, start, dir) {
            var x = start + dir;
            if (x >= 0 && x <coll.length) {
                  if (/ATTR|ID|CLASS|TAG/.test(coll[x].type)) {
                        return coll[x]; 
                  } 
            }
      };

      var storeInBikeshed = function (tok, selector) {
            bikeshed[tok.type] = bikeshed[tok.type] || {};
            bikeshed[tok.type][tok.value] = bikeshed[tok.type][tok.value] || [];
            bikeshed[tok.type][tok.value].push(selector);
            if (uniqueSelectors.indexOf(selector) === -1) {
                  uniqueSelectors.push(selector);
            }
      };


      var registerSelector = function (selector) {
            var tokens = Sizzle.tokenize(selector), next, j = 0, compiledMatchers, out = [], last;
            // this causes compilation of the rule to happen so we can inquire about it...
            document.documentElement.Hitch().matchesSelector(selector);
            tokens.forEach(function (complexSelectorTokens, i) {
                  complexSelectorTokens.forEach(function (tok, ii) {
                        if (/PSEUDO/.test(tok.type)) {
                              /* jshint -W084 */
                              while(next = findNext(complexSelectorTokens, ii, 1 * --j)) {
                                    storeInBikeshed(next, selector);
                              }
                              j = 0;
                              /* jshint -W084 */
                              while(next = findNext(complexSelectorTokens, ii, 1 * ++j)) {
                                    storeInBikeshed(next, selector);
                              }
                              // we can use the compiled rules to add the matches piece
                              compiledMatchers = Hitch.pseudosTree[tok.value.substring(1, tok.value.indexOf("("))];
                              Object.keys(compiledMatchers).forEach(function (key) {
                                    Sizzle.tokenize(compiledMatchers[key].matches)[0].forEach(function (matchesToken) {
                                          storeInBikeshed(matchesToken, selector);
                                    });
                              });

                              // TODO: tok.matches[1] craziness below it due to something about the parser
                              //       we are using on the precompile, it seems to deem whitespace irrelevant
                              //       there and it gets entirely lost.  In fact, it is irrelevant in this case, 
                              //       but I'm not entirely positive it would be in all cases.  Seems that in 
                              //       every case I can think of, it wouldn't matter as long as they yield the 
                              //       same hash, so for now this is probably ok.
                              out.push("." + Hitch.hashCode(tok.matches[0] + tok.matches[1].replace(', ', ',')));
                        } else {
                          last = tok.value;
                          out.push(tok.value);
                        }
                  });
            });
            if (subjects.indexOf(last) === -1) {
              subjects.push(last);
            }

            return out.join('');
      };



  return {
    selectors: {
      /* I dont think we need this 
      load: function (arr) {
        var buff = [], ns = document.createElement('style');
        arr.forEach(function (data) {
          buff.push(registerSelector(data.selector));
          buff.push("{");
          buff.push(data.declaration);
          buff.push("}");

        });
        ns.innerHTML = buff.join("\n"); 
        document.head.appendChild(ns); 
      }, 
      */
      register: function (arr) {
        arr.forEach(registerSelector);
      },
      unique: uniqueSelectors, 
      map: bikeshed,
      subjects: subjects
    },
    hashCode: function(s){
        return "_" + s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a;},0);              
      }
  };

})();

if(typeof module !== 'undefined' && module.exports){
  module.exports = Hitch;
}

