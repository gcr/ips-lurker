/*jslint regexp: false */
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

function countNotAfk(threshhold) {
  // count the users that typed things in the last threshhold minutes
  var afk=0;
  for (var usr in chat.users) {
    if (chat.users.hasOwnProperty(usr)) {
      if ((new Date() - chat.users[usr].lastActivity)/1000 < threshhold*60) {
        afk++;
      }
    }
  }
  return afk;
}
exports.countNotAfk = countNotAfk;

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
  if (locked) { chat.debug("******** already locked"); return false; }
  locked = true;
  ensureChat();
  // two pass.
  // for each event that we must deal with:
  //   for each event in chat.listeners(eventName):
  //     if it's not in protectedHandlers, add it to saved[eventName]
  // for each event in saved[eventName]:
  //   remove it from chat
  // save handlers
  chat.debug("*** LOCK");
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
  if (!locked) { chat.debug("***** already unlocked"); return false; }
  locked = false;
  // very similar to above:
  // remove unprotected events
  // then restore from saved.
  chat.debug("*** UNLOCK");
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


// VOTING
// This function allows you to play games based on voting.
exports.vote = function(needed, afkThresh, voteThresh, prompt, timeout, firstUser, cb, noCb) {
  // If we have less than voteThresh people, just run cb straight away
  // Else, hold a vote by saying 'prompt' and run cb when we have 'needed' many voters.
  // If we time out, run noCb() instead.
  // Please pass in the first user (the one who triggered the vote) so we can
  // count them also.
  if (countNotAfk(afkThresh)<voteThresh) {
    cb();
  } else {
    chat.say(prompt, function(){
        var wantingToPlay = {};
        wantingToPlay[firstUser] = true;
        needed--;
        var messageHandler;
        var nobodyWantsToPlay = setTimeout(function() {
            // nobody wanted to try
            chat.removeListener('message', messageHandler);
            noCb(needed);
          }, timeout*1000);
        messageHandler = function(msg, user, uid) {
          if (!chat.settled || uid == chat.userId) { return; }
          chat.debug("messageHandler");
          // Wait for people to say 'yes'
          if (!(user in wantingToPlay) &&
             (msg.match(/yes/i) ||
              msg.match(/yep/i) ||
              msg.match(/yeah/i) ||
              msg.match(/I will/i) ||
              msg.match(/\bsi\b/i) ||
              msg.match(/totally/i) ||
              msg.match(/activate/i) ||
              msg.match(/yse/i) ||
              msg.match(/sey/i) ||
              msg.match(/sye/i) ||
              msg.match(/okay/i) ||
              msg.match(/\bo[. ]*k\b/i) ||
              msg.match(/sure/i) ||
              msg.match(/\bme\b/i) ||
              msg.match(/why not/i) ||
              msg.match(/play/i) ||
              msg.match(/i.?m in/i))) {
            needed--;
            wantingToPlay[user] = true;
            chat.debug(wantingToPlay);
            chat.debug("need "+needed+" more");
          }
          if (needed<=0) {
            chat.removeListener('message', messageHandler);
            clearTimeout(nobodyWantsToPlay);
            cb();
          }
        };
        chat.on('message', messageHandler);
    });
  }
};
