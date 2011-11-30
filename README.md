CssPlugin
=========

Usage
=====

Description
===========
Currently, the CSS specification allows for vendor prefixed pseudo-classes.  For the most part, 
these are created by browser manufacturers to provide early implementations of well discussed 
proposals for addition into the next selectors draft.  If people like it, or if the rationale
is strong enough, other browsers follow suit and work out the kinks each offering their own
vendor prefixed version.   

During this time, the API is arguably "unstable" or subject to change, 
and users are warned. Generally speaking, however, the community generally reaches wide enough
consensus pretty quickly that the vast majority of use cases are covered and generalized 
across the board pretty quickly. At this point, however, it enters a different phase where 
the draft itself has to be created or finalized in committee and there, features can be 
changed, renamed, or even omitted/declined outright. It is not until such a time as it looks
pretty inevitable that something will pass that browsers generally begin providing un-prefixed
versions.

### Advantages of the current system
* It prevents the kinds of browser wars which can create long term instability.
* Ensures a comparatively small, universal set which works everywhere.
* The initial implementor or two provide a great opt-in mechanism for CSS mavens to try it out, comment on it, blog about it, etc.

### Disadvantages of the current system
* Initial implementations are generally impractical for real world use, so the 
testing is artificially limited to non-real world use cases.
* While ideas that pass the initial test catch on very quickly and get universally
implemented by each vendor, the fact that a single invalid selector negates the entire
rule means that the entire rule must be repeated with each of the vendor prefixes.
Even using a pre-processor, we are faced with an artificially inflated and 
impractically large stylesheet that needs to be delivered.  This also serves to 
artificially limit the number of real-world uses where it can be used.
* The W3C and browser manufacturers, by their very nature, have to be concerned 
with universality.  If something would be a major improvement for 80% of websites, 
but if used on the remaining 20% would be disastrous - it is a non-starter.  While
this seems like an advantage on its face.

