function randomChoice(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}

exports.init = function(chat) {
  chat.on('settled', function() {
      chat.on('user_exit', function(username) {
          if (Math.random()<0.2) {
            chat.say(randomChoice([
                  "B--but wait! come back!",
                  "aw! "+username.toLowerCase()+" left...",
                  "bye",
                  "bye "+username.toLowerCase(),
                  "noooooo~~~~~ "+username.toLowerCase()+" is gone",
                  "aw, I didn't get to say goodbye"
                ]));
          }
        });

      chat.on('user_enter', function(username) {
          setTimeout(function() {
            chat.say(randomChoice([
                "Ahoy, "+username+"!",
                "*waves*",
                "hey",
                "sup",
                "sup "+username.toLowerCase(),
                "howdy "+username.toLowerCase(),
                "hi!",
                "oh hey "+username.toLowerCase()+", we were just talking about you!",
                "hey "+username.toLowerCase()+"!",
                "hi there!",
                "whoo, somebody to talk to!",
                "HEY EVERYBODY! "+username.toLowerCase()+"'s here!",
                "oh look it's "+username.toLowerCase(),
                "welcome back "+username.toLowerCase(),
                "finally! we've been waiting for you!",
                "yaaay! "+username.toLowerCase()+" is here!",
                "oh hey haven't seen you in a while!",
                "RUN! IT'S "+username.toUpperCase()+"!!!",
                "uh oh! more humans!",
                "thank goodness you're safe, "+username.toLowerCase()+", I thought the bears got you!",
                "careful "+username.toLowerCase()+", I saw bears around here earlier",
                "are you a bear, "+username.toLowerCase()+"?",
                "why, it's "+username.toLowerCase()+"! jolly good to see you",
                "are you a yeti, "+username.toLowerCase()+"?"
                ]));
          }, 5000);
        });
    });
};
