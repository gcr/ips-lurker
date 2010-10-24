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

function ipsLogin(boardUrl, user, pass, cb) {
  // logs in to an IPS forum
  // calls either cb(error) or cb(false, 'cookies')

  var u = url.parse(boardUrl),
      request = http
        .createClient(u.port||80, u.hostname)
        .request('GET', '/index.php?' +
          querystring.stringify({
              app: 'core',
              module: 'global',
              section: 'login',
              'do': 'process',
              username: user,
              password: pass
            }),
        {'host': u.hostname});
    request.end();
    request.on('response', function (response) {
        var cookies = parseCookies(response.headers['set-cookie']);
        if (!('pass_hash' in cookies)) {
          cb("Username/password incorrect.");
        } else {
          cb(false, cookies);
        }
    });
}


