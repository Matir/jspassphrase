var PassphraseGenerator = function() {
  /* Minimum entropy */
  this.minEntropy = 40;

  /* Maximum entropy */
  this.maxEntropy = 256;

  /* Maximum word length */
  this.maxLength = 0;

  /* Add length options & bind change handler */
  var lenopt = document.getElementById('maxlen');
  for (var i=5; i<15; i++) {
    var o = document.createElement('option');
    o.value = i;
    o.innerText = '' + i;
    lenopt.appendChild(o);
  }
  lenopt.addEventListener('change', (function() {
    this.maxLength = parseInt(lenopt.value);
    this.updateOptions();
  }).bind(this));

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
  this.updateOptions();
  var go = document.getElementById('go');
  go.disabled = false;
  go.addEventListener('click', this.generatePassphrase.bind(this));
};

PassphraseGenerator.prototype.updateOptions = function() {
  this.filteredWordlist = this.wordlist.filter((function(w) {
    if (!this.maxLength || w.length <= this.maxLength)
      return true;
    return false;
  }).bind(this));
  var bitsPerWord = Math.log(this.filteredWordlist.length)/Math.LN2;
  var entropy = document.getElementById('entropy');
  while (entropy.firstChild)
    entropy.removeChild(entropy.firstChild);
  var minLen = Math.ceil(this.minEntropy/bitsPerWord);
  var maxLen = Math.ceil(this.maxEntropy/bitsPerWord);
  for (var i=minLen; i<=maxLen; ++i) {
    var o = document.createElement('option');
    o.value = i;
    o.innerText = '' + Math.floor(i * bitsPerWord);
    entropy.appendChild(o);
  }
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
    var w = rng.getRandomValue(this.filteredWordlist.length);
    phrase.push(this.filteredWordlist[w]);
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
