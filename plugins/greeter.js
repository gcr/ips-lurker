var randomSay = require('../plugin_glue').randomSay;

function randomChoice(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}

exports.init = function(chat) {
  chat.on('user_exit', function(username) {
      if (!chat.settled) { return; }
      if (Math.random()<0.2) {
        randomSay([
              "B--but wait! come back!",
              "aw! "+username.toLowerCase()+" left...",
              "bye",
              "i'll miss you "+username.toLowerCase(),
              [ "so as I was saying, "+username.toLowerCase().substr(0,4)+"---", username+"?", "aw he's gone"],
              ["see ya", "he's gone"],
              "bye "+username.toLowerCase(),
              "noooooo~~~~~ "+username.toLowerCase()+" is gone",
              "aw, I didn't get to say goodbye"
            ]);
      }
    });

  chat.on('user_enter', function(username, uid) {
      if (uid == chat.uid || !chat.settled) { return; }
      var usr = username.toLowerCase();
      setTimeout(function() {
        randomSay([
            "*waves*",
            "hey",
            "Heeyyyyy",
            "hallo",
            "sup",
            "howdy "+usr,
            "hi!",
            "hey "+usr+"!",
            "hi there!",
            "whoo, somebody to talk to!",
            "oh look it's "+usr,
            "welcome back "+usr,
            "yaaay! "+usr+" is here!",
            "oh hey haven't seen you in a while!",
            "hey! "+usr+" decided to hang with the cool kids now! ;)",
            "you're family, "+usr+"!",
            "ah, good morrow, "+usr+".",
            "you're one of us now, "+usr+"!",
            "DOORBELL!",
            "you're a cool kid now, "+usr+"!",
            "doorbell rings! it's "+usr+" with the pizza!",
            "welcome to the clubhouse, "+usr+"!",
            "secret clubhouse opens for "+usr+"!",
            "the secret doors open and "+username.toUpperCase()+" ENTERS!",
            usr+" guessed the password!",
            usr+" knows the secret handshake!",
            "agent "+usr+" reporting in!",
            "at your command, "+usr+"!",
            "attention! "+usr+" arrived!",
            usr+" is one of us!",
            "long time no see, "+usr+"!",
            "RUN! IT'S "+username.toUpperCase()+"!!!",
            "uh oh! more humans!",
            "Ho thar squire",
            "a screech of tire, a swoosh of cape, it's "+usr+"!!",
            "thank goodness you're safe, "+usr+", I thought the bears got you!",
            "careful "+usr+", I saw bears around here earlier",
            "are you a yeti, "+usr+"?",
            "uh oh, sherrif's in town!",
            "howdy, sherriff!",
            "ooh, the evil mastermind appears!",
            "A wild "+usr+" appears!",

            [ "when suddenly "+username.toUpperCase()+" APPEARS OUT OF NOWHERE", "and surprises everyone!"],
            [ "it's a bird!", "it's a plane!", "it's "+username.toUpperCase()+"!"],
            [ "it's "+usr+"!", "*sniff* AND HE'S GOT PIZZA!", "can i have some pizza, "+usr+"?"],
            [ "happy to see us, "+usr+"?", "we're sure happy to see you!"],
            [ "HEY EVERYBODY! "+usr+"'s here!",
              "the party can begin now!"],
            [ "hey look, it's jbug!",
              "wait, that's not jbug!",
              "oh hi "+usr+" i thought you were jbug, heh"],
            [ "Ahoy, "+username+"!", "How are things going?"],
            [ "Arrrgh, it be "+username+", sailin' the high seas again, arrr.",
              "Got any treasure for ol' lurker now, arr?" ],
            [ "sup "+usr,
              "how's it goin?" ],
            [ "oh hey "+usr,
              "we were just talking about you!" ],
            [ "finally! we've been waiting for you!",
              "where have you been?!" ],
            [ "are you Lights in disguise, "+usr+"?",
              "hey maybe "+usr+" is lights in disguise!",
              "sshhhhh! i won't tell, "+usr+"!",
              "your secret is safe with me ;)"],
            [ "got your boots on, "+usr+"?",
              "i hear winter's mighty chilly without them!"],
            [ "why, it's "+usr+"!",
              "jolly good to see you"],
            [ "BEAR!",
              "oh no wait it's just you",
              "hi "+usr ]
            ]);
      }, 4000);
    });
};
