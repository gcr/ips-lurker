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
      chat.on('user_exit', function(username) {
          if (Math.random()<0.2) {
            randomSay(chat, [
                  "B--but wait! come back!",
                  "aw! "+username.toLowerCase()+" left...",
                  "bye",
                  "poof!",
                  ["see ya", "he's gone"],
                  "bye "+username.toLowerCase(),
                  "noooooo~~~~~ "+username.toLowerCase()+" is gone",
                  "aw, I didn't get to say goodbye"
                ]);
          }
        });

      chat.on('user_enter', function(username) {
          setTimeout(function() {
            randomSay(chat, [
                "*waves*",
                "hey",
                "Heeyyyyy",
                "hallo",
                "sup",
                "howdy "+username.toLowerCase(),
                "hi!",
                "hey "+username.toLowerCase()+"!",
                "hi there!",
                "whoo, somebody to talk to!",
                "oh look it's "+username.toLowerCase(),
                "welcome back "+username.toLowerCase(),
                "yaaay! "+username.toLowerCase()+" is here!",
                "oh hey haven't seen you in a while!",
                "RUN! IT'S "+username.toUpperCase()+"!!!",
                "uh oh! more humans!",
                "thank goodness you're safe, "+username.toLowerCase()+", I thought the bears got you!",
                "careful "+username.toLowerCase()+", I saw bears around here earlier",
                "are you a yeti, "+username.toLowerCase()+"?",
                "uh oh, sherrif's in town!",

                [ "HEY EVERYBODY! "+username.toLowerCase()+"'s here!",
                  "the party can begin now!"],
                [ "hey look, it's jbug!",
                  "wait, that's not jbug!",
                  "oh hi "+username.toLowerCase()+" i thought you were jbug, heh"],
                [ "Ahoy, "+username+"!", "How are things going?"],
                [ "Arrrgh, it be "+username+", sailin' the high seas again, arrr.",
                  "Got any treasure for ol' lurker now, arr?" ],
                [ "sup "+username.toLowerCase(),
                  "how's it goin?" ],
                [ "oh hey "+username.toLowerCase(),
                  "we were just talking about you!" ],
                [ "finally! we've been waiting for you!",
                  "where have you been?!" ],
                [ "are you Lights in disguise, "+username.toLowerCase()+"?",
                  "hey maybe "+username.toLowerCase()+" is lights in disguise!",
                  "sshhhhh! i won't tell, "+username.toLowerCase()+"!",
                  "your secret is safe with me ;)"],
                [ "got your boots on, "+username.toLowerCase()+"?",
                  "i hear winter's mighty chilly without them!"],
                [ "are you a bear, "+username.toLowerCase()+"?",
                  "I think "+username.toLowerCase()+" is a bear",
                  "or maybe a yeti.",
                  "hmmmm."],
                [ "are you a bear, "+username.toLowerCase()+"?",
                  "I think "+username.toLowerCase()+" is a bear"],
                [ "are you a bear, "+username.toLowerCase()+"?",
                  "you sure SEEM like a bear"],
                [ "why, it's "+username.toLowerCase()+"!",
                  "jolly good to see you"],
                [ "BEAR!",
                  "oh no wait it's just you" ],
                [ "BEAR!",
                  "oh no wait it's just you",
                  "hi "+username.toLowerCase() ]
                ]);
          }, 5000);
        });
    });
};
