/*jslint regexp: false */
var Game = require('./game').Game,
    pluginGlue = require('../../plugin_glue'),
    countNotAfk = pluginGlue.countNotAfk,
    randomSay = pluginGlue.randomSay,
    lyricPicker = require('./lyric_picker'),
    winner = require('./winner'),

    AFK_THRESHHOLD = 3,        // minutes
    STEP = 10000,              // ms
    REVEAL_LETTERS = 2,        // how many to reveal at a time
    LETTER_LOOSENESS = 3,      // answer accepted if it's in this tolerance
    VOTE_START_FACTOR = 0.5,   // need this many times number of users to start
    VOTE_THRESHHOLD = 4,       // if there are >= this many active users, a vote is needed
    VOTE_TIMEOUT_PER_USER = 6; // voting times out in this*user count seconds

function randomChoice(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}

var timer = null,
    againTimeout = null;

exports.init = function(chat ) {

  // beginning and ending the game

  function endGame() {
    chat.debug("endGame called");
    // unlock chat, reset back to where we were
    pluginGlue.unlock();
    chat.messagePollInterval = 3000;
    chat.resetTimers();
  }

  function startHangman(target) {
    timer = new Date();

    chat.debug("game starting");

    var g = new Game(target, STEP, REVEAL_LETTERS, LETTER_LOOSENESS);
    g.on('tick', function() {
        chat.say(g.toString());
      });
    g.on('timeout', function() {
        chat.say("The answer was '"+g.target+"'");
      });
    g.on('stop', function() { chat.debug("game stopped"); endGame(); });

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
          winner.won(chat, usr, countNotAfk(AFK_THRESHHOLD), sec, secPerLtr);
        }
      });
    g.start();

    chat.say((winner.streak() >=3 && winner.champion() in chat.users?
        "Finish this lyric before "+winner.champion()+" does:" :
        "Finish this lyric before I do:"),
      function() {
        chat.say(g.toString());
      });
  }


  // chat trigger
  chat.on('message', function(msg, usr, uid) {
      if (uid == chat.userId || !chat.settled) { return; }
      if (msg.match(/lurker/i) &&
        ((msg.match(/hang/i) && msg.match(/man/i)) ||
          msg.match(/guess/i) && msg.match(/lyric/i))) {

        lyricPicker.withRandomLyric(chat, function(lyric) {
            if (!pluginGlue.lock()) { return; } // LOCK!!!
            // lock chat, begin
            chat.messagePollInterval = 500;
            chat.resetTimers();
            var needed = Math.floor(countNotAfk(AFK_THRESHHOLD)*VOTE_START_FACTOR),
                people = needed + (needed==1?" person":" people");
              chat.debug("have "+countNotAfk(AFK_THRESHHOLD)+" users, need "+needed+" to play");
              pluginGlue.vote(needed, AFK_THRESHHOLD, VOTE_THRESHHOLD, "[b]"+randomChoice([
                  "WHO WANTS GUESS THE LYRIC? we need "+people,
                  "anyone up for a fine ol' game of Guess the Lyric? we want "+people,
                  "Hey guys! Let's play guess the lyric! We need "+people,
                  "GUESS THE LYRIC! i'll wait for "+people,
                  "guess the lyric anybody? i'll wait until we have "+people
                ]) + "[/b] (say 'yes' if you want to play)",
                // timeout
                VOTE_TIMEOUT_PER_USER*countNotAfk(AFK_THRESHHOLD), usr,
                // success callback
                function start() {
                  chat.debug("all ready");
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
                        "WARNING: BOSS FIGHT COMMENCES",
                        "FINAL BOSS!",
                        "MISSILE LAUNCH DETECTED!",
                        "PREPARE YOURSELVES!",
                        "GET READY",
                        "GET READY TO RUMBLE!",
                        "INCOMING!"
                      ])+" Type the lyric when you know what it is.",
                    function(){ winner.announce(chat, countNotAfk(AFK_THRESHHOLD));});
                  setTimeout(function() {
                      startHangman(lyric);
                    }, 5000);
                },
                // timeout callback
                function nobodyWantedToPlay() {
                  chat.say("we needed "+needed+" more; maybe later");
                  endGame();
                });
          });
        
      }
    });

};


