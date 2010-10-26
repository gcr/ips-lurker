/*jslint regexp:false */
var http = require('http'),
    url = require('url'),
    util = require('util'),
    ips = require('./ips'),
    querystring = require('querystring');

function bind(bindee, action) {
  // inside 'action', 'this' will be bound to 'bindee'
  return function() {
    action.call(bindee);
  };
}

function IpsChat(ipsconnect, accessKey, serverHost, serverPath, roomId, userName, userId, secureHash, baseUrl) {
  /* Here's an IPS chat object.
   *
   * Events:
   *    message (msg, username, userId, timestamp)
   *    user_enter (username, userId, ts)
   *    user_kicked (uname, userId)
   *    user_exit (uname, uid, timestamp)
   *    unknown_msg (arguments)
   *        we did not understand the message
   *    error (firstMessage)
   *        the server kicked us or something.
   * Methods:
   *    ping()
   *        update our 'online' status on the forum's 'online users' list
   *        done automatically
   *    getMessages()
   *        get new message (this also acts like 'ping' except for the chat room)
   *        done automatically
   */
  var self = this;
  this.ipsconnect = ipsconnect;
  this.accessKey = accessKey; // required on some requests
  this.serverHost = serverHost; // where to send some requests too
  this.serverPath = serverPath;
  this.roomId = roomId;
  this.userName = userName;
  this.userId = userId;
  this.secureHash = secureHash; // also required on some urls :/
  this.baseUrl = baseUrl; // ping the server sometimes
  this.lastMessageID = 0;

  this.pingTimer = setInterval(bind(this, this.ping), 60000);
  this.ping();

  this.getMessagesTimer = setInterval(bind(this, this.getMessages), 3000);
  this.getMessages();
}
util.inherits(IpsChat, require('events').EventEmitter);

IpsChat.prototype.ping = function() {
  // this makes you stay logged in on the "online users" page. (getMessages
  // makes you stay logged in on the chat)
  this.boardGet({
        app: 'ipchat',
        module: 'ajax',
        section: 'update',
        md5check: this.secureHash
      })
    .end();
};

function eachMessage(messages, cb) {
  // utility function
  // calls callback with the message details
  for (var i=0,l=messages.length; i<l; i++) {
    if (messages[i].trim().length) {
      cb.apply(this, messages[i].split(','));
    }
  }
}

