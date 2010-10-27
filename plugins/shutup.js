function randomChoice(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}

function randomSay(chat, sayings) {
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
}


exports.init = function(chat) {
  chat.on('settled', function() {
      chat.on('message', function(msg, username, uid) {

          if (msg.match(/lurker/i) && uid != chat.userId && (
              msg.match(/shut up/i) ||
              msg.match(/go away/i) ||
              msg.match(/hate/i) ||
              msg.match(/log off/i) ||
              msg.match(/turn off/i) ||
              msg.match(/get lost/i) ||
              msg.match(/quiet/i) ||
              msg.match(/scram/i) ||
              msg.match(/fuck you/i) ||
              msg.match(/fuckin/i) ||
              msg.match(/hush/i) ||
              msg.match(/annoying/i) ||
              msg.match(/you suck/i) ||
              msg.match(/you stink/i)
              )) {
            chat.say(randomChoice([
                username.toLowercase()+": fine, sorry, I'll be quiet",
                username.toLowercase()+": oops ok, bye",
                username.toLowercase()+": your wish is my command, see ya",
                username.toLowercase()+": bye then, sorry",
                username.toLowercase()+": I'll quit, see ya",
                username.toLowercase()+": I'll be quiet, see ya",
                username.toLowercase()+": ok I'll get out of your hair",
                username.toLowercase()+": that's OK I use up too much bandwidth anyways, take care bye",
                username.toLowercase()+": guess I still have a ways to go, take care",
                "take care",
                "THANK YOU HUMAN FOR constructive feed back TAKE IT EASY NOW",
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
                "oh no my server is dying help",
                username.toLowercase()+": sorry for being so rude, take care",
                username.toLowercase()+": sorry for being so annoying, see ya",
                username.toLowercase()+": sorry, I'm still learning, I'll log off",
                username.toLowercase()+": oh noes, bye",
                "critical error: resource unwanted",
                "critical error: resource unwanted",
                "critical error: resource unwanted",
                "critical error: resource unwanted",
                "the humans hate me! why can't I be a good bot!!! see ya next time"
                ]),
                function() {
                  process.exit(1);
                }
              );
            }
        });
    });
};
