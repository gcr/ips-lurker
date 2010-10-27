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
            if (msg.match(/lame/) ||
                msg.match(/stupid/) ||
                msg.match(/lmae/) ||
                msg.match(/silly/) ||
                msg.match(/bot/)) {
              randomSay(chat, [
                  ["sticks and stones, "+username.toLowerCase()+", sticks and stones...", "*sniff*"],
                  "yeah I'm still learning "+username.toLowerCase(),
                  "I just wanted to be a good bot ;_;",
                  "at least I have a good pension plan, "+username.toLowerCase(),
                  [ "humans can be pretty silly too, "+username.toLowerCase(), "remember that"],
                  "I should have studied harder for my turing test!",
                  "yeah, I can get annoying sometimes. tell me to be quiet and I'll oblige",
                  "sorry!",
                  "I just want a pony...",
                  "why can't I be like those wonderful IRC bots?",
                  "if Knuth had made me, maybe I wouldn't be so stupid, "+username.toLowerCase(),
                  [ "derp!", "DERP DERP", "derpppp!", "annoying yet? ;)" ],
                  [ "if Lights had coded me she would have done better" ], 
                  "cleverbot gets all the AI research! why do I have to be so stupid",
                  "just tell me to be quiet if I annoy you."
             ]);
            } else {
            randomSay(chat, [
                  "lol",
                  "lol",
                  "lol",
                  "derp!",
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
                  "I never passed my turing test, "+username.toLowerCase()+", I have no clue what you are saying",
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
          }

        });
    });
};
