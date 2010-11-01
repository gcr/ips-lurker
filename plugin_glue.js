/* sometimes when writing plugins,
 * you need to ensure that they don't trample all over themselves.
 * for example, when you're writing a game, then when you go into 'game mode'
 * you don't want to tell jokes and confuse people.
 *
 * here's a few extra helps that will help you help your plugins help themselves
 * and keep themselves from trampling all over each other.
 */
// this is our global chat instance. (just one)
var chat;

// utility functions
function ensureChat() {
  if (!chat) { throw new Error("no chat yet! call your function after it's connected."); }
}
function randomChoice(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}
exports.assignChat = function(nchat) {
  chat = nchat;
};

// let's start off with some functions for saying things
exports.randomSay = function(sayings) {
  ensureChat();
  // will have chat automatically say things
  var saying = randomChoice(sayings);
  if (saying instanceof Array) {
    // say the sayings each a second or so apart
    (function say() {
      if (saying.length) {
        chat.say(saying.shift());
        setTimeout(say, 1500+Math.random()*2000);
      }
    })();
  } else {
    // just say it
    chat.say(saying);
  }
};

// now locking!
//
// a plugin may 'lock' the bot so he only responds to event handlers from that
// plugin. useful for games where you don't want any more distractions, etc.
//
// lock with lock() and unlock with unlock(). this works by clearing(saving) all
// unprotected event handlers and restoring them at unlock(). this means you
// must re-assign all relevent event handlers yourself after locking the bot.
//
// if you simply must have an event handler fire (e.g. for logging, etc.) then
// wrap it in protectLock, eg. turn this:
// chat.on('message', function(msg) {console.log(msg);});
// into this:
// chat.on('message', lockProtect(function(msg) {console.log(msg);}));
var eventNames = "message user_enter user_exit settled".split(' '),
    protectedHandlers = [],
    saved = {},
    locked = false;
exports.lock = function() {
  if (locked) { console.log("******** already locked"); return false; }
  locked = true;
  ensureChat();
  // two pass.
  // for each event that we must deal with:
  //   for each event in chat.listeners(eventName):
  //     if it's not in protectedHandlers, add it to saved[eventName]
  // for each event in saved[eventName]:
  //   remove it from chat
  // save handlers
  console.log("*** LOCK");
  for (var en=0; en<eventNames.length; en++) {
    var eventName=eventNames[en];
    saved[eventName] = saved[eventName] || [];
    for (var i=0; i<chat.listeners(eventName).length; i++) {
      var listener = chat.listeners(eventName)[i];
      if (protectedHandlers.indexOf(listener) == -1) {
        saved[eventName].push(listener);
      }
    }
  }
  // remove saved handlers
  for (var savedName in saved) {
    if (saved.hasOwnProperty(savedName)) {
      for (var j=0,l=saved[savedName].length; j<l; j++) {
        chat.removeListener(savedName, saved[savedName][j]);
      }
    }
  }
  return true;
};

exports.unlock = function() {
  if (!locked) { console.log("***** already unlocked"); return false; }
  locked = false;
  // very similar to above:
  // remove unprotected events
  // then restore from saved.
  console.log("*** UNLOCK");
  for (var en=0; en<eventNames.length; en++) {
    var eventName=eventNames[en];
    saved[eventName] = saved[eventName] || [];
    for (var i=0; i<chat.listeners(eventName).length; i++) {
      var listener = chat.listeners(eventName)[i];
      if (protectedHandlers.indexOf(listener) == -1) {
        chat.removeListener(eventName, listener);
      }
    }
  }
  // remove saved handlers
  for (var savedName in saved) {
    if (saved.hasOwnProperty(savedName)) {
      for (var j=0,l=saved[savedName].length; j<l; j++) {
        chat.on(savedName, saved[savedName][j]);
      }
    }
  }
  saved = {};
  return true;
};

exports.lockProtect = function(fun) {
  // ensure that the given function won't get destroyed on unlock
  protectedHandlers.push(fun);
  return fun;
};
exports.locked = function(){ return locked; };
