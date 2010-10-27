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
      chat.on('message', function(msg, username) {

          if (msg.match(/lurker/i) && Math.random()>0.2) {
            randomSay(chat, [
                  "lol",
                  "lol",
                  "lol",
                  "beep?",
                  [ "beep?", "beep beep!"],
                  [ "huh?", "whaaa?"],
                  [ "uh", "i dunno "+username.toLowerCase(), "i'm just a bot"],
                  username+"?",
                  "what?",
                  "you're confusing, "+username.toLowerCase(),
                  "who? what? "+username.toLowerCase()+"?",
                  "yes, "+username.toLowerCase()+"?",
                  "lol, "+username.toLowerCase()+" is talking about me again",
                  "that's me!",
                  "over here",
                  "uh... yes?",
                  "i don't know what you just said because I was thinking of batman!",
                  "are you trying to tell me something?",
                  "am I a bear?",
                  "YETIS! help",
                  "hmm?",
                  "...",
                  "sorry, can't talk; zombies!",
                  "uh oh, you found me",
                  "OH NO! a bear behind you, "+username.toLowerCase()+"!!",
                  "i don't know, i'm just a bot",
                  "i'm just a bot"
                ]);
          }

        });
    });
};
