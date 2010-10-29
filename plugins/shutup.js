/*jslint regexp:false */
var randomSay = require('../plugin_glue').randomSay;

function randomChoice(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}

var timeout = 3,
    left = false;
exports.init = function(chat) {
  // exponential backoff
  function restorePower() {
    left = false;
    chat.say = chat.oldsay;
    console.log("   * Started talking again");
  }
  function powerOff() {
    // todo: really leave somehow
    console.log("   * Stopped talking");
    left = true;
    chat.oldsay = chat.say;
    chat.say = function(msg) {console.log("   * Suppressed "+msg);};
    setTimeout(restorePower, 60*1000*timeout);
    timeout = Math.min(timeout * 4,60);
  }
  setInterval(function() {
      if (!left) {
        console.log("*** decay",timeout);
        timeout = Math.max(3, Math.round(timeout*75)/100);
        console.log("*** now",timeout);
      }
    }, 2*60*1000);

  chat.on('message', function(msg, username, uid) {
      if (uid == chat.userId || !chat.settled) { return; }
      if (msg.match(/candy/i) && msg.match(/yam/i)) {
            // seekrit codes
            restorePower();
            randomSay([
                "candy? yams? YUM!",
                "zzzzzz---mmmf? wha?",
                "it's-a me!",
                "whaat? candy?",
                "ONOES A BEAR! hide me",
                "lolololol",
                "yams!",
                "ow! hey! I have enough iron in my diet!",
                "wha? who?",
                "hi guys",
                "you rang?",
                "i've been summoned!",
                ["what? who?", "where am I?"],
                "onoes!",
                "GOTHAM NEEDS ME?!",
                "I'll be right there!"
              ]);
      } else if (!left && msg.match(/lurker/i) && (
          msg.match(/shut up/i) ||
          msg.match(/go away/i) ||
          msg.match(/go home/i) ||
          msg.match(/go [a-zA-Z ]*sleep/i) ||
          msg.match(/hate/i) ||
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
               "minute"+(Math.round(timeout)==1?"":"s")+")",
            powerOff
          );
        }
    });
};
