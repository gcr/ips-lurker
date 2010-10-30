/*jslint regexp: false */
var Game = require('./game').Game,
    pluginGlue = require('../../plugin_glue'),
    randomSay = pluginGlue.randomSay;

var timer = null;
exports.init = function(chat ) {

  function endGame() {
    // unlock chat, reset back to where we were
    pluginGlue.unlock();
    chat.messagePollInterval = 3000;
    chat.resetTimers();
  }

  function startHangman(target) {
    timer = new Date();

    var g = new Game(target, 10000, 3, 5);

    g.on('tick', function() {
        chat.say(g.toString());
      });

    g.on('timeout', function() {
        chat.say("The answer was " + g.target);
      });

    g.on('stop', function() { console.log("OMG"); endGame(); });

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

    chat.say("Fill in the rest of this lyric:", function() {
      chat.say(g.toString());
    });
  }


  // these functions are for getting things started.
  function waitForUsers(target, firstUser) {
    // wait for users to say yes
    var needed = Math.ceil(chat.userCount/2);
    chat.say("WHO WANTS HANGMAN? Say 'yes' if you want to play; we'll start when we have "+needed+" people");
    var wantingToPlay = {};
    wantingToPlay[firstUser] = true;
    needed--;
    var messageHandler;
    var nobodyWantsToPlay = setTimeout(function() {
        // nobody wanted to try
        chat.removeListener('message', messageHandler);
        chat.say("we needed "+needed+" more; maybe later");
        endGame();
      }, 25000);
    messageHandler = function(msg, user, uid) {
      if (!chat.settled || uid == chat.userId) { return; }
      // Wait for people to say 'yes'
      if (!(user in wantingToPlay) && (msg.match(/yes/i) ||
          msg.match(/yeah/i) ||
          msg.match(/sure/i) ||
          msg.match(/i.?m in/i))) {
        needed--;
        wantingToPlay[user] = true;
        console.log(wantingToPlay);
        console.log("need "+needed+" more");
      }
      if (needed<=0) {
        chat.removeListener('message', messageHandler);
        chat.say("OK, let's go");
        clearTimeout(nobodyWantsToPlay);
        setTimeout(function() {
            startHangman(target);
          }, 3000);
      }
    };
    chat.on('message', messageHandler);
  }

  function tryHangman(target, firstUser) {
    // lock chat, begin
    chat.messagePollInterval = 500;
    chat.resetTimers();
    pluginGlue.lock(); // LOCK !!!!!

    // ask if there are any objections
    if (chat.userCount>=4) {
      waitForUsers(target, firstUser);
    } else {
      // only two people? sure, go for it
      startHangman(target);
    }
  }


  chat.on('message', function(msg, usr, uid) {
      if (uid == chat.userId || !chat.settled) { return; }
      if (msg.match(/lurker/i) && msg.match(/hang/i) && msg.match(/man/i)) {
        //tryHangman("Haven't you seen the queen of the castle", usr); // upper
        //tryHangman("Is there music muted playing underneath?", usr);
        //tryHangman("Please excuse me, I'm not thinking clear", usr);
        //tryHangman("Give me a second go! Don't let me go alone!", usr);
        //tryHangman("We had a rocket that fell out of orbit", usr);
        //tryHangman("Once in a while, I act like a child to feel like a kid again", usr);
        //tryHangman("The sun is always gonna rise up", usr);
        //tryHangman("All accross cities, I see buildings turn into tiles", usr);

        //tryHangman("Love me even if I'm a mess", usr);
        //tryHangman("Seems somebody put out the moon", usr);
        //tryHangman("I can't follow the way she moves", usr);
        //tryHangman("I can't see past the shadows", usr);
        tryHangman("Kiss me if you're mad at mommy", usr);
        //tryHangman("When you're gone, will I lose control?", usr);
        
      }
    });

};


