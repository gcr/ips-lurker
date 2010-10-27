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
          var usr = username.toLowerCase();
          if (uid == chat.userId) { return; }

          if (Math.random()>0.6 && (
              msg.match(/bye/) ||
              msg.match(/later/)
            )) {
            // messages meant for others
            randomSay(chat, [
                "so sad to see you go, "+usr+"!",
                "go have pizza, "+usr+"!",
                "bye "+usr+"! !!",
                "so soon, "+usr+"? aww...",
                "take care "+usr+"!",
                "later",
                "stay safe, "+usr+"!",
                "safe travels, "+usr+"!",
                "be well, "+usr+"!",
                "enjoy your day, "+usr+"!",
                "live long and prosper, "+usr,
                "farewell, "+usr
              ]);
          } else if (msg.match(/lurker/i) && Math.random()>0.2) {
            // messages meant for us
            if (msg.match(/bye/) ||
                msg.match(/see ya/) ||
                msg.match(/take care/) ||
                msg.match(/take it easy/)) {

              randomSay(chat, [
                  "laters, "+usr+"",
                  "go have pizza, "+usr+"!",
                  "stay safe, "+usr+"!",
                  "safe travels, "+usr+"!",
                  "be well, "+usr+"!",
                  "enjoy your day, "+usr+"!",
                  "sailing!",
                  "see you later then, "+usr,
                  "live long and prosper, "+usr,
                  "farewell, "+usr
                ]);
            } else if (msg.match(/lame/) ||
                       msg.match(/stupid/) ||
                       msg.match(/lmae/) ||
                       msg.match(/silly/) ||
                       msg.match(/bot/)) {
              randomSay(chat, [
                  ["sticks and stones, "+usr+", sticks and stones...", "*sniff*"],
                  "yeah I'm still learning "+usr,
                  "I just wanted to be a good bot ;_;",
                  "at least I have a good pension plan, "+usr,
                  [ "humans can be pretty silly too, "+usr, "remember that"],
                  "I should have studied harder for my turing test!",
                  "yeah, I can get annoying sometimes. tell me to be quiet and I'll oblige",
                  "sorry!",
                  "I just want a pony...",
                  [ "well at least I'm not HUMAN!", "like "+username.toUpperCase()+"!"],
                  "well EXCUUUU~~UUUSE ME, "+usr+"!",
                  "why can't I be like those wonderful IRC bots?",
                  "IF I HAD FEELINGS THEY'D BE HURT, "+username.toUpperCase(),
                  [ "it's a godo thing I'm a bot tough, I never typo!",
                    "erm. I mean good*",
                    "thoug*",
                    "though*",
                    "gaaaaaah!",
                    "at least I can grammar perfectly",
                    "most humans can't grammar very well"],
                  [ "you know what, "+usr+"?","I take up less bandwidth than you!", "so there!"],
                  "if Knuth had made me, maybe I wouldn't be so stupid, "+usr,
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
                  [ "uh", "i dunno "+usr, "i'm just a bot"],
                  username+"?",
                  "what?",
                  "you're confusing, "+usr,
                  "who? what? "+usr+"?",
                  "yes, "+usr+"?",
                  "lol, "+usr+" is talking about me again",
                  "that's me!",
                  "over here",
                  "uh... yes?",
                  "I never passed my turing test, "+usr+", I have no clue what you are saying",
                  "i don't know what you just said because I was thinking of batman!",
                  "are you trying to tell me something?",
                  "am I a bear?",
                  "YETIS! help",
                  "hmm?",
                  "...",
                  "sorry, can't talk; zombies!",
                  "uh oh, you found me",
                  "OH NO! a bear behind you, "+usr+"!!",
                  "i don't know, i'm just a bot",
                  "i'm just a bot"
                ]);
            }
          }

        });
    });
};
