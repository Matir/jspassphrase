var PassphraseGenerator = function() {
  /* Minimum entropy */
  this.minEntropy = 40;

  /* Maximum entropy */
  this.maxEntropy = 256;

  /* Load wordlist */
  var xhr = new XMLHttpRequest();
  var generator = this;
  xhr.onload = function() {
    generator.installWordlist(JSON.parse(this.responseText));
  };
  xhr.open('get', 'wordlist.json');
  xhr.send();
};

PassphraseGenerator.prototype.installWordlist = function(wordlist) {
    this.wordlist = wordlist;
    this.bitsPerWord = Math.log(this.wordlist.length)/Math.LN2;
    var entropy = document.getElementById('entropy');
    while (entropy.firstChild)
      entropy.removeChild(entropy.firstChild);
    var minLen = Math.ceil(this.minEntropy/this.bitsPerWord);
    var maxLen = Math.ceil(this.maxEntropy/this.bitsPerWord);
    for (var i=minLen; i<maxLen; ++i) {
      var o = document.createElement('option');
      o.value = i;
      o.innerText = '' + Math.floor(i * this.bitsPerWord);
      entropy.appendChild(o);
    }
    var go = document.getElementById('go');
    go.disabled = false;
    go.addEventListener('click', this.generatePassphrase.bind(this));
};

PassphraseGenerator.prototype.wordListFailed = function() {
  document.getElementById('notify-load-failed').style.display = 'list-item';
};

PassphraseGenerator.prototype.getRNG = function() {
  if (this.rng)
    return this.rng;
  try {
    this.rng = new CryptoRandomImpl();
  } catch(e) {
    this.rng = new JSRandomImpl();
    this.notifyWeakRNG();
  }
  return this.rng;
};

PassphraseGenerator.prototype.notifyWeakRNG = function() {
  document.getElementById('notify-bad-entropy').style.display = 'list-item';
};

PassphraseGenerator.prototype.generatePassphrase = function() {
  var len = document.getElementById('entropy').value;
  var phrase = this.generatePassphrase_(len);
  document.getElementById('results').innerText = phrase;
};

PassphraseGenerator.prototype.generatePassphrase_ = function(len) {
  var phrase = Array();
  var rng = this.getRNG();
  for (var i=0; i<len; ++i) {
    var w = rng.getRandomValue(this.wordlist.length);
    phrase.push(this.wordlist[w]);
  }
  return phrase.join(" ");
};

var CryptoRandomImpl = function() {
  if (!window.crypto || !window.crypto.getRandomValues)
    throw 'window.crypto.getRandomValues not available!';
};

CryptoRandomImpl.prototype.getRandomValue = function(max) {
  var Uint32Max = new Uint32Array([-1])[0];
  if (max > Uint32Max)
    throw 'Can\'t generate value larger than ' + Uint32Max;

  var v;
  var mask = Math.pow(2, Math.ceil(Math.log(max)/Math.LN2))-1;
  var arr = new Uint32Array(1);
  /* Needed to avoid modulo bias. */
  do {
    window.crypto.getRandomValues(arr);
    v = arr[0] & mask;
  } while(v > max);
  return v;
};

/** Random implementation if window.crypto does not exist.  Probably weaker. */
var JSRandomImpl = function() {
};

JSRandomImpl.prototype.getRandomValue = function(max) {
  return Math.floor(Math.random() * (max+1));
};

window.addEventListener('load', function() {
  window.passphraseGenerator = new PassphraseGenerator();
});
