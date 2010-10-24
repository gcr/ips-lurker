/*jslint regexp:false */
var http = require('http'),
    url = require('url'),
    sys = require('util'),
    querystring = require('querystring');

function parseCookies(cookies){
  // call it on req.headers['set-cookie']
  var result = {};
  if (typeof cookies != 'undefined' && cookies.length) {
    for (var i=0,l=cookies.length; i<l; i++) {
      var cookie = cookies[i].split(';')[0] || '';
        result[cookie.split('=')[0] || ''] = cookie.split('=')[1] || '';
    }
  }
  return result;
}

function unparseCookies(cookies) {
  // call this with an object and we'll return a string so you can just set the
  // header.
  // clientRequest.writeHeaders({'cookie', unparseCookies(...)});
  var result = [];
  for (var k in cookies) {
    if (cookies.hasOwnProperty(k)) {
      result.push(k+"="+cookies[k]);
    }
  }
  return result.join('; ');
}

function ipsLogin(boardUrl, user, pass, cb) {
  // logs in to an IPS forum
  // calls either cb(error) or cb(false, fun) where fun is a function you can
  // call to make a request to the authenticated board. call it like
  // fun({query},{headers}); and it will return a htt.clientRequest

  var u = url.parse(boardUrl),
      request = http
        .createClient(u.port||80, u.hostname)
        .request('GET', '/index.php?' +
          querystring.stringify({
              app: 'core',
              module: 'global',
              section: 'login',
              'do': 'process',
              username: user, // yuck! i know
              password: pass
            }),
        {'host': u.hostname});
    request.end();
    request.on('response', function (response) {
        var cookies = parseCookies(response.headers['set-cookie']);
        if (!('pass_hash' in cookies)) {
          cb(new Error("Username/password incorrect."));
        } else {
          cb(false, function(query, heads) {
                var headers = {'Cookie': unparseCookies(cookies),
                               'host': u.hostname};
                if (heads) {
                  for (var k in heads) {
                    if (heads.hasOwnProperty(k)) {
                      headers[k] = heads[k];
                    }
                  }
                }
                console.log(querystring.stringify(query));
                return http
                  .createClient(u.port||80,u.hostname)
                  .request('GET', '/index.php?' +
                      querystring.stringify(query), headers);
              });
        }
    });
}


function ipsChatLogin(url, user, pass, cb) {
  ipsLogin(url, user, pass, function(error, ipsconnect) {
      if (error) { return cb(error); }
      var request = ipsconnect({app: 'ipchat'});
      request.on('response', function(response) {
          var body = '';
          response.on('data', function(data) {
              body +=data.toString();
          });
          response.on('end', function() {
              var accessKeyR = /var\s*accessKey\s*=\s*'([a-zA-Z0-9]*)'/,
                  serverHostR = /var\s*serverHost\s*=\s*'(.*)'/,
                  serverPathR = /var\s*serverPath\s*=\s*'(.*)'/,
                  roomIdR = /var\s*roomId\s*=\s*([0-9]*)/,
                  userNameR = /var\s*userName\s*=\s*'(.*)'/, 
                  userIdR = /var\s*userId\s*=\s*([0-9]*)/;
                  console.log(userIdR);
              return cb(accessKeyR.exec(body)[1],
                 serverHostR.exec(body)[1],
                 serverPathR.exec(body)[1],
                 roomIdR.exec(body)[1],
                 userNameR.exec(body)[1],
                 userIdR.exec(body)[1], "end");
          });
        });
      request.end();
    });
}


exports.ipsLogin = ipsLogin;
exports.ipsChatLogin = ipsChatLogin;
