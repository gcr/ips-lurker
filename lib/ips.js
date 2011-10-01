var http = require('http'),
    url = require('url'),
    util = require('util'),
    ips = require('./ips'),
    apricot = require('apricot').Apricot,
    querystring = require('querystring');

function parseCookies(cookies){
  // call it on req.headers['set-cookie'] and we'll return a dictionary of
  // cookies
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

function get_initial_login_auth_key(boardUrl, cb) {
  // Gets cb with either cb(error) or cb(False, access_key)
  var u = url.parse(boardUrl),
  request = http
    .createClient(u.port||80, u.hostname)
    .request('GET', '/index.php?' +
             querystring.stringify(
               { app: 'core',
                 module: 'global',
                 section: 'login'
                 // 'do': 'process',
                 // username: user, // yuck! i know
                 // password: pass
               }),
             {'host': u.hostname});
  request.on('response',
             function (response) {
               var data="";
               response.on('data', function(d){data+=d;});
               response.on('end',
                 function(){
                   apricot.parse(data,
                     function(error, dom) {
                       if (error) {
                         return cb(error);
                       }
                       var key_elem = dom.find("input[name=auth_key]").matches[0];
                       if (!key_elem) {
                         return cb(new Error("Is the board down?"));
                       }
                       console.log(key_elem.outerHTML);
                       cb(false, key_elem.value);
                     });
                 });
             });
  request.end();
}

function ipsLogin(boardUrl, user, pass, cb) {
  // Logs in to an IPS forum.
  // calls either cb(error) or cb(false, fun) where fun is a function you can
  // call to make a request to the authenticated board. call it like
  // fun('/index.php', {query},{headers}); and it will return a http.clientRequest
  //
  // WARNING TODO FIXME HACK XXX this sends user and password in the clear!
  get_initial_login_auth_key(
    boardUrl,
    function(error,auth_key) {
      if (error) {
        return cb(error);
      }
      var u = url.parse(boardUrl),
      request = http
        .createClient(u.port||80, u.hostname)
        .request('POST', '/index.php?' +
                 querystring.stringify(
                   {app: 'core',
                    module: 'global',
                    section: 'login',
                    'do': 'process',
                    ips_username: user, // yuck! i know
                    ips_password: pass,
                    auth_key: auth_key
                   }),
                 {'host': u.hostname});
      request.on('response',
        function(response) {
          var cookies = parseCookies(response.headers['set-cookie']);
          var data="";
          if (!('pass_hash' in cookies)) {
            cb(new Error("Username/password incorrect."));
          } else {
            cb(false, function(path, query, heads) {
                 // This function returns an http.clientRequest with authenticated
                 // cookies. Specify a path, query string, and extra headers.
                 var headers = {'Cookie': unparseCookies(cookies),
                                'host': u.hostname};
                 if (heads) {
                   for (var k in heads) {
                     if (heads.hasOwnProperty(k)) {
                       headers[k] = heads[k];
                     }
                   }
                 }
                 return http
                   .createClient(u.port||80,u.hostname)
                   .request('GET', path+'?'+
                            querystring.stringify(query), headers);
             });
          }
        });
      request.end();
    });
}


exports.ipsLogin = ipsLogin;