function unserializeMsg(msg) {
  // server sent us 'msg', so clean it up.
  return msg
    .replace( '~~#~~', "," )
    .replace( /&#039;/g, "'")   // todo: proper de-entity-ization
    .replace( /&quot;/g, '"')
    .replace( /&lt;/g, '<')
    .replace( /&gt;/g, '>')
		.replace( /__N__/g, "\n" )
		.replace( /__C__/g, "," )
		.replace( /__E__/g, "=" )
		.replace( /__A__/g, "&" )
		.replace( /__P__/g, "%" )
		.replace( /__PS__/g, "+" );
}
function serializeMsg(msg) {
  // we're about to send 'msg' so un-clean it up.
  return msg
    .replace(/~~\|\|~~/g, "~~| |~~") // Seriously, why would _anyone_ do it this way?
		.replace(/\n/g, "__N__")
		.replace(/,/g, "__C__")
		.replace(/\=/g, "__E__")
		.replace(/&/g, "__A__")
		.replace(/%/g, "__P__")
		.replace(/\+/g, "__PS__");
}

IpsChat.prototype.getMessages = function() {
  // ask for (and handle) new messages from the server
  // includes our own messages
  var self = this;
  this.get('get.php', {
        room: this.roomId,
        user: this.userId,
        access_key: this.accessKey,
        charset: 'UTF-8',
        msg: this.lastMessageID
      })
    .on('response', function(response) {
        var body='';
        response.on('data', function(data ){body+=data;});
        response.on('end', function(){
            // body is now a list of messages split by '~~||~~'
            var messages = body.toString().split('~~||~~');

            // by convention, the first message is:  errcode,lastMessageID
            var firstMessage = messages.shift().split(',');
            if (firstMessage[0] != '1') {
              // onoes it all borked
              // we have no clue what this means but we'll handle it anyway
              self.emit('error', firstMessage);
              console.log('error', firstMessage);
              clearInterval(self.pingTimer);
              clearInterval(self.getMessagesTimer);
              return false;
            }
            self.lastMessageID = firstMessage[1];

            // now parse each message. Messages are simply comma-delimited(!)
            // with lousy escaping(!!) so this should be fun.
            eachMessage(messages, function(timestamp, msgType, username, msg, details, userId){
                var ts	= new Date();
                ts.setTime(timestamp * 1000); // timestamp is UNIX time
                switch(msgType) {
                  case '1':
                    // A normal message.
                    // 'details' is somehow related to private chats. If we were
                    // a real client we'd do something about it.
                    // Clean it up...
                    msgType = unserializeMsg(msgType);
                    username = unserializeMsg(username);
                    msg = unserializeMsg(msg);
                    // and pass it through.
                    self.messageRecieved(msg,username,userId,ts);
                    break;

                  case '2':
                    // A '{user} left / entered the room' message
                    var entered = details.split('_')[0] == '1';
                    if (entered) {
                      self.userEnter(username, userId, ts);
                    } else {
                      self.userExit(username, userId, ts);
                    }
                    break;

                  case '3':
                    // a '/me'-style command (note that a message type of 1
                    // with a "/me" at the very front should also be treated
                    // like this)
                    return arguments.callee(timestamp, 1, username, msg, details, userId);

                  case '4':
                    // a system message (treat it as a normal message for now)
                    return arguments.callee(timestamp, 1, "***system***", msg, details, userId);

                  case '5':
                    // somebody got kicked
                    self.kickedUser(msg, details);
                    //              uname, uid
                    break;

                  default:
                    self.emit('unknown_msg', arguments);
                    console.log(arguments);
                      // code
                }
              });
          });
      })
    .end();
};

IpsChat.prototype.send = function(msg, cb) {
  // Send something to the chat room
  if (typeof cb == 'undefined') { cb = function(){}; }
  var qstr = querystring.stringify({message: serializeMsg(msg), '_': ''});
  this.get('post.php', {
        room: this.roomId,
        user: this.userId,
        access_key: this.accessKey,
        charset: 'UTF-8'
      }, {'content-length': qstr.length,
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'}, 'POST')
  .on('response', cb)
  .end(qstr);
};
IpsChat.prototype.respond = IpsChat.prototype.send;
IpsChat.prototype.reply = IpsChat.prototype.send;
IpsChat.prototype.retort = IpsChat.prototype.send;
IpsChat.prototype.say = IpsChat.prototype.send;

/* doesn't work
IpsChat.prototype.leave = function(cb) {
  // leave the room.
  if (typeof cb == 'undefined') { cb=function(){}; }
  this.boardGet({
        app: 'ipchat',
        module: 'ipschat',
        section: 'chat',
        'do': 'leave', 
        user: this.userId,
        access_key: this.accessKey,
        secure_key: this.secureHash,
        md5check: this.secureHash
      })
    .on('response', cb);
};
*/

IpsChat.prototype.messageRecieved = function(msg, username, userId, timestamp) {
  this.emit('message', msg, username, userId, timestamp);
};
IpsChat.prototype.userEnter = function(username, userId, ts) {
  this.emit('user_enter', username, userId, ts);
};
IpsChat.prototype.kickedUser = function(userId, uname) {
  this.emit('user_kicked', uname, userId);
};
IpsChat.prototype.userExit = function(uname, uid, timestamp) {
  this.emit('user_exit', uname, uid, timestamp);
};

IpsChat.prototype.boardGet = function(newquery) {
  // this sends a message to the *message board*, not the chat server.
  var u = url.parse(this.baseUrl),
      query = querystring.parse(u.query);
  for (var k in newquery) {
    if (newquery.hasOwnProperty(k)) {
      query[k] = newquery[k];
    }
  }
  return this.ipsconnect(u.pathname, query); // use the authenticated connection
  // note: this ignores baseUrl's pathname and baseUrl's servername
};

IpsChat.prototype.get = function(path, query, headers, method) {
  // sends a message to the real chat server
  var head = {'host': this.serverHost};
  for (var k in headers) {
    if (headers.hasOwnProperty(k)) {
      head[k] = headers[k];
    }
  }
  return http
    .createClient(80, this.serverHost)
    .request(method||'GET', this.serverPath+path+'?'+
        querystring.stringify(query),
        head);
};



function ipsChatLogin(ipsconnect, cb) {
  // Use this to log in. Pass it what you get from ips.ipsLogin and we'll call you
  // back with (error, ipschat) where error may or may not be an exception and
  // ipschat will be an object you can assign events to.
  var request = ipsconnect('/index.php', {app: 'ipchat'});
  request.on('response', function(response) {
      // We need to look for those stupid 'var accessKey=...' codes they hide in
      // the HTML.
      var body = '';
      response.on('data', function(data) { body+=data; });
      response.on('end', function() {
          // why do they do it this way? i'm sorry
          var accessKeyR = /var\s*accessKey\s*=\s*'([a-zA-Z0-9]*)'/,
              serverHostR = /var\s*serverHost\s*=\s*'(.*)'/,
              serverPathR = /var\s*serverPath\s*=\s*'(.*)'/,
              roomIdR = /var\s*roomId\s*=\s*([0-9]*)/,
              userNameR = /var\s*userName\s*=\s*'(.*)'/, 
              userIdR = /var\s*userId\s*=\s*([0-9]*)/,
              secureHashR = /ipb.vars\['secure_hash'\]\s*=\s*'([a-zA-Z0-9]*)'/,
              baseUrlR = /ipb.vars\['base_url'\]\s*=\s*'(.*)'/;
          if (!accessKeyR.exec(body)) {
            return cb(new Error("Didn't get an access key. (Perhaps login error or you are not allowed to join the chat)"));
            // or maybe they're just being dumb :<
          }
          try {
            return cb(false,
               new IpsChat(ipsconnect,
                           accessKeyR.exec(body)[1],
                           serverHostR.exec(body)[1],
                           serverPathR.exec(body)[1],
                           roomIdR.exec(body)[1],
                           userNameR.exec(body)[1],
                           userIdR.exec(body)[1],
                           secureHashR.exec(body)[1],
                           baseUrlR.exec(body)[1]));
          } catch(err) {
            return cb(err);
          }
      });
    });
  request.end();
}

exports.ipsChatLogin = ipsChatLogin;
