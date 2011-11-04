/*
 * duckduckgo.js -- zero-click API for duck duck go
 * see http://duckduckgo.com/api.html
 *
 */

var http = require('http'),
    querystring = require('querystring'),
    randomSay = require('../lib/plugin_glue').randomSay;


function duckDuckGoQuery(query, cb) {
  // run cb(wittyResponse) when DDG returns something special
  http
    .createClient(80, 'api.duckduckgo.com')
    .request('GET', '/?'+querystring.stringify(
        {q: query, format: "json", no_redirect: 1, no_html: 1}
      ),
      {'host':'api.duckduckgo.com'})
    .on('response', function(res) {
      // response could come in more than one packet, so create a buffer
      // to hold it all
      var body='';
      res.on('data',function(data){body+=data;})
          .on('end', function(end) {
            try {
              // Parse the object we get
              var response = JSON.parse(body.toString().trim());
              console.log(response);

              if (response.Answer) {
                return cb(response.Answer);
              } else if (response.Abstract) {
                if (response.AbstractURL) {
                  return cb(response.Abstract+" [url=\""+response.AbstractURL+"\"](see also)[/url]");
                } else {
                  return cb(response.Abstract);
                }
              } else if (response.Definition) {
                return cb(response.Definition);
              } else if (response.RelatedTopics[0]) {
                return cb(response.RelatedTopics[0].Text);
              } else {
                return cb();
              }
            } catch (err) {}
          });
      })
      .end(); // Send our request
}

exports.init = function(chat) {

  chat.on('message', function(msg, usr, uid) {
      if (!chat.settled || uid == chat.userId) { return; }
      if (msg.match(/lurker/i)) {
          var query = msg.match(/what('s| is) *(the|an|a)* ([^?]*)/i);
          // vim: '
          if (query) {
            var q = query[3];
            if (q.length) {
              if (q.match(/coitus/) || q.match(/sex/)) {
                chat.say("It's what you wish you were having, "+usr+"!");
              } else {
                duckDuckGoQuery(q, function(text) {
                    if (text) {
                      chat.say(text);
                    } else {
                      randomSay([
                          "no clue", "not sure", "magic 8-ball says: OUTCOME UNCERTAIN",
                          "haven't the foggiest", "dunno", "your guess is as good as mine"]);
                    }
                  });
              }
            }
          }
        }

  });

};

exports.duckDuckGoQuery = duckDuckGoQuery;
