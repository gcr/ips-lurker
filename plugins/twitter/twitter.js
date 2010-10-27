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
      if (twit.following.indexOf(tweet.user.id) != -1) {
        chat.say(randomChoice([
              "beep beep! ",
              "coming through everyone! ",
              "new update from the twitters! ",
              "you've got mail! ",
              "the twitters say ",
              "guess what? new twitters! ",
              "NEW TWITTERS everybody! ",
              "the twitters! ",
              "the twitters have spoken: ",
              "your twitters say: ",
              "twitter says: ",
              "this just in! ",
              "uh oh it's a ",
              "hey guys! ",
              "hey! ",
              "they say: ",
              "legend has it: ",
              "HEY EVERYONE your twitters are here! ",
              "BREAKING: ",
              "hey look guys ",
              "next up on twitter ball z: ",
              "what's this?",
              "beep! ",
              "RING RING! ",
              "wow! ",
              "", "", ""
            ]) + "[b]@"+tweet.user.screen_name+": " + tweet.text + "[/b]");
        console.log("@"+tweet.user.screen_name+": " + tweet.text);
      }

    })
    .on('end', function(resp) {
      console.log("wave goodbye... " + resp.statusCode);
      setTimeout(exports.init, 10000);
    })
    .stream();


    // twitter matching:
    // fetch user information when someone says @user in the chat.
    function twitterGetInfo(uname) {
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
                 chat.say(
                   'the twitters say that [b][url="http://twitter.com/'+uname+'"]@'+uname+"[/url][/b]"+
                   " is "+user.name+" with "+user.followers_count+" followers, "+user.statuses_count+" tweets."+
                   (user.status? 'Latest: "'+user.status.text+'"' : " Looks like a sneaksy private account.")
                 );
               }
            });
        })
        .end();
    }

    chat.on('settled', function(){
    chat.on('message', function(msg, sendername, senderId) {
        var match = /@([a-zA-Z0-9_]+)/g.exec(msg);
        if (match && senderId != chat.userId) {
          var uname = match[1];
          if (uname.length > 2) {
            // ask for the twitters
            twitterGetInfo(uname);
          }
        }
      });
  });

};
