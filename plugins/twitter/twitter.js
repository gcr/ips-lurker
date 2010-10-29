var http=require('http'),
    fs=require('fs'),
    twitter=require('./twitter-node/lib/twitter-node/index.js');

function randomChoice(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}

exports.init = function(chat) {
    var login = JSON.parse(fs.readFileSync('./passwd').toString().trim());
    var twit = new twitter.TwitterNode({
      user: login.user,
      password: login.pass,
      // curl 'http://api.twitter.com/1/users/show.json?screen_name=lights'
      follow: [//15147152, // _gcr
               16143507, // lights
               50838700  // jtb
              ]
    });

    twit.on('tweet', function(tweet) {
        console.log("    * @"+tweet.user.screen_name+": " + tweet.text);
        if (twit.following.indexOf(tweet.user.id) != -1) {
          chat.say(randomChoice([
                "beep beep! the twitters say ",
                "coming through! the twitters say ",
                "new update from the twitters! ",
                "you've got mail! ",
                "the twitters say ",
                "guess what? new twitters! ",
                "NEW TWITTERS everybody! ",
                "the twitters! ",
                "the twitters have spoken: ",
                "your twitters say: ",
                "from twitter: ",
                "this just in! the twitters: ",
                "hey guys! twitter says: ",
                "hey! twitters! ",
                "they say: ",
                "legend has it: ",
                "HEY EVERYONE your twitters are here! ",
                "BREAKING: ",
                "hey look guys ",
                "moar twitter ",
                "WARNING twitter activity detected: ",
                "next up on twitter ball z: ",
                "what's this? twitter!",
                "beep! ",
                "RING RING! twitter calling! ",
                "wow! twitter! ",
                "captain, we are being hailed! ",
                "ONSCREEN: ",
                "transmission from the twitters! ",
                "A BEAR! no wait just twitters: ",
                "", "", ""
              ]) + "[b]@"+tweet.user.screen_name+": " + tweet.text + "[/b]");
        }
      })
      .on('end', function(resp) {
        //chat.say("lost satellite uplink (tell blanky please)");
        console.log("\n\n\n** WARNING lost sattelite uplink\n\n");
        setTimeout(function() { twit.stream(); }, 10000);
      })
      .stream();

      // twitter matching:
      // fetch user information when someone says @user in the chat.
      function twitterGetInfo(uname, sender) {
        http
          .createClient(80, 'api.twitter.com')
          .request('GET', '/1/users/show/'+uname+'.json',
            {'host':'api.twitter.com'})
          .on('response', function(res) {
            var body='';
            res.on('data',function(data){body+=data;})
               .on('end', function(end) {
                 var user = JSON.parse(body.toString().trim());
                 if (!(user.error)) {
                   chat.say(sender+":"+
                     ' [b]@'+uname+'[/b]'+
                     ' [url="http://twitter.com/'+uname+'"](follow)[/url]'+
                     " is "+user.name+" with "+user.followers_count+" followers, "+user.statuses_count+" tweets."+
                     (user.status? ' Latest: "'+user.status.text+'"' : " Looks like a sneaksy private account.")
                   );
                 }
              });
          })
          .end();
      }

      chat.on('message', function(msg, sendername, senderId) {
          if (senderId==chat.userId || !chat.settled) { return; }

          var match = /@([a-zA-Z0-9_]+)/g.exec(msg);
          if (match && msg.indexOf('@lurker') == -1) {
            var uname = match[1];
            if (uname.length > 2) {
              // ask for the twitters
              twitterGetInfo(uname, sendername);
            }
          }
        });

};
