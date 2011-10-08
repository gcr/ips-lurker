/*jslint regexp:false */
var test = process.openStdin(),
    countDifferences = require('./diff').countDifferences;

function bind(bindee, action) {
  // inside 'action', 'this' will be bound to 'bindee'
  return function() {
    action.call(bindee);
  };
}

function removeOne(hidden) {
  // modify hidden in-place to remove one
  hidden.splice(Math.floor(Math.random()*hidden.length), 1);
}
function initRepr(text) {
  // find all letters that we need to hide
  var result = [];
  text.split('').map(function(char, index) {
      if ("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(char)!=-1) {
        result.push(index);
      }
    });
  return result;
}
function Game(target, timeout, letterMultiples, threshhold) {
  /* A hangman game
   * Events:
   *    tick
   *    timeout
   *    stop (will also be called upon timeout)
   */
  this.target = target;
  this.hidden = initRepr(target);
  this.numLetters = initRepr(target).length;
  this.stepTime = timeout || 1000;
  this.stepTimer = false;
  this.letterMultiples = letterMultiples||3;
  this.threshhold = threshhold||5;
  // for the incremental revealing of 'target', store the game state as an array
  // of numbers. each number corresponds to the string indices of the numbers
  // we're hiding. so "hello" and [2,3] makes "he__o"
  // "hello world", [2,3,6,8] => "he__o _o_ld"
}
require('util').inherits(Game, require('events').EventEmitter);

Game.prototype.toString = function() {
  var self = this;
  return this.target.split('').map(function(char, idx) {
      if (self.hidden.indexOf(idx)!=-1) {
        return "_";
      }
      if (char === ' ') {
        return "&nbsp;&nbsp;";
      }
      return char;
    }).join(' ');
};
function compare(probe, gallery) {
  var target = gallery.toLowerCase().replace(/[^a-zA-Z]/g, '');
  probe = probe.toLowerCase().replace(/[^a-zA-Z]/g, '');
  // todo: to do this properly, we should traverse the entire permutation 'tree'
  // of possible substitutions. but this should be fine for now.
  // try ambiguous words
  return Math.min(
      countDifferences(target, probe),
      countDifferences(target.replace(/wanna/g,'wantto'), probe),
      countDifferences(target.replace(/wantto/g,'wanna'), probe),
      countDifferences(target.replace(/gonna/g,'going to'), probe),
      countDifferences(target.replace(/goingto/g,'gonna'), probe),
      countDifferences(target.replace(/out/g,'all'), probe),
      countDifferences(target.replace(/all/g,'out'), probe),
      countDifferences(target.replace(/come/g,'can'), probe),
      countDifferences(target.replace(/can/g,'come'), probe),
      countDifferences(target.replace(/put/g,'pull'), probe),
      countDifferences(target.replace(/pull/g,'put'), probe),
      countDifferences(target.replace(/find/g,'fight'), probe),
      countDifferences(target.replace(/fight/g,'find'), probe),
      countDifferences(target.replace(/crimson/g,'silver'), probe),
      countDifferences(target.replace(/silver/g,'crimson'), probe),
      countDifferences(target.replace(/when/g,'where'), probe),
      countDifferences(target.replace(/where/g,'when'), probe),
      countDifferences(target.replace(/one/g,'andim'), probe), // where the fence is low
      countDifferences(target.replace(/andim/g,'one'), probe),
      countDifferences(target.replace(/and/g,''), probe),
      countDifferences("and"+target, probe)
  );
}
Game.prototype.tryMatch = function(probe) {
  // return true if it matches
  return compare(probe, this.target) <= Math.min(this.threshhold, this.hidden.length/3);
};

Game.prototype.step = function() {
  // remove one letter
  for (var i=0; i<this.letterMultiples; i++) {
    removeOne(this.hidden);
  }
  if (this.hidden.length===0) {
    this.timeout();
  } else {
    this.emit('tick', this);
  }
};

Game.prototype.start = function() {
  if (this.stepTimer) { return; }
  this.stepTimer = setInterval(bind(this, this.step), this.stepTime);
};

Game.prototype.stop = function() {
  if (this.stepTimer !== false) {
    clearTimeout(this.stepTimer);
    this.stepTimer = false;
    this.emit('stop');
  }
};

Game.prototype.timeout = function() {
  this.stop();
  this.emit('timeout', this);
};


exports.Game = Game;
exports.compare = compare;
