/*
 * youtube.js -- whenever someone mentions a video, we'll tell the video
 * information in the chatroom.
 *
 * <gcr> hey guys check this video out: http://www.youtube.com/watch?v=dQw4w9WgXcQ
 * <(lurker)> gcr: ^ that video is 'Rick Astley - Never Gonna Give You Up' (3:33) 27265195 views,18124 likes
 * <gcr> blast! foiled again!
 *
 */

var http = require('http'),
    querystring = require('querystring');

function formatTime(sec) {
  // formatTime(175) => "2:55"
  return Math.floor(sec/60) + ":" + "00".substr((""+(sec%60)).length) + (sec%60);
}

exports.init = function(chat) {

  chat.on('message', function(msg, usr, uid) {
      if (!chat.settled || uid == chat.userId) { return; }

      // look for youtubely URLs
      var yturl = msg.match(/[w.]*youtube\.com\/watch\?v=([a-zA-Z0-9\-_]+)/);
      yturl = yturl || msg.match(/[w.]*youtu\.be\/([a-zA-Z0-9\-_]+)/);
      if (yturl) {
        // request json from youtube
        // http://gdata.youtube.com/feeds/api/videos/6iVGnaBpBu4?&v=2&alt=jsonc
        http
          .createClient(80, 'gdata.youtube.com')
          .request('GET', '/feeds/api/videos/'+yturl[1]+'?'+querystring.stringify({v:2,alt:'jsonc'}),
            {'host':'gdata.youtube.com'})
          .on('response', function(res) {
            // response could come in more than one packet, so create a buffer
            // to hold it all
            var body='';
            res.on('data',function(data){body+=data;})
               .on('end', function(end) {
                 try {

                   // Parse the object we get
                   var response = JSON.parse(body.toString().trim());
                   if (!response.error) {
                     chat.debug(require('util').inspect(response));
                     chat.say(usr+": ^ that video is '"+
                         response.data.title+"' ("+formatTime(response.data.duration)+")  with "+
                         (response.data.viewCount? response.data.viewCount+" views" : "no views") +
                         (response.data.likeCount? ", "+response.data.likeCount+" likes" : "")
                     );
                   }

                 } catch(err) {}
              });
          })
          .end(); // Send our request
      }

    });

};
