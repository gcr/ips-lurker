(lurker)
========

Lurker is a robot for the chat module [IP Board][ipb], a scary forum software
written in PHP. It has just enough framework to authenticate with IPBoard, but
this is for IP Board's chat. See him in action on the [Lights forum!][lightsforum]

How to run
----------
Run lurker like this:

    git clone git://github.com/gcr/ips-lurker.git; cd ips-lurker
    git submodule init
    git submodule update
    echo '{"user": "YOUR FORUM USERNAME", "pass": "YOUR FORUM PASS"}' > passwd
    node main.js

lurker requires node at least version 0.3.0. 0.2.x would work but it has a bug
involving multiple cookies.

What's inside
-------------
* Just enough framework to say things, receive messages, and notice new users
* A nice plugin system including several plugins already:
  * `plugins/greeter.js` respons to users who arrive
  * `plugins/responder.js` responds to lurker's name
  * `plugins/shutup.js` makes lurker be quiet when people tell him to
  * `plugins/twitter/` both repeats twitters from users into the chat and looks
    up twitter information when people mention a twitter-formatted name (like
    `@lights` for example)
  * `plugins/hangman/` is a fully-functional 'guess the lyric' game preseeded
    with over 350 lyrics from Lights songs. (Say 'lurker, guess the lyric' or
    'lurker, hangman')

Using the plugin system
-----------------------
All of lurker's functionality is written using the plugin system.

### Writing your own ###
A plugin can live in one of two places:

* `plugins/plugin_name.js`
* `plugins/plugin_name/plugin_name.js`

Plugins are loaded right after the chat is connected. By convention, lurker will
call your `exports.init(chat)` function and will pass the chat object in. Your
plugin should work by attaching various listeners to the chat object. All the
plugins work this way.

Look at `ipschat.js` for a list of all the events you can latch on to.

### Handling messages ###
Let's look at a real-world example. Save this as `plugins/test.js`:

    /*
     * test.js -- demonstrates a plugin
     */
    exports.init = function(chat) {
      // this function gets called when we connect

        chat.on('message', function(msg, user, uid) {
            // When we receive a message, this function will run
            if (!chat.settled || uid == chat.userId) { return; }
            // This prevents both messages sent before we join (the server sends
            // you recent messages as soon as you sign in) and messages that we
            // sent ourselves.

            if (message.match(/hello/i) && message.match(/lurker/)) {
                chat.say("Hello, "+user+"!");
            }
        });
    };

Then run 'node main.js' as usual. Lurker will notice your shiny new plugin and
will start it right up.

Suggested reading: `plugins/greeter.js`, `plugins/responder.js`,
`plugins/shutup.js` in that order.

### Plugin locking ###
Sometimes it's useful for one plugin to prevent other plugins from being run for
a time. For example, when in Hangman game mode, we want to prevent people from
shooing lurker away with 'lurker, go away!' and vice versa. Instead of forcing
those plugins to share global state, we instead have a locking system that
allows one plugin to 'lock' out the rest and make lurker fire handlers from that
plugin only. This function is stored in `../plugin_glue` wrt. the plugin, so be
sure to require that.

Locking works by removing all the event handlers from chat. This means that *if
you want to respond to event handlers while locked, you must re-attach them
yourself.*

Also note that *`pluginGlue.lock();` may return false to indicate that something
already locked it before you did-- handle this properly!* this WILL bite you the
same way it bit me, I guarantee it.

Here's a locking example that will "freeze" lurker for a few seconds when you
say the word 'lock' in the chat. During this time, lurker will not respond to
his name and other plugins won't see events.

    var pluginGlue = require('../plugin_glue');
    exports.init = function(chat) {
        chat.on('message', function(msg) {
            if (!chat.settled) { return; }

            if (msg.match(/lock/i)) {
                if (!pluginGlue.lock()) { return; }
                chat.say("About to lock, brb");

                setTimeout(function() {
                    chat.say("I'm back!");
                    pluginGlue.unlock();
                }, 20000);
                
            }
        });
    };

Locking is how `shutup.js` works.

Now sometimes removing *all* event handlers isn't what you want. For example, if
you write some kind of a logging module, you obviously want the logging module
to receive messages even when the hangman plugin locks lurker. To amend this,
wrap your handlers with the `pluginGlue.lockProtect()` function. The
`plugins/logger.js` plugin works this way:

    var lockProtect = require('../plugin_glue').lockProtect;

    exports.init = function(chat) {
        chat.on('message', lockProtect(function(message, username) {
            console.log("<"+username+"> "+message);
            }));
        chat.on('user_enter', lockProtect(function(username, uid) {
            console.log("*** "+username+" joined with uid"+uid);
            }));
    };

That should be enough to keep you going. Good luck!

[ipb]: http://www.invisionpower.com/products/board/ (IP Board)
[lightsforum]: http://board.iamlights.com
