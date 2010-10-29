var Game = require('./game').Game,
    pluginGlue = require('../../plugin_glue');

/*exports.init = function(chat) {

  chat.on('message', function(msg, uname, uid) {
      if (uid==chat.uid || !chat.settled) { return; }


    });

};*/

var timer = null;
exports.init = function(chat ) {

  function endGame() {
    // unlock chat, reset back to where we were
    pluginGlue.unlock();
    chat.messagePollInterval = 3000;
    chat.resetTimers();
    console.log(new Date() - timer);
  }

  function initHangman(target) {
    // lock chat, begin
    chat.messagePollInterval = 300;
    chat.resetTimers();
    pluginGlue.lock(); // LOCK !!!!!

    timer = new Date();

    var g = new Game(target, 10000, 3);

    g.on('tick', function() {
        console.log(g.toString());
        chat.say(g.toString());
      });

    g.on('timeout', function() {
        chat.say("The answer was " + g.target);
      });

    g.on('stop', function() { endGame(); });

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

    chat.say("Guess the lyric: "+g.toString());

  }


  chat.on('message', function(msg, usr, uid) {
      if (uid == chat.userId || !chat.settled) { return; }
      if (msg.match(/lurker/i) && msg.match(/hang/i) && msg.match(/man/i)) {
        //initHangman("Haven't you seen the queen of the castle"); // upper
        //limit
        //initHangman("Is there music muted playing underneath?");
        //initHangman("Please excuse me, I'm not thinking clear");
        //initHangman("Give me a second go! Don't let me go alone!");
        //initHangman("We had a rocket that fell out of orbit");
        //initHangman("Once in a while, I act like a child to feel like a kid again");
        //initHangman("The sun is always gonna rise up");
        //initHangman("Take me river! Carry me far!");
      }
    });

};



