== JSPassphrase ==

JSPassphrase is a JavaScript-based passphrase generator.

It basically just picks random words from a wordlist to generate a passphrase.
The script attempts to use the JS WebCrypto API where available, falling back
on `Math.random()` if its not available.  The wordlist is based on Debian's
wamerican package.

== FAQ ==

**Isn't JS Crypto Bad?**

This isn't crypto, just picking random values.  Still, there are probably better
choices than a webpage, but this is intended to be convenient, not TLA-proof.

**Are you saving my passphrase?**

Nope.  Look at the source, no code sending anything anywhere.  Or use your
browser's network inspector.  Or don't use it.
