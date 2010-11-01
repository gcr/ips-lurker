/*
 * youtube.js -- whenever someone mentions a video, we'll save the video
 * information
 */

var http = require('http'),
    querystring = require('querystring');

function formatTime(sec) {
  // formatTime(175) => "2:55"
  return (
    Math.floor(sec/60) + ":" + (sec%60)
  );
}

exports.init = function(chat) {

  chat.on('message', function(msg, usr, uid) {
      if (!chat.settled || uid == chat.userId) { return; }

      var yturl = msg.match(/[w.]*youtube\.com\/watch\?v=([a-zA-Z0-9]+)/);
      if (yturl) {
        // http://gdata.youtube.com/feeds/api/videos/6iVGnaBpBu4?&v=2&alt=jsonc
        http
          .createClient(80, 'gdata.youtube.com')
          .request('GET', '/feeds/api/videos/'+yturl[1]+'?'+querystring.stringify({
                v: 2,
                alt: 'jsonc'
              }),
            {'host':'gdata.youtube.com'})
          .on('response', function(res) {
            var body='';
            res.on('data',function(data){body+=data;})
               .on('end', function(end) {
                 var response = JSON.parse(body.toString().trim());
                 console.log(require('util').inspect(response));
                 chat.say(
                   usr+": ^ that video is '"+response.data.title+"' ("+formatTime(response.data.duration)+") "+
                     response.data.viewCount+" views"
                 );
              });
          })
          .end();
      }

    });

};
