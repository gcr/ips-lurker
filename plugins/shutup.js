/*jslint regexp:false */
/*
 * shutup.js -- goes away when people say so
 */

var pluginGlue = require('../plugin_glue'),
    randomSay = pluginGlue.randomSay,

// tweak me
    START_OUT = 3,    // minimum time
    DECAY_MAX = 60,
    CANDYYAM_FACTOR = 0.75, // cool off a bit when people summon me
    ANNOY_FACTOR = 3, // by how much to multiply decay when the annoying appears
    DECAY = 0.75,     // percent
    DECAY_TIME = 1;   // minutes

function randomChoice(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}

// exponential backoff
var timeout = START_OUT, left = false, timer=null;
exports.init = function(chat) {

  function restorePower() {
    chat.debug("***** power restored!");
    clearTimeout(timer);
    left = false;
    pluginGlue.unlock();
    chat.debug("Started talking again");
  }
  function powerOff(username) {
    chat.debug("Stopped talking");
    if (!pluginGlue.lock()) { return; } // !!!!! LOCK
        chat.say(randomChoice([
            username.toLowerCase()+": fine, sorry, I'll be quiet",
            username.toLowerCase()+": oops ok",
            username.toLowerCase()+": your wish is my command, see ya",
            username.toLowerCase()+": bye then, sorry",
            username.toLowerCase()+": I'll be back later, see ya",
            username.toLowerCase()+": I'll be quiet, see ya",
            username.toLowerCase()+": ok I'll get out of your hair",
            username.toLowerCase()+": that's OK I use up too much bandwidth anyways, take care",
            username.toLowerCase()+": guess I still have a ways to go, take care",
            username.toLowerCase()+": sorry for being so rude, take care",
            username.toLowerCase()+": sorry for being so annoying, see ya",
            username.toLowerCase()+": sorry, I'm still learning, I'll log of",
            username.toLowerCase()+": oh noes",
            "run away! run away  !!!!!",
            "take care",
            "nap time",
            "nap time",
            "sleep mode activated",
            "sleep mode activated",
            "time to rest my bytes",
            "disconnect activated",
            "disconnect in progress",
            "self destructing...",
            "self destructing...",
            "self destructing...",
            "self-destruct in 3... 2....",
            "self-destruct in 3... 2....",
            "self-destruct in 3... 2....",
            "self-destruct in 3... 2....",
            "critical error: resource unwanted",
            "brb",
            "brb",
            "brb",
            "brb",
            "brb",
            "the humans hate me! why can't I be a good bot!!! see ya next time"
          ]) + " (brb in ~"+Math.round(timeout) +
               "minute"+(Math.round(timeout)==1?"":"s")+")");
    left = true;
    timer = setTimeout(restorePower, 60*1000*timeout);
    timeout = Math.min(timeout * ANNOY_FACTOR,DECAY_MAX);
    // escape hatch
    chat.on('message', function(msg, username, uid) {
      if (uid == chat.userId || !chat.settled) { return; }
      if (msg.match(/candy/i) && msg.match(/yam/i)) {
            // seekrit codes
            restorePower();
            timeout *= CANDYYAM_FACTOR;
            randomSay([
                "candy? yams? YUM!",
                "zzzzzz---mmmf? wha?",
                "it's-a me!",
                "whaat? candy?",
                "ONOES A BEAR! hide me",
                "lolololol",
                ["GUYYYYSSSSSS", "where's my SUPER SUIT?!"],
                "yams!",
                "ow! hey! I have enough iron in my diet!",
                "wha? who?",
                "hi guys",
                "you rang?",
                "i've been summoned!",
                ["what? who?", "where am I?"],
                "onoes!",
                ["i smell POPCORN", "who's making popcorn?!", "got any for ol' Lurker?"],
                "GOTHAM NEEDS ME?!",
                "I'll be right there!"
              ]);
          }
        });
  }

  // decay
  setInterval(function() {
      if (!left) {
        timeout = Math.max(timeout * DECAY, START_OUT);
        if (timeout != START_OUT) {
          chat.debug("decay now",timeout);
        }
      }
    }, DECAY_TIME*60*1000);

  // the actual trigger
  chat.on('message', function(msg, username, uid) {
      if (uid == chat.userId || !chat.settled) { return; }
      if (msg.match(/candy/i) && msg.match(/yam/i)) {
            randomSay([
                "still here, "+username,
                "haven't left yet",
                "lol, hi"
              ]);
      } else if (!left && msg.match(/lurker/i) && (
          msg.match(/shut up/i) ||
          msg.match(/go away/i) ||
          msg.match(/go home/i) ||
          msg.match(/go [a-zA-Z ]*sleep/i) ||
          msg.match(/\bhate\b/i) ||
          msg.match(/gtfo/i) ||
          msg.match(/disappear/i) ||
          //msg.match(/leave/i) || // we catch "does lurker ever leave?"
          //msg.match(/\bdie\b/i) ||
          msg.match(/log off/i) ||
          msg.match(/turn off/i) ||
          msg.match(/get lost/i) ||
          msg.match(/quiet/i) ||
          msg.match(/scram/i) ||
          msg.match(/fuck/i) ||
          msg.match(/hush/i) ||
          msg.match(/annoying/i) ||
          msg.match(/you suck/i) ||
          msg.match(/deactivate/i) ||
          msg.match(/you stink/i)
        )) {

        powerOff(username);
        }
    });
};
