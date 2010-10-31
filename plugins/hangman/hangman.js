/*jslint regexp: false */
var Game = require('./game').Game,
    pluginGlue = require('../../plugin_glue'),
    randomSay = pluginGlue.randomSay,
    lyricPicker = require('./lyric_picker'),
    winner = require('./winner'),

    AFK_THRESHHOLD = 3,        // minutes
    STEP = 10000,              // ms
    REVEAL_LETTERS = 3,        // how many to reveal at a time
    LETTER_LOOSENESS = 3,      // answer accepted if it's in this tolerance
    VOTE_START_FACTOR = 0.5,   // need this many times number of users to start
    VOTE_THRESHHOLD = 4,       // if there are >= this many active users, a vote is needed
    VOTE_TIMEOUT_PER_USER = 5; // voting times out in this*user count seconds

function randomChoice(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}

var timer = null,
    againTimeout = null,
    hangmanMode = false;  // this prevents doubles

exports.init = function(chat ) {

  // beginning and ending the game
  function countNotAfk() {
    // count the users that typed things in the last AFK_THRESHHOLD minutes
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

  function endGame() {
    console.log("endGame called");
    // unlock chat, reset back to where we were
    pluginGlue.unlock();
    chat.messagePollInterval = 3000;
    chat.resetTimers();
    hangmanMode = false;
  }

  function startHangman(target) {
    timer = new Date();

    console.log("game starting");

    var g = new Game(target, STEP, REVEAL_LETTERS, LETTER_LOOSENESS);
    g.on('tick', function() {
        chat.say(g.toString());
      });
    g.on('timeout', function() {
        chat.say("The answer was " + g.target);
      });
    g.on('stop', function() { console.log("game stopped"); endGame(); });

    chat.on('message', function(msg, usr, uid) {
        if (uid == chat.userId || !chat.settled) { return; }
        if (g.tryMatch(msg)) {
          var sec = Math.round((new  Date()-timer)*100)/100000,
              secPerLtr = Math.round(sec/g.numLetters*100)/100,
              usrUp = usr.toUpperCase();
          chat.say(randomChoice([
                "YOU WIN, "+usrUp+"!",
                usrUp+" WON!",
                "This time, "+usr+" won!",
                "GOOD JOB "+usrUp
              ])+
            " The answer was '"+target+"' You got it in "+sec+" sec! (that's "+secPerLtr+" sec/letter)");
          g.stop();
          winner.won(chat, usr, countNotAfk());
        }
      });
    g.start();

    chat.say("Fill in the rest of lyric:", function() {
      chat.say(g.toString());
    });
  }


  // these functions are for getting things started.
  function waitForUsers(target, firstUser) {
    console.log("waitForUsers");
    // wait for a bit for users to say yes
    var needed = Math.floor(countNotAfk()*VOTE_START_FACTOR),
        people = needed + (needed==1?" person":" people");
    console.log(countNotAfk()+" not-afk users");
    chat.say("[b]"+randomChoice([
          "WHO WANTS HANGMAN? we need "+people,
          "anyone up for a fine ol' game of Guess the Lyric? we want "+people,
          "hangman anybody? i'll wait until we have "+people
        ]) + "[/b] (say 'yes' if you want to play)");
    var wantingToPlay = {};
    wantingToPlay[firstUser] = true;
    needed--;
    var messageHandler;
    var nobodyWantsToPlay = setTimeout(function() {
        // nobody wanted to try
        console.log("nobody wants to play");
        chat.removeListener('message', messageHandler);
        chat.say("we needed "+needed+" more; maybe later");
        endGame();
      }, VOTE_TIMEOUT_PER_USER*1000*countNotAfk());
    messageHandler = function(msg, user, uid) {
      if (!chat.settled || uid == chat.userId) { return; }
      console.log("messageHandler");
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
        console.log("all ready");
        chat.removeListener('message', messageHandler);
        chat.say(randomChoice([
              "OK, let's go.",
              "Sure, we'll begin.",
              "Shall we begin?",
              "Hangman time!",
              "Here we go!",
              "Here it comes!",
              "And we're off!",
              "Ok, we'll start in a moment.",
              "POWER UP! POWER UP!",
              "PREPARE YOURSELVES!",
              "GET READY",
              "GET READY TO RUMBLE!",
              "INCOMING!"
            ])+" Fill in the rest of the lyric when you know what it is.",
          function(){ winner.announce(chat, countNotAfk());});
        clearTimeout(nobodyWantsToPlay);
        setTimeout(function() {
            startHangman(target);
          }, 5000);
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
    console.log(" have "+countNotAfk()+" users");
    if (countNotAfk()>=VOTE_THRESHHOLD) {
      waitForUsers(target, firstUser);
    } else {
      // only two people? sure, go for it
      startHangman(target);
    }
  }

  // chat trigger
  chat.on('message', function(msg, usr, uid) {
      if (uid == chat.userId || !chat.settled) { return; }
      if (msg.match(/lurker/i) &&
        ((msg.match(/hang/i) && msg.match(/man/i)) ||
          msg.match(/guess/i) && msg.match(/lyric/i))) {

        lyricPicker.withRandomLyric(function(lyric) {
            tryHangman(lyric, usr);
          });
        
      }
    });

};


