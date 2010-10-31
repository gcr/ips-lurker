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

Game.prototype.tryMatch = function(probe) {
  // return true if it matches
  var target = this.target.toLowerCase().replace(/[^a-zA-Z]/g, '');
  probe = probe.toLowerCase().replace(/[^a-zA-Z]/g, '');
  console.log(countDifferences(target, probe));
  return (countDifferences(target, probe) <=
      Math.min(this.threshhold, this.hidden.length/3));
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
