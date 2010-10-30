/*jslint regexp: false */
var Game = require('./game').Game,
    pluginGlue = require('../../plugin_glue'),
    randomSay = pluginGlue.randomSay,
    lyricPicker = require('./lyric_picker'),

    AFK_THRESHHOLD = 3,        // minutes
    STEP = 10000,              // ms
    REVEAL_LETTERS = 3,        // how many to reveal at a time
    LETTER_LOOSENESS = 3,      // answer accepted if it's in this tolerance
    VOTE_START_FACTOR = 0.5,   // need this many times number of users to start
    VOTE_THRESHHOLD = 4,       // if there are >= this many active users, a vote is needed
    VOTE_TIMEOUT_PER_USER = 5; // voting times out in this*user count seconds


var timer = null,
    againTimeout = null,
    hangmanMode = false;  // this prevents doubles
exports.init = function(chat ) {

  function countNotAfk() {
    var afk=0;
    for (var usr in chat.users) {
      if (chat.users.hasOwnProperty(usr)) {
        if ((new Date() - chat.users[usr].lastActivity)/1000 < AFK_THRESHHOLD*60) {
          afk++;
        }
      }
    }
    return afk;
  }

  function endGame(timeout) {
    // unlock chat, reset back to where we were
    pluginGlue.unlock();
    chat.messagePollInterval = 3000;
    chat.resetTimers();
    hangmanMode = false;
  }

  function startHangman(target) {
    timer = new Date();

    var g = new Game(target, STEP, REVEAL_LETTERS, LETTER_LOOSENESS);
    g.on('tick', function() {
        chat.say(g.toString());
      });
    g.on('timeout', function() {
        chat.say("The answer was " + g.target);
      });
    g.on('stop', function() { endGame(true); });

    chat.on('message', function(msg, usr, uid) {
        if (uid == chat.userId || !chat.settled) { return; }
        if (g.tryMatch(msg)) {
          var sec = Math.round((new  Date()-timer)*100)/100000,
              secPerLtr = Math.round(sec/g.numLetters*100)/100;
          chat.say("YOU WIN, "+usr+"! the answer was '"+target+"'"+
              " You got it in "+sec+" sec! (that's "+secPerLtr+" sec/letter)");
          g.stop();
        }
      });
    g.start();

    chat.say("Fill in the rest of lyric:", function() {
      chat.say(g.toString());
    });
  }


  // these functions are for getting things started.
  function waitForUsers(target, firstUser) {
    // wait for users to say yes
    var needed = Math.floor(countNotAfk()*VOTE_START_FACTOR);
    chat.say("WHO WANTS HANGMAN? Say 'yes' if you want to play; we'll start when we have "+needed+" people (debug: i see "+countNotAfk()+" not-afk fellas here)");
    var wantingToPlay = {};
    wantingToPlay[firstUser] = true;
    needed--;
    var messageHandler;
    var nobodyWantsToPlay = setTimeout(function() {
        // nobody wanted to try
        chat.removeListener('message', messageHandler);
        chat.say("we needed "+needed+" more; maybe later");
        endGame(false);
      }, VOTE_TIMEOUT_PER_USER*1000*countNotAfk());
    messageHandler = function(msg, user, uid) {
      if (!chat.settled || uid == chat.userId) { return; }
      // Wait for people to say 'yes'
      if (!(user in wantingToPlay) &&
         (msg.match(/yes/i) ||
          msg.match(/yeah/i) ||
          msg.match(/totally/i) ||
          msg.match(/activate/i) ||
          msg.match(/yse/i) ||
          msg.match(/sey/i) ||
          msg.match(/sye/i) ||
          msg.match(/\bo[. ]*k\b/i) ||
          msg.match(/sure/i) ||
          msg.match(/\bme\b/i) ||
          msg.match(/why not/i) ||
          msg.match(/play/i) ||
          msg.match(/i.?m in/i))) {
        needed--;
        wantingToPlay[user] = true;
        console.log(wantingToPlay);
        console.log("need "+needed+" more");
      }
      if (needed<=0) {
        chat.removeListener('message', messageHandler);
        chat.say("OK, let's go. Fill in the rest of the lyric when you know what it is.");
        clearTimeout(nobodyWantsToPlay);
        setTimeout(function() {
            startHangman(target);
          }, 3000);
      }
    };
    chat.on('message', messageHandler);
  }

  function tryHangman(target, firstUser) {
    if (hangmanMode) { return; }
    hangmanMode = true;
    // lock chat, begin
    chat.messagePollInterval = 500;
    chat.resetTimers();
    pluginGlue.lock(); // LOCK !!!!!

    // ask if there are any objections
    if (countNotAfk()>=VOTE_THRESHHOLD) {
      waitForUsers(target, firstUser);
    } else {
      // only two people? sure, go for it
      startHangman(target);
    }
  }


  chat.on('message', function(msg, usr, uid) {
      if (uid == chat.userId || !chat.settled) { return; }
      if (msg.match(/lurker/i) && msg.match(/hang/i) && msg.match(/man/i)) {

        lyricPicker.withRandomLyric(function(lyric) {
            tryHangman(lyric, usr);
          });
        
      }
    });

};


