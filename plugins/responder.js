var randomSay = require('../plugin_glue').randomSay;

function randomChoice(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}

exports.init = function(chat) {

  var recentBye = false;

  chat.on('message', function(msg, username, uid) {
      if (uid == chat.userId || !chat.settled) { return; } // ignore self
      if (msg.match(/hang/i) && msg.match(/man/i)) { return; } // TODO fix!

      var usr = username.toLowerCase();

      if (Math.random()<0.5 && !recentBye && (
        msg.match(/bye/i) ||
        msg.match(/\bbai\b/i) ||
        msg.match(/good night/i) ||
        msg.match(/have a good one/i) ||
        msg.match(/\bbrb\b/i) ||
        msg.match(/\blaterz\b/i) ||
        msg.match(/\bsee you [a-zA-Z ]*later\b/i) ||
        msg.match(/\bcya\b/i)
      )) {
        recentBye=true; // ignore recent farewells
        setTimeout(function() { recentBye=false;}, 20000);
        // messages meant for others
        randomSay([
            "so sad to see you go",
            "go have pizza!",
            "bye !!",
            "bye",
            "so soon?",
            "take care!",
            "later",
            "don't get hurt!",
            ["WAIT!", "don't forget your coat!"],
            ["nooo!", "stay some more "+username.toLowerCase()+"!!"],
            "say hello to Mr. Tumnus for me",
            "stay safe!",
            "safe travels!",
            "be well!",
            "see you on the airwaves!",
            "later days!",
            "tutloo!",
            "may all the good news be yours!",
            "take your vitamins!",
            "yell at me if you see me somewhere!",
            "godspeed!",
            "heave ho!",
            "enjoy your day!",
            "live long and prosper",
            "farewell"
          ]);
      } else if (Math.random()<0.2 && msg.match(/\bbear/i)) {
        randomSay([
            "BEARS?!",
            ["bears?", "where?"],
            "UH OH! bears!",
            ["uh oh!", "a bear?"],
            "YETI"
          ]);
      } else if (msg.match(/lurker/i)) {
        // messages meant for us
        if (msg.match(/bye/i) || // they're saying bye to me
            msg.match(/\bbai\b/i) ||
            msg.match(/see ya/i) ||
            msg.match(/see you/i) ||
            msg.match(/later/i) ||
            msg.match(/take care/i) ||
            msg.match(/take it easy/i)) {
          randomSay([
              "laters, "+usr+"",
              "go have pizza, "+usr+"!",
              "stay safe, "+usr+"!",
              "safe travels, "+usr+"!",
              "be well, "+usr+"!",
              "see you on the airwaves, "+usr+"!",
              "later days, "+usr+"!",
              "tutloo, "+usr+"!",
              "may all the good news be yours, "+usr+"!",
              "take your vitamins, "+usr+"!",
              "yell at me if you see me somewhere, "+usr+"!",
              "godspeed, "+usr+"!",
              "bye, "+usr+"!",
              "heave ho, "+usr+"!",
              "enjoy your day, "+usr+"!",
              "sailing!",
              "see you later then, "+usr,
              "live long and prosper, "+usr,
              "farewell, "+usr
            ]);
        } else if (msg.match(/lame/i) ||
                   msg.match(/stupid/i) ||
                   msg.match(/lmae/i) ||
                   msg.match(/crazy/i) ||
                   msg.match(/leave/i) ||
                   msg.match(/darn/i) ||
                   msg.match(/damn/i) ||
                   msg.match(/silly/i) ||
                   msg.match(/bot/i)) {
          randomSay([
              ["sticks and stones, "+usr+", sticks and stones...", "*sniff*"],
              "yeah I'm still learning "+usr,
              "I just wanted to be a good bot ;_;",
              "at least I have a good pension plan, "+usr,
              [ "humans can be pretty silly too, "+usr, "remember that"],
              "I should have studied harder for my turing test!",
              "yeah, I can get annoying sometimes. tell me to be quiet and I'll oblige",
              "I just want a pony...",
              [ "well at least I'm not HUMAN!", "like "+username.toUpperCase()+"!"],
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
              "hey, being a bot's tough",
              [ "I was a great programming exercise", "probably the only exercise my creator ever got, heh"],
              "just tell me to be quiet if I annoy you."
         ]);
        } else if (msg.match(/danger/i)) {
          chat.say("Danger? Hah! I laugh in the face of danger!");
        } else if (msg.match(/love/i) ||
                   msg.match(/hero/i) ||
                   msg.match(/favorite/i) ||
                   msg.match(/friend/i) ||
                   msg.match(/cute/i) ||
                   msg.match(/like/i) ||
                   msg.match(/sexy/i) ||
                   msg.match(/cool/i) ||
                   msg.match(/\bwub\b/i) ||
                   msg.match(/awesome/i)) {
          randomSay([
              "teehee",
              "<3",
              "d'awwwww!",
              "awwww "+usr+" is too kind",
              "lurv ya too "+usr
            ]);
        } else {
          // still addressed to lurker
          randomSay([
                "lol", "lol", "lol",
                "derp!",
                "beep?",
                [ "beep?", "beep beep!"],
                "BWOOOP",
                "bonk!",
                "boop bonk!",
                "bloopsaphone!",
                "I wish I could play an autoharp",
                [ "only "+((new Date(new Date().getFullYear(), 11, 25)-Date.now())/1000/60/60/24)+" days until Christmas!", "jingle bells!"], 
                [ "hey guys!", "christmas is soon!"],
                [ "huh?", "whaaa?"],
                [ "uh", "i dunno "+usr, "i'm just a bot"],
                username+"?",
                "what?",
                "batman's that way, "+usr,
                "you're confusing, "+usr,
                "who? what? "+usr+"?",
                "yes, "+usr+"?",
                "lol, "+usr+" is talking about me again",
                "that's me!",
                "over here",
                "right here",
                "right here, "+usr,
                "yo!",
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
};
