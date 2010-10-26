/************************************************/
/* IPB3 Javascript								*/
/* -------------------------------------------- */
/* ips.ipb.chat.js - Chat javascript				*/
/* (c) IPS, Inc 2008							*/
/* -------------------------------------------- */
/* Author: Brandon Farber						*/
/************************************************/

/*
 * We have to override this code from ipb.js because we need 'g' flag
 */
Object.extend( RegExp, { 
	escape: function(text)
	{
		if (!arguments.callee.sRE)
		{
		   	var specials = [ '/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\', '$', '^' ];
		   	arguments.callee.sRE = new RegExp( '(\\' + specials.join('|\\') + ')', 'g' );
		}
		return text.replace(arguments.callee.sRE, '\\$1');
	}
});

Object.extend( String, { 
	reverse: function(text)
	{
		return text.split('').reverse().join('');
	}
});

var _chat = window.IPBoard;

_chat.prototype.chat = {
	/*
	 * Number of seconds between requests
	 */
	polling:		3,
	
	/*
	 * Timestamp we last polled server
	 */
	lastpolled:		0,
	
	/*
	 * The last message ID received
	 */
	lastMsgId:		0,
	
	/*
	 * The last time we saw
	 */
	lastTime:		'',

	/*
	 * Only show times at 5 minute intervals instead of 1 minute
	 */
	condenseTime:	0,
	
	/*
	 * Maximum number of li items within the chat window
	 */
	maxMessages:	0,
	
	/*
	 * Flag if we are moderator
	 */
	moderator:		0,

	/*
	 * Flag if we are allowed to do private chats
	 */
	private:		0,
	
	/*
	 * Kicked flag (stop calling to server)
	 */
	kicked:			false,

	/*
	 * Number of seconds between AJAX requests to update "who's chatting"
	 */
	chattingUpdate:	60,
	
	/*
	 * Bypass userid check internally for adding messages
	 */
	bypassFlag:		false,

	/*
	 * Templates for the messages, setup in the skin
	 */
	templates:		[],
	
	/*
	 * Emoticons hash
	 */
	emoticons:		{},
	
	/*
	 * Sound on or off
	 */
	soundEnabled:	0,
	
	/*
	 * Flag to indicate if sound object is ready
	 */
	soundReady:		false,
	
	/*
	 * Sound enabled image
	 */
	soundOnImg:		'',
	
	/*
	 * Sound disabled image
	 */
	soundOffImg:	'',
	
	/*
	 * Name formatting hash
	 */
	nameFormatting:	$H(),
	
	/*
	 * Group formatting info
	 */
	groups:			$H(),
	
	/*
	 * Does window have focus?
	 */
	windowHasFocus:	true,

	/*
	 * Active chat tab
	 */
	activeTab:		'chatroom',

	/*
	 * Map forum id to chat user id
	 */
	forumIdMap:		$H(),
	
	/*
	 * Forum user ids to ignore private chats from
	 */
	ignoreChats:	$H(),

	/*
	 * References for "send private chat" popup
	 */
	privateChats:	$H(),

	/*
	 * Stored typed private chat text for when tabs are switched
	 */
	typedChats:		$H(),

	/*
	 * Unread counts for tabs
	 */
	unreadTabs:		$H(),

	/*
	 * Number of unread items since last lost focus
	 */
	unreadCount:	0,
	
	/*
	 * Bad words hash
	 */
	badwords:		$H(),
	
	/*
	 * Initialization function
	 */
	init: function()
	{
		Debug.write("Initializing ips.chat.js");
		
		/*
		 * Wait for the DOM to finish loading...
		 */
		document.observe("dom:loaded", function()
		{
			/*
			 * Create the appropriate iframes
			 */
			ipb.chat.drawIframes();
			
			/*
			 * Set observer for onMessage event
			 */
			Event.observe( window, 'message', function(e)
			{
				ipb.chat.handleMessageFromChild( e.data );
			});

			/*
			 * Set an interval to poll ipb.chat.getMessages(), which initiates the AJAX request.
			 */
			new PeriodicalExecuter( ipb.chat.getMessages, ipb.chat.polling );

			/*
			 * When we submit the chat text, initiate the AJAX request to post it to the server
			 */
			$('chat-submit').observe( 'click', ipb.chat.sendChat );
			
			/*
			 * Watch for "enter" key submissions
			 */
			Event.observe( 'message_textarea', 'keypress', ipb.chat.checkForSendChat );
			
			/*
			 * Make sure we stay "online"
			 */
			ipb.chat.ping();
			new PeriodicalExecuter( ipb.chat.ping, ipb.chat.chattingUpdate );
			
			/*
			 * Sound notifications toggler
			 */
			$('sound_toggle').observe( 'click', function(e) {
				if( ipb.chat.soundEnabled )
				{
					ipb.chat.soundEnabled	= 0;
					ipb.Cookie.set( 'chat_sounds', 'off' );
					Debug.write( "Chat sounds disabled" );
					
					$('sound_toggle_img').writeAttribute( 'src', ipb.chat.soundOffImg );
				}
				else
				{
					ipb.chat.soundEnabled	= 1;
					ipb.Cookie.set( 'chat_sounds', 'on' );
					Debug.write( "Chat sounds enabled" );
					
					$('sound_toggle_img').writeAttribute( 'src', ipb.chat.soundOnImg );
				}
				
				Event.stop(e);
				return false;
			});
			
			/*
			 * Kick user links
			 */
			ipb.chat.initKickLinks();
			
			/*
			 * Enable sounds when sound object is ready
			 */
			soundManager.onready( function(oStatus) {
				if( oStatus.success )
				{
					ipb.chat.soundReady	= true;
				}
			});
			
			/*
			 * Monitor window focus...
			 */
			if( Prototype.Browser.IE )
			{
				document.onfocusin = function() { ipb.chat.cleanTitle(); ipb.chat.windowHasFocus = true; };
				document.onfocusout = function() { ipb.chat.unreadCount = 0; ipb.chat.windowHasFocus = false; };
			}
			else
			{
				Event.observe( window, 'focus', function() { ipb.chat.cleanTitle(); ipb.chat.windowHasFocus = true; } );
				Event.observe( window, 'blur', function() { ipb.chat.unreadCount = 0; ipb.chat.windowHasFocus = false; } );
			}
			
			/*
			 * Handle tabs
			 */
			$$('#chat-tab-bar a').each( function(elem) {
				id = elem.identify();

				if( $( id ) )
				{
					$( id ).observe( "click", ipb.chat.switchTab );
				}
			});
			
			/*
			 * Manually setup menus so we can add our callback
			 */
			$$('.chatmodmenu').each( function(menu){
				id = menu.identify();
				if( $( id + "_menucontent" ) )
				{
					new ipb.Menu( menu, $( id + "_menucontent" ), {}, { afterOpen: ipb.chat.repositionModMenu } );
				}
			});
		});
	},
	
	/*
	 * Swap out the tab content
	 */
	switchTab: function( e )
	{
		Event.stop(e);
		
		elem	= Event.findElement(e);
		id		= elem.identify();

		if( id.match( /close\-chat\-tab\-(.+?)/g ) )
		{
			ipb.chat.closePrivateTab( id );
			return false;
		}

		rel		= $( id ).rel;
		
		/*
		 * Already on the clicked tab
		 */
		if( rel == ipb.chat.activeTab )
		{
			Debug.write( "Clicked on active tab" );
			return false;
		}

		/*
		 * Swap out the active window with the storage window we need
		 */
		ipb.chat.switchToTab( rel );
		
		return false;
	},
	
	/*
	 * Actually switch to another tab
	 */
	switchToTab: function( rel )
	{
		if( $( 'storage_' + rel ) )
		{
			/*
			 * Store current message we were typing
			 */
			if( $F('message_textarea').strip() )
			{
				ipb.chat.typedChats.set( ipb.chat.activeTab, $F('message_textarea') );

				$('message_textarea').clear();
			}

			$( 'storage_container_' + ipb.chat.activeTab ).update( $('messages-display').innerHTML );
			$( 'messages-display' ).update( $( 'storage_container_' + rel ).innerHTML ).addClassName('messages-list');
			$( 'storage_container_' + rel ).update();
			
			$( 'tab-' + ipb.chat.activeTab ).removeClassName('active');
			$( 'tab-' + rel ).addClassName('active');

			ipb.chat.activeTab	= rel;

			ipb.chat.updateTabUnreadCount();
			
			/*
			 * Scroll to the bottom
			 */
			$('messages-display').scrollTop	= $('messages-display').scrollHeight + 500;

			/*
			 * Restore textarea if we have stored text for this tab
			 */
			if( ipb.chat.typedChats.get( ipb.chat.activeTab ) )
			{
				$('message_textarea').value	= ipb.chat.typedChats.get( ipb.chat.activeTab );
				
				ipb.chat.typedChats.unset( ipb.chat.activeTab );
			}
			
			$('message_textarea').focus();
		}
	},
	
	/*
	 * Build a new tab
	 */
	buildTab: function( id )
	{
		/*
		 * Has this user left?
		 */
		if( !ipb.chat.nameFormatting.get( id ) )
		{
			return false;
		}
		
		/*
		 * Tab exists?
		 */
		if( $("tab-" + id ) )
		{
			if( !$("storage_" + id ) )
			{
				var newOuter	= new Element( 'div', { id: "storage_container_" + id } ).addClassName('storage-container');
				var newStorage	= new Element( 'ul', { id: "storage_" + id } );
				$('iframeContainer').insert( newOuter.insert( newStorage ) );
				
				ipb.chat.typedChats.unset( id );
			}
			
			return true;
		}

		/*
		 * Get name
		 */
		var name	= ipb.chat.nameFormatting.get( id )[2].stripTags();

		/*
		 * First - let's see if we have another tab with this name.  Because if so, that means user timed out/left, and then returned,
		 * so we don't want two tabs from the same user.  We can just update the tab id in that case.
		 */
		var _existed	= false;
		
		$('chat-tab-holder').childElements().each( function(elem){
			/*
			 * This should be an <li>
			 */
			var _thisId	= $(elem).readAttribute('id').replace( /tab-/, '' );
			var _name	= $(elem).innerHTML.stripTags().strip().replace( /&nbsp;/g, '' );
			
			/*
			 * This is the same name as the new tab - just update existing tab
			 */
			if( name == _name )
			{
				$(elem).writeAttribute( 'id', 'tab-' + id );
				$( "storage_container_" + _thisId ).writeAttribute( 'id', "storage_container_" + id );
				$( "storage_" + _thisId ).writeAttribute( 'id', "storage_" + id );
				
				if( ipb.chat.activeTab == _thisId )
				{
					ipb.chat.activeTab	= id;
				}
				
				_existed	= true;
			}
		});

		/*
		 * We did not, so build new tab
		 */
		if( !_existed )
		{
			var newTab	= new Element( 'li', { id: "tab-" + id } );
			newTab.update( ipb.chat.templates['new-tab'].evaluate( { id: id, name: name } ) ).addClassName('left');//.addClassName('active');
			$('chat-tab-holder').insert( { bottom: newTab } );
		}

		/*
		 * Reset "active" tab
		 * @see 	http://community.invisionpower.com/tracker/issue-21639-buffer-clearing/
		 * We build tab and then switchToTab().  If we change active status of tab now, when we
		 * do the switch it gets confused because it thinks the new tab is already active and clears old tab buffer
		 */
		//$( 'tab-' + ipb.chat.activeTab ).removeClassName('active');
		//ipb.chat.activeTab	= id;
		
		/*
		 * Handle click handlers
		 */
		$$('#chat-tab-bar a').each( function(elem) {

			elem.stopObserving();
			
			_id = elem.identify();

			if( $( _id ) )
			{
				$( _id ).observe( "click", ipb.chat.switchTab );
			}
		});

		/*
		 * Create storage container
		 */
		if( !$( "storage_" + id ) )
		{
			var newOuter	= new Element( 'div', { id: "storage_container_" + id } ).addClassName('storage-container');
			var newStorage	= new Element( 'ul', { id: "storage_" + id } );
			$('iframeContainer').insert( newOuter.insert( newStorage ) );
		}
		
		return true;
	},
	
	/*
	 * Close a chat tab
	 */
	closePrivateTab: function( id )
	{
		_rel	= id.replace( /close-chat-tab-/, '' );

		if( !_rel )
		{
			return false;
		}

		/*
		 * If we are on this tab, switch to chatroom
		 */
		if( _rel == ipb.chat.activeTab )
		{
			ipb.chat.switchToTab( 'chatroom' );
		}
		
		/*
		 * Remove storage
		 */
		$( "storage_container_" + _rel ).remove();
		$( "tab-" + _rel ).remove();
		ipb.chat.typedChats.unset( _rel );
		
		return false;
	},
	
	/*
	 * Click handler for sending a new private chat
	 */
	sendPrivateChat: function( id )
	{
		/*
		 * Make sure we have something to send
		 */
		var message	= $F( "priv_chat_text_" + id ).strip();
		
		if( message == '' )
		{
			return false;
		}
		
		ipb.chat.privateChats.get( 'privchatwindow_' + id ).hide();
		$( "priv_chat_text_" + id ).clear();
		
		/*
		 * First, do we already have a tab for this user?
		 */
		if( $( 'storage_' + id ) )
		{
			/*
			 * Switch to tab
			 */
			ipb.chat.switchToTab( id );

			/*
			 * We do, so we need to restore this "room" and switch tab
			 */
			$( 'storage_container_' + ipb.chat.activeTab ).update( $('messages-display').innerHTML );
			$( 'messages-display' ).update( $( 'storage_container_' + id ).innerHTML ).addClassName('messages-list');
			$( 'storage_container_' + id ).update();
			
			$( 'tab-' + ipb.chat.activeTab ).removeClassName('active');
			$( 'tab-' + id ).addClassName('active');

			ipb.chat.activeTab	= id;
		}
		
		/*
		 * No tab yet.  Build, then insert and send message.
		 */
		 
		else
		{
			/*
			 * Backup current tab
			 */
			$( 'storage_container_' + ipb.chat.activeTab ).update( $('messages-display').innerHTML );
			
			/*
			 * Build tab
			 */
			ipb.chat.buildTab( id );
			
			/*
			 * Switch to tab
			 */
			ipb.chat.switchToTab( id );
			
			/*
			 * Switch to new tab
			 */
			$( 'messages-display' ).update( $( 'storage_container_' + id ).innerHTML ).addClassName('messages-list');
			$( 'storage_container_' + id ).update();
		}

		/*
		 * Clean the post for our use
		 */
		message	= ipb.chat.cleanMessage( message );

		/*
		 * Send it to the server
		 */
		if( ipb.chat.sendMessageToChild( "server=" + serverHost + "&path=" + serverPath + "&room=" + roomId + "&user=" + userId + "&access_key=" + accessKey + "&lmsg=" + ipb.chat.lastMsgId + "&action=private&message=" + message + '&toUser=' + id + '&charset=' + ipb.vars['charset'] ) )
		{
			/*
			 * Scroll to the bottom
			 */
			$('messages-display').scrollTop	= $('messages-display').scrollHeight + 500;
		
			message	= message.escapeHTML();
			
			ipb.chat.bypassFlag	= true;
			ipb.chat.updateMessages( "1,0~~||~~" + Math.round(new Date().getTime() / 1000) + ",1," + userName.replace( ',', '~~#~~' ) + "," + message + ",private=" + id + "," + userId + "~~||~~" );
			ipb.chat.bypassFlag	= false;
		}

		Debug.write( "Sending private chat to " + name );
		
		return false;
	},

	/*
	 * Draw the appropriate iframes
	 */
	drawIframes: function()
	{
		/*
		 * We use one iframe to postMessage for window.postMessage browsers
		 */
		if( window.postMessage )
		{
			var iframe = new Element( 'iframe', { 'id': 'chatProxy' } );
			
			iframe.writeAttribute( 'src', 'http://' + serverHost + serverPath + 'web/postMessage.php?parent=' + ourUrl );
			iframe.setStyle( 'position', 'absolute' );
			iframe.setStyle( 'left', '-150px' );
			iframe.setStyle( 'top', '0px' );
			iframe.setStyle( 'display', 'none' );

			$('iframeContainer').insert( iframe );
		}
		/*
		 * Otherwise we use a 3-way iframe system
		 */
		else
		{
			var iframe = new Element( 'iframe', { 'id': 'chatProxy' } );

			iframe.writeAttribute( 'src', 'http://' + serverHost + serverPath + 'web/iframeProxy.php?parent=' + ourUrl );
			iframe.setStyle( 'position', 'absolute' );
			iframe.setStyle( 'left', '-150px' );
			iframe.setStyle( 'top', '0px' );
			iframe.setStyle( 'display', 'none' );

			$('iframeContainer').insert( iframe );
		}
	},
	
	/*
	 * Clean the title tag upon refocusing
	 */
	cleanTitle: function()
	{
		if( document.title.match( /\(\d+\) (.+?)/gi ) )
		{
			document.title = document.title.replace( /\(\d+\) (.+?)/gi, "$1" );
		}
		
		ipb.chat.unreadCount	= 0;
	},

	/*
	 * New message sound
	 */
	triggerMessageSound: function()
	{
		/*
		 * Don't play sound if it comes from our own chat message
		 */
		if( ipb.chat.soundEnabled && ipb.chat.soundReady && !ipb.chat.bypassFlag )
		{
			soundManager.play( 'message', ipb.vars['board_url'] + '/public/sounds/message.mp3' );
			
			/*
			 * Originally we used scriptaculous for sound (with .wav files) however scriptaculous
			 * embeds a player into the page to play the sounds, and this steals focus from the
			 * browser window entirely every time a sound plays (even if you are looking at another tab).
			 * As such we switched to .mp3 sounds via a flash interface.
			 */
			//Sound.play( ipb.vars['board_url'] + '/public/sounds/new_message.wav' );
		}
	},
	
	/*
	 * Enter room sound
	 */
	triggerEnterSound: function()
	{
		if( ipb.chat.soundEnabled && ipb.chat.soundReady )
		{
			soundManager.play( 'enter', ipb.vars['board_url'] + '/public/sounds/enter.mp3' );
			//Sound.play( ipb.vars['board_url'] + '/public/sounds/enter.wav' );
		}
	},
	
	/*
	 * Leave room sound
	 */
	triggerLeaveSound: function()
	{
		if( ipb.chat.soundEnabled && ipb.chat.soundReady )
		{
			soundManager.play( 'leave', ipb.vars['board_url'] + '/public/sounds/leave.mp3' );
			//Sound.play( ipb.vars['board_url'] + '/public/sounds/leave.wav' );
		}
	},

	/*
	 * Did the user just hit 'enter' key in a private chat textarea?
	 */
	checkForSendPrivateChat: function(e)
	{
		/*
		 * Submit chat if we hit the enter key
		 */
		if( e.keyCode == Event.KEY_RETURN )
		{
			Event.stop(e);
			
			elem	= Event.findElement(e);
			id		= elem.identify();
			_id		= id.replace( /priv_chat_text_/, '' );

			ipb.chat.sendPrivateChat( _id );
			
			return false;
		}
		
		return true;
	},
	
	/*
	 * Did the user just hit 'enter' key in the chat textarea?
	 */
	checkForSendChat: function(e)
	{
		/*
		 * Submit chat if we hit the enter key
		 */
		if( e.keyCode == Event.KEY_RETURN )
		{
			ipb.chat.sendChat( e );
		}
	},
	
	/*
	 * Send a chat message to the server
	 */
	sendChat: function( e )
	{
		/*
		 * Don't *really* submit the form..
		 */
		Event.stop(e);
		
		/*
		 * Get form field value and strip whitespace
		 */
		var chatPost	= $F('message_textarea').strip();

		/*
		 * Make sure we have something to send
		 */
		if( chatPost == '' )
		{
			return false;
		}

		/*
		 * Clean the post for our use
		 */
		chatPost	= ipb.chat.cleanMessage( chatPost );

		/*
		 * Private chat?
		 */
		if( ipb.chat.activeTab != 'chatroom' )
		{
			var _thisMessage	= "&action=private&toUser=" + ipb.chat.activeTab;
			var _thisExtra		= "private=" + ipb.chat.activeTab;
		}
		else
		{
			var _thisMessage	= "&action=post";
			var _thisExtra		= '0';
		}

		/*
		 * Send it to the server
		 */
		if( ipb.chat.sendMessageToChild( "server=" + serverHost + "&path=" + serverPath + "&room=" + roomId + "&user=" + userId + "&access_key=" + accessKey + "&lmsg=" + ipb.chat.lastMsgId + _thisMessage + "&message=" + chatPost + '&charset=' + ipb.vars['charset'] ) )
		{
			/*
			 * Scroll to the bottom
			 */
			$('messages-display').scrollTop	= $('messages-display').scrollHeight + 500;
		
			chatPost	= chatPost.escapeHTML();
			
			ipb.chat.bypassFlag	= true;
			ipb.chat.updateMessages( "1,0~~||~~" + Math.round(new Date().getTime() / 1000) + ",1," + userName.replace( ',', '~~#~~' ) + "," + chatPost + "," + _thisExtra + "," + userId + "~~||~~" );
			ipb.chat.bypassFlag	= false;
		}
		
		/*
		 * Clear the textarea
		 */
		$('message_textarea').clear();
		
		/*
		 * Scroll to the bottom
		 */
		$('messages-display').scrollTop	= $('messages-display').scrollHeight + 500;
		
		/*
		 * Return false to make sure form doesn't submit
		 */
		return false;
	},
	
	/*
	 * Sends a message to the remote server by changing the document.location
	 * of an iframe for the other location.  We also change the width of the iframe
	 * to trigger it's check for a changed location.  It's more resource efficient
	 * to have an event handler monitor size change, than to manually poll the location
	 * every x seconds
	 */
	sendMessageToChild: function( message )
	{
		/*
		 * Don't do anything if we've been kicked
		 */
		if( ipb.chat.kicked )
		{
			return false;
		}
		
		/*
		 * Post message to remote iframe
		 */
		var elem = $('chatProxy').contentWindow;

		if( window.postMessage )
		{
			Debug.write( "Using window.postMessage method" );
			elem.postMessage( message, 'http://' + serverHost );
		}
		else
		{
			Debug.write( "Using iframe hash method" );
			elem.location = 'http://' + serverHost + serverPath + '/web/iframeProxy.php?parent=' + ourUrl + '#' + message + '&timestamp=' + Math.round(new Date().getTime() / 1000);
		}
		
		return true;
	},
	
	/*
	 * Deal with the response from the remote server
	 */
	handleMessageFromChild: function( message )
	{
		/*
		 * Don't do anything if we've been kicked
		 */
		if( ipb.chat.kicked )
		{
			return false;
		}

		/*
		 * Ignore height notifications
		 */
		if( message.substr( 0, 7 ) == 'height=' )
		{
			return false;
		}

		/*
		 * Only if we have an actual response
		 */
		if ( message.length > 0 )
		{
			/*
			 * If this is a response to a new submission or mod action, just get the messages
			 */
			if( message.substr( 0, 8 ) == '__post__' || message.substr( 0, 12 ) == '__moderate__' )
			{
				ipb.chat.getMessages();
			}
			
			/*
			 * Otherwise we need to update the displayed messages
			 */
			else
			{
				ipb.chat.updateMessages( message );
			}
		}
	},

	/*
	 * Get messages from remote server
	 */
	getMessages: function( pe )
	{
		/*
		 * If kicked, shut off executer
		 */
		if( ipb.chat.kicked )
		{
			pe.stop();
			return false;
		}
		
		/*
		 * Generate a current timestamp
		 */
		curtime	= parseInt( new Date().getTime().toString().substring( 0, 10 ) );
		
		/*
		 * If current time - last polled time is less than the polling timeperiod,
		 * skip this iteration (prevent DOS when user submits many messages quickly)
		 */
		if( curtime - ipb.chat.lastpolled < ipb.chat.polling )
		{
			return false;
		}

		/*
		 * Set last polled timestamp
		 */
		ipb.chat.lastpolled	= parseInt( new Date().getTime().toString().substring( 0, 10 ) );
		
		/*
		 * Send the request to the remote server
		 */
		ipb.chat.sendMessageToChild( "server=" + serverHost + "&path=" + serverPath + "&room=" + roomId + "&user=" + userId + "&access_key=" + accessKey + "&msg=" + ipb.chat.lastMsgId + "&charset=" + ipb.vars['charset'] );
	},

	/*
	 * Update the displayed messages on the page
	 */
	updateMessages: function( text )
	{
		/*
		 * Do we have anything?
		 */
		if( !text )
		{
			return true;
		}

		/*
		 * Messages are imploded on ~~||~~
		 */
		var messages = text.split( "~~||~~" );

		/*
		 * Determine if we need to scroll down when the messages are re-inserted.  We have to do this
		 * now so that we can determine if the scrollbar is already scrolled down all the way.  That way
		 * if a user scrolls up, we don't scroll down on them every 3 seconds - but if they are already
		 * scrolled down all the way, we keep moving down as new messages are inserted.
		 */
		var scrollBottom	= false;
		
		/*
		 * Everything vs IE, as per normal :P
		 */
		try
		{
			var _borderTop		= getComputedStyle( $('messages-display'), '' ).getPropertyValue('border-top-width').replace( 'px', '' );
			var _borderBottom	= getComputedStyle( $('messages-display'), '' ).getPropertyValue('border-bottom-width').replace( 'px', '' );
			var _padTop			= getComputedStyle( $('messages-display'), '' ).getPropertyValue('padding-top').replace( 'px', '' );
			var _padBottom		= getComputedStyle( $('messages-display'), '' ).getPropertyValue('padding-bottom').replace( 'px', '' );
		}
		catch( e )
		{
			var _borderTop		= $('messages-display').currentStyle.borderWidth.replace( 'px', '' );
			var _borderBottom	= $('messages-display').currentStyle.borderWidth.replace( 'px', '' );
			var _padTop			= $('messages-display').currentStyle.paddingTop.replace( 'px', '' );
			var _padBottom		= $('messages-display').currentStyle.paddingBottom.replace( 'px', '' );
		}

		var _totalOffset	= parseInt(_borderTop) + parseInt(_borderBottom) + parseInt(_padTop) + parseInt(_padBottom);
		
		/*
		 * Commented out just to save resources in production
		 */
		//Debug.write( "Scrolltop: " + $('messages-display').scrollTop );			// 60
		//Debug.write( "Scrollheight: " + $('messages-display').scrollHeight );		// 360
		//Debug.write( "Offsetheight: " + $('messages-display').getHeight() );		// 306
		//Debug.write( "Style offsets: " + _totalOffset );							// 6 (3px border top + bottom)

		/*
		 * See above example comments after Debug.write lines
		 */
		if( ( $('messages-display').getHeight() - _totalOffset + $('messages-display').scrollTop ) >= ( $('messages-display').scrollHeight - 10 ) )
		{
			scrollBottom	= true;
		}

		/*
		 * Set some variables
		 */
		var _updatedCount	= 0;
		var _showOwn		= false;
		var _initialEmpty	= false;
		var _startLMI		= ipb.chat.lastMsgId;
		
		/*
		 * Loop over the messages
		 */
		for( var i=0; i < messages.length; i++ )
		{
			/*
			 * Split message at comma
			 */
			messages[ i ]	= messages[ i ].replace( /%20/gi, ' ' );
			messages[ i ]	= messages[ i ].replace( /%23/gi, '#' );
			messages[ i ]	= messages[ i ].replace( /%22/gi, '&quot;' );
			messages[ i ]	= messages[ i ].replace( /%3C/gi, '&lt;' );
			messages[ i ]	= messages[ i ].replace( /%3E/gi, '&gt;' );
			messages[ i ]	= messages[ i ].replace( /\</gi, '&lt;' );
			messages[ i ]	= messages[ i ].replace( /\>/gi, '&gt;' );
			messages[ i ]	= ipb.chat.manualDecode( messages[ i ] );

			var msgDetails	= messages[ i ].split( ',' );
			
			/*
			 * First iteration is meta data: code,lastMessageId
			 */
			if( i == 0 )
			{
				/*
				 * Request failed
				 */
				if( msgDetails[0] != 1 )
				{
					/*
					 * Show message in each window
					 */
					$$('.storage-container').each( function(elem) {
						var _id		= $(elem).id.replace( /storage_container_/, '' );
						var ulList	= ipb.chat.getStorageContainer( _id );
						
						ulList.insert( { bottom: ipb.chat.templates['msg-K'].evaluate() } );
						
						if( _id != ipb.chat.activeTab )
						{
							$( "storage_container_" + _id ).update( ulList );
						}
						else
						{
							$('messages-display').update( ulList ).addClassName('messages-list');
						}
					});

					/*
					 * And prevent future calls to server
					 */
					ipb.chat.kicked	= true;

					/*
					 * Jump to bottom of messages
					 */
					$('messages-display').scrollTop	= $('messages-display').scrollHeight + 500;
					
					return true;
				}
				else
				{
					/*
					 * No new messages (only if not insta-posting)
					 */
					if( !ipb.chat.bypassFlag && msgDetails[1] == ipb.chat.lastMsgId )
					{
						if( ipb.chat.lastMsgId == 0 )
						{
							ipb.chat.bypassFlag	= true;
							ipb.chat.lastMsgId	= 1;
							_initialEmpty		= true;

							msgDetails[1]		= 2;
							msgDetails[2]		= userName;
							msgDetails[3]		= '';
							msgDetails[4]		= '1_' + userId;
							msgDetails[5]		= userId;
						}
						else
						{
							return true;
						}
					}
					
					/*
					 * Store last message ID for next request
					 */
					if( !ipb.chat.bypassFlag )
					{
						/*
						 * If we refreshed the page, and all chat messages are being pulled,
						 * we don't want to skip our own messages
						 */
						if( ipb.chat.lastMsgId == 0 )
						{
							_showOwn	= true;
						}

						ipb.chat.lastMsgId	= msgDetails[1];
					}
					
					if( !_initialEmpty )
					{
						continue;
					}
				}
			}

			/*
			 * We have a message!
			 */
			if( msgDetails[1] )
			{
				/*
				 * Don't add our own messages since we do that automatically upon submit
				 */
				if( !ipb.chat.bypassFlag && msgDetails[5] == userId && ( msgDetails[1] == 1 || msgDetails[1] == 3 ) && !_showOwn )
				{
					continue;
				}
				
				/*
				 * Grab ulList handle
				 */
				var _thisRowId	= 'chatroom';
				
				if( msgDetails[1] == 1 )
				{
					/*
					 * Is this a private chat?
					 */
					if( msgDetails[4] )
					{
						var userDetails = msgDetails[4].split( '=' );
						
						if( userDetails[1] )
						{
							var _user	= msgDetails[5] == userId ? userDetails[1] : msgDetails[5];
							
							if( !$( 'storage_' + _user ) )
							{
								var _forumUser	= ipb.chat.forumIdMap.get( _user );
								
								var _blocked	= 0;
								
								if( _forumUser )
								{
									_blocked	= ipb.chat.ignoreChats.get( _forumUser[0] );
								}
								
								if( _blocked )
								{
									continue;
								}

								if( !ipb.chat.buildTab( _user ) )
								{
									continue;
								}
								
								ipb.chat.switchToTab( _user );
							}
							
							_thisRowId	= _user;
						}
					}
				}

				var ulList	= ipb.chat.getStorageContainer( _thisRowId );
				var alsoTo	= null;

				/*
				 * Format date from timestamp
				 */
				var _itemDate	= new Date();
				var _secs		= parseInt(msgDetails[0]) ? parseInt(msgDetails[0]) : parseInt(new Date().getTime());
				
				_itemDate.setTime( _secs * 1000 );
				
				var _hours		= _itemDate.getHours();
				var _mins		= _itemDate.getMinutes() + "";
				
				/*
				 * This makes sure we have leading 0
				 */
				if( _mins.length == 1 )
				{
					_mins	= "0" + _mins;
				}
				
				/*
				 * Showing times only at the "5's"
				 */
				if( ipb.chat.condenseTime )
				{
					var _minsLastChar	= _mins.charAt( _mins.length - 1 );
					
					if( _minsLastChar == 1 || _minsLastChar == 2 || _minsLastChar == 3 || _minsLastChar == 4 )
					{
						_mins	= _mins.charAt( 0 ) + "" + 0;
					}
					else if(  _minsLastChar == 6 || _minsLastChar == 7 || _minsLastChar == 8 || _minsLastChar == 9 )
					{
						_mins	= _mins.charAt( 0 ) + "" + 5;
					}
				}
				
				/*
				 * Normalize dates for AM/PM instead of 24 hour
				 */
				if( _hours > 12 )
				{
					_itemDate		= ( _hours - 12 ) + ':' + _mins + ' ' + ipb.lang['time_pm'];
				}
				else if( _hours == 0 )
				{
					_itemDate		= 12 + ':' + _mins + ' ' + ipb.lang['time_am'];
				}
				else if( _hours == 12 )
				{
					_itemDate		= _hours + ':' + _mins + ' ' + ipb.lang['time_pm'];
				}
				else
				{
					_itemDate		= _hours + ':' + _mins + ' ' + ipb.lang['time_am'];
				}

				/*
				 * If this is a new time, insert it
				 */
				if( _itemDate != ipb.chat.lastTime && !ipb.chat.bypassFlag )
				{
					var dateItem	= new Element( 'li' );
					dateItem.update( "<label>&nbsp;</label> <div>" + _itemDate + "</div>" ).addClassName('chat-time');
					ulList.insert( { bottom: dateItem } );
				}
				
				/*
				 * Create new list item
				 */
				var listItemVal	= '';

				/*
				 * Re-format newlines/commas from cleaning in sendChat()
				 */
				msgDetails[2]	= msgDetails[2].replace( '~~#~~', "," );
				msgDetails[2]	= ipb.chat.unCleanMessage( msgDetails[2] );
				
				msgDetails[4]	= msgDetails[4].replace( '~~#~~', "," );
				
				msgDetails[3]	= msgDetails[3].replace( '~~#~~', "," );
				msgDetails[3]	= ipb.chat.unCleanMessage( msgDetails[3] );
				msgDetails[3]	= ipb.chat.parseEmoticonsAndBbcode( msgDetails[3] );

				/*
				 * Is this a /me command?
				 */
				if( msgDetails[1] == 1 )
				{
					if( msgDetails[3].match( /^\/me /gi ) )
					{
						msgDetails[1]	= 3;
						msgDetails[3]	= msgDetails[3].replace( /^\/me /gi, '' );
					}
				}
				
				/*
				 * This is a normal chat
				 */
				if( msgDetails[1] == 1 )
				{
					/*
					 * Truncate username
					 */
					msgDetails[2]	= ipb.chat.formatName( msgDetails[5], msgDetails[2].truncate( 14 ) );

					/*
					 * This is here so we can color our own chats properly
					 */
					if( msgDetails[5] == userId )
					{
						listItemVal	= ipb.chat.templates['msg-1'].evaluate( { date: _itemDate, username: msgDetails[2], message: msgDetails[3], ownclass: 'chat-myown' } );
					}
					else
					{
						listItemVal	= ipb.chat.templates['msg-1'].evaluate( { date: _itemDate, username: msgDetails[2], message: msgDetails[3], ownclass: '' } );
					}
					
					/*
					 * Increment counter
					 */
					_updatedCount++;
					ipb.chat.unreadCount++;
					
					if( _thisRowId != ipb.chat.activeTab )
					{
						if( ipb.chat.unreadTabs.get( _thisRowId ) )
						{
							ipb.chat.unreadTabs.set( _thisRowId, ipb.chat.unreadTabs.get( _thisRowId ) + 1 );
						}
						else
						{
							ipb.chat.unreadTabs.set( _thisRowId, 1 );
						}
					}
				}
				
				/*
				 * This is a "{user} has (entered|left) the room" message
				 */
				else if( msgDetails[1] == 2 )
				{
					/*
					 * Details will be (1|2)_(userid).  1 means entered, 2 means left
					 */
					var details = msgDetails[4].split( '_' );

					/*
					 * Check if we've entered or left
					 */
					if( details[0] == 1 )
					{
						var _action	= ipb.lang['entered_room'];
						
						/*
						 * We don't want to add/remove on initial load - the chatters cache should be accurate anyways
						 */
						if( _startLMI > 0 )
						{
							ipb.chat.addUserToList( details[1], msgDetails[2], details[2] );
						}
						
						msgDetails[2]	= msgDetails[2].truncate( 14 );

						var _details	= ipb.chat.groups.get( details[3] );

						if( _details )
						{
							msgDetails[2]	= _details[0].replace( /__DBQ__/g, '"' ) + msgDetails[2] + _details[1].replace( /__DBQ__/g, '"' );
						}
						
						/*
						 * If user left and then returned, add message to private chat tab
						 */
						$('chat-tab-holder').childElements().each( function(elem){
							/*
							 * This should be an <li>
							 */
							var _thisId	= $(elem).readAttribute('id').replace( /tab-/, '' );
							var _name	= $(elem).innerHTML.stripTags().strip().replace( /&nbsp;/g, '' );
							
							/*
							 * This is the same name as the new tab - just update existing tab
							 */
							if( msgDetails[2] == _name )
							{
								$(elem).writeAttribute( 'id', 'tab-' + details[1] );
								$( "storage_container_" + _thisId ).writeAttribute( 'id', "storage_container_" + details[1] );
								$( "storage_" + _thisId ).writeAttribute( 'id', "storage_" + details[1] );
								
								if( ipb.chat.activeTab == _thisId )
								{
									ipb.chat.activeTab	= details[1];
								}
								
								alsoTo	= details[1];
							}
						});
					}
					else if( details[0] == 2 )
					{
						var _action	= ipb.lang['left_room'];
						
						/*
						 * We don't want to add/remove on initial load - the chatters cache should be accurate anyways
						 */
						if( _startLMI > 0 )
						{
							ipb.chat.removeUserFromList( details[1], msgDetails[2] );
						}
						
						msgDetails[2]	= ipb.chat.formatName( details[1], msgDetails[2].truncate( 14 ) );
						
						/*
						 * We also want to show the message on the private chat tab
						 */
						if( $('storage_container_' + details[1] ) )
						{
							alsoTo	= details[1];
						}
					}
					
					/*
					 * Truncate username
					 */
					//msgDetails[2]	= ipb.chat.formatName( details[1], msgDetails[2].truncate( 14 ) );

					listItemVal	= ipb.chat.templates['msg-2'].evaluate( { date: _itemDate, username: msgDetails[2], action: _action } );
				}
				
				/*
				 * This is a /me style command
				 */
				else if( msgDetails[1] == 3 )
				{
					/*
					 * Truncate username
					 */
					msgDetails[2]	= ipb.chat.formatName( msgDetails[5], msgDetails[2].truncate( 14 ) );
					
					listItemVal	= ipb.chat.templates['msg-3'].evaluate( { username: msgDetails[2], message: msgDetails[3] } );
					
					/*
					 * Increment counter
					 */
					_updatedCount++;
					ipb.chat.unreadCount++;
					
					if( _thisRowId != ipb.chat.activeTab )
					{
						if( ipb.chat.unreadTabs.get( _thisRowId ) )
						{
							ipb.chat.unreadTabs.set( _thisRowId, parseInt( ipb.chat.unreadTabs.get( _thisRowId ) ) + 1 );
						}
						else
						{
							ipb.chat.unreadTabs.set( _thisRowId, 1 );
						}
					}
				}
				
				/*
				 * System message
				 */
				else if( msgDetails[1] == 4 )
				{
					listItemVal	= ipb.chat.templates['msg-4'].evaluate( { message: msgDetails[3] } );

					/*
					 * Show system messages in each window
					 */
					$$('.storage-container').each( function(elem) {
						var _id		= $(elem).id.replace( /storage_/, '' );
						
						if( _id != 'chatroom' )
						{
							var _ulList	= ipb.chat.getStorageContainer( _id );

							_ulList.insert( { bottom: ipb.chat.templates['msg-K'].evaluate() } );
							$(elem).update( _ulList );
						}
					});
					
					$('messages-display').update( ipb.chat.getStorageContainer( ipb.chat.activeTab ) ).addClassName('messages-list');
					
					/*
					 * Increment counter
					 */
					_updatedCount++;
					ipb.chat.unreadCount++;
					
					if( _thisRowId != ipb.chat.activeTab )
					{
						if( ipb.chat.unreadTabs.get( _thisRowId ) )
						{
							ipb.chat.unreadTabs.set( _thisRowId, parseInt( ipb.chat.unreadTabs.get( _thisRowId ) ) + 1 );
						}
						else
						{
							ipb.chat.unreadTabs.set( _thisRowId, 1 );
						}
					}
				}
				
				/*
				 * Mod action (currently only "kick")
				 */
				else if( msgDetails[1] == 5 )
				{
					/*
					 * Remove kicked user from chat list
					 */
					ipb.chat.removeUserFromList( msgDetails[4], msgDetails[3] );
					
					/*
					 * Truncate username
					 */
					msgDetails[2]	= ipb.chat.formatName( msgDetails[5], msgDetails[2].truncate( 14 ) );
					msgDetails[3]	= ipb.chat.formatName( msgDetails[4], msgDetails[3] );
					
					listItemVal	= ipb.chat.templates['msg-5'].evaluate( { username: msgDetails[2], date: _itemDate, extra: msgDetails[3] } );
				}

				/*
				 * Insert list item into list
				 */
				ulList.insert( { bottom: listItemVal } );

				/*
				 * Make sure new list has less li items than max allows
				 */
				if( ipb.chat.maxMessages > 0 )
				{
					/*
					 * Got more than we're allowed?
					 */
					if( ulList.childElements().length > ipb.chat.maxMessages )
					{
						/*
						 * Number to remove
						 */
						var _toRemove	= ulList.childElements().length - ipb.chat.maxMessages;
						
						/*
						 * Remove _toRemove elements from BEGINNING of the list (oldest messages)
						 */
						for( var tr=0; tr < _toRemove; tr++ )
						{
							ulList.firstDescendant().remove();
						}
					}
				}
		
				/*
				 * Insert the ulList into the storage container
				 */
				if( ipb.chat.activeTab != _thisRowId )
				{
					$('storage_container_' + _thisRowId ).update( ulList );
				}
				else
				{
					$('messages-display').update( ulList ).addClassName('messages-list');
				}
				
				/*
				 * Need to insert anywhere else?
				 */
				if( alsoTo )
				{
					var otherUlList	= ipb.chat.getStorageContainer( alsoTo );
					otherUlList.insert( { bottom: listItemVal } );
					
					if( ipb.chat.activeTab != alsoTo )
					{
						$('storage_container_' + alsoTo ).update( otherUlList );
					}
					else
					{
						$('messages-display').update( otherUlList ).addClassName('messages-list');
					}
				}
				
				/*
				 * Update the last time
				 */
				if( !ipb.chat.bypassFlag )
				{
					ipb.chat.lastTime	= _itemDate;
				}
			}
		}

		/*
		 * Update the messages-display div with the new list
		 */ 
		//$('messages-display').update( ipb.chat.getStorageContainer( ipb.chat.activeTab ).addClassName('messages-list') );

		/*
		 * Handle unread counts
		 */
		if( !ipb.chat.windowHasFocus && ipb.chat.unreadCount > 0 )
		{
			if( document.title.match( /\(\d+\) (.+?)/gi ) )
			{
				document.title = document.title.replace( /\(\d+\) (.+?)/gi, "(" + ipb.chat.unreadCount + ") $1" );
			}
			else
			{
				document.title = "(" + ipb.chat.unreadCount + ") " + document.title;
			}
		}
		
		/*
		 * Update unread counts on tabs
		 */
		ipb.chat.updateTabUnreadCount();
		
		/*
		 * Trigger sound if we have messages (not enter/leave room or mod kick notifications though)
		 */
		if( _updatedCount )
		{
			ipb.chat.triggerMessageSound();
		}
		
		/*
		 * Reset bypass flag if this was initial pull override
		 */
		if( _initialEmpty )
		{
			ipb.chat.bypassFlag	= false;
		}
		
		/*
		 * Make sure that if the only downloaded messages are private chats that we build the "chatroom" list properly too
		 */
		if( ipb.chat.getStorageContainer( 'chatroom' ).empty() )
		{
			var _whateverItWas	= ipb.chat.bypassFlag;
			ipb.chat.bypassFlag = true;
			ipb.chat.updateMessages( "1," + ipb.chat.lastMsgId + "~~||~~" + Math.round(new Date().getTime() / 1000) + ",2," + userName.replace( ',', '~~#~~' ) + ",,1_" + userId + "," + userId + "~~||~~" );
			ipb.chat.bypassFlag = _whateverItWas;
		}

		/*
		 * If we were at the bottom, let's make sure we're scrolled all the way down in case new items have
		 * been inserted, making the scrollable div taller
		 */
		if( scrollBottom )
		{
			Debug.write( "Scrolling down to: " + $('messages-display').scrollHeight );
			$('messages-display').scrollTop	= $('messages-display').scrollHeight + 500;
		}
		
		return true;
	},
	
	/*
	 * Update the unread count displayed on each tab
	 */
	updateTabUnreadCount: function()
	{
		ipb.chat.unreadTabs.set( ipb.chat.activeTab, 0 );
		
		ipb.chat.unreadTabs.each( function( pair ){
			if( pair.key == ipb.chat.activeTab )
			{
				var _thisHtml	= $('tab-' + pair.key ).innerHTML;

				if( _thisHtml.match( /(.+?) \(\d+\)\<\/a\>/gi ) )
				{
					_thisHtml = _thisHtml.replace( /(.+?) \(\d+\)\<\/a\>/gi, "$1</a>" );
				}
				
				$('tab-' + pair.key ).update( _thisHtml );
			
				return;
			}
			
			if( !$('tab-' + pair.key ) || !pair.value )
			{
				return;
			}
			
			var _thisHtml	= $('tab-' + pair.key ).innerHTML;

			if( _thisHtml.match( /(.+?) \(\d+\)\<\/a\>/gi ) )
			{
				_thisHtml = _thisHtml.replace( /(.+?) \(\d+\)\<\/a\>/gi, "$1 (" + pair.value + ")</a>" );
			}
			else
			{
				_thisHtml = _thisHtml.replace( /\<\/a\>/i, '' ) + " (" + pair.value + ")</a>";
			}
			
			$('tab-' + pair.key ).update( _thisHtml );
		});
		
		/*
		 * Reset click handlers
		 */
		$$('#chat-tab-bar a').each( function(elem) {
			id = elem.identify();

			if( $( id ) )
			{
				$( id ).stopObserving('click');
				$( id ).observe( "click", ipb.chat.switchTab );
			}
		});
	},
	
	/*
	 * Get the appropriate storage container
	 */
	getStorageContainer: function( tab )
	{
		if( !$( 'storage_' + tab ) )
		{
			return new Element( 'ul', { id: 'storage_' + tab } );
		}
		else
		{
			return new Element( 'ul', { id: 'storage_' + tab } ).update( $( 'storage_' + tab ).innerHTML );
		}
	},
	
	/*
	 * Add a user to the "Online chat users" list dynamically
	 */
	addUserToList: function( user_id, username, forum_user_id )
	{
		/*
		 * Only add if it doesn't exist
		 */
		if( !$('user_' + user_id) && !$('link_' + forum_user_id) )
		{
			var htmlFragment	= new Element( 'li', { id: 'user_' + user_id } );
			
			/*
			 * Initialize basic additions
			 */
			new Ajax.Request( 
								ipb.vars['base_url'] + "&app=ipchat&module=ajax&section=adduser&md5check=" + ipb.vars['secure_hash'] + "&id=" + forum_user_id + "&user=" + user_id, 
								{ 
									method: 'get',
									onSuccess: function(t)
									{
										/*
										 * Insert the username into the li
										 */
										if( Object.isUndefined( t.responseJSON ) )
										{
											// Well, this is bad.
											Debug.error("Invalid response returned from the server");
											return;
										}
										
										htmlFragment.update( t.responseJSON['html'] );

										ipb.chat.nameFormatting.set( user_id, [ t.responseJSON['prefix'], t.responseJSON['suffix'], t.responseJSON['name'] ] );
										ipb.chat.forumIdMap.set( user_id, [ forum_user_id, t.responseJSON['_canBeIgnored'] ] );

										$('online-chat-count').innerHTML	= parseInt( $('online-chat-count').innerHTML ) + 1;

										/*
										 * Set up private chat, block user, and mod links
										 */
										var modMenu	= new Element( 'ul', { 'class': 'kickmenu', id: 'mod_link_' + user_id + '_menucontent' } );
										
										if( user_id != userId )
										{
											if( ipb.chat.moderator )
											{
												var modML	= new Element( 'li' );
												var modLink	= new Element( 'a', { id: 'kick_user_' + user_id, 'class': 'kick_user', href: '#', title: ipb.lang['chat_kick_user'] } );
												modMenu		= modMenu.update( modML.update( modLink.update( "<img src='" + ipb.vars['img_url'] + "/user_delete.png' /> " + ipb.lang['chat_kick_user'] ) ) );
												
												var modML	= new Element( 'li' );
												var modLink	= new Element( 'a', { id: 'ban_user_' + user_id + '_' + forum_user_id, 'class': 'ban_user', href: '#', title: ipb.lang['chat_ban_user'] } );
												modMenu		= modMenu.insert( { bottom: modML.update( modLink.update( "<img src='" + ipb.vars['img_url'] + "/user_delete.png' /> " + ipb.lang['chat_ban_user'] ) ) } );
											}
											
											if( ipb.chat.private )
											{
												var modML	= new Element( 'li' );
												var modLink	= new Element( 'a', { id: 'priv_user_' + user_id + '_' + forum_user_id, 'class': 'priv_user', href: '#', title: ipb.lang['chat_priv_user'] } );
												modMenu		= modMenu.insert( { bottom: modML.update( modLink.update( "<img src='" + ipb.vars['img_url'] + "/user_comment.png' /> " + ipb.lang['chat_priv_user'] ) ) } );
											}
											
											if( ipb.chat.ignoreChats.get( forum_user_id ) )
											{
												var modML	= new Element( 'li' );
												var modLink	= new Element( 'a', { id: 'unblock_user_' + user_id + '_' + forum_user_id, 'class': 'block_user', href: '#', title: ipb.lang['unblock_priv_user'] } );
												modMenu		= modMenu.insert( { bottom: modML.update( modLink.update( "<img src='" + ipb.vars['img_url'] + "/comments_ignore.png' /> " + ipb.lang['unblock_priv_user'] ) ) } );
											}
											else
											{
												var modML	= new Element( 'li' );
												var modLink	= new Element( 'a', { id: 'block_user_' + user_id + '_' + forum_user_id, 'class': 'block_user', href: '#', title: ipb.lang['block_priv_user'] } );
												modMenu		= modMenu.insert( { bottom: modML.update( modLink.update( "<img src='" + ipb.vars['img_url'] + "/comments_ignore.png' /> " + ipb.lang['block_priv_user'] ) ) } );												
											}
										}
										else
										{
											var modML	= new Element( 'li' );
											modMenu		= modMenu.update( modML.update( '<em>' + ipb.lang['cant_kick_self'] + '</em>' ) );
										}
										
										$('mod-menu-container').insert( { bottom: modMenu } );
							
										/*
										 * Insert the new list item into the online users list, alphabetically
										 */
										var _hasBeenInserted	= false;
										
										$$('#chatters-online > li').each( function(elem) {
											if( !_hasBeenInserted )
											{
												if( ipb.chat.moderator )
												{
													var _name	= $(elem).firstDescendant().next().innerHTML.stripTags().replace( /\<\!--.+?--\>/ig, "" );

													if( username.toLowerCase() < _name.toLowerCase() )
													{
														$(elem).insert( { before: htmlFragment } );
														_hasBeenInserted	= true;
													}
												}
												else
												{
													var _name	= $(elem).innerHTML.stripTags().replace( /\<\!--.+?--\>/ig, "" );

													if( username.toLowerCase() < _name.toLowerCase() )
													{
														$(elem).insert( { before: htmlFragment } );
														_hasBeenInserted	= true;
													}
												}
											}
										});
										
										/*
										 * If hasn't been inserted, insert it at end of list
										 */
										if( !_hasBeenInserted )
										{
											$('chatters-online').insert( { bottom: htmlFragment } );
										}

										/*
										 * If we are a moderator, initialize the menu and then re-initialize
										 * the kick user links
										 */
										new ipb.Menu( $('mod_link_' + user_id ), $( 'mod_link_' + user_id + '_menucontent' ), {}, { afterOpen: ipb.chat.repositionModMenu } );
										
										ipb.chat.initKickLinks();
										
										/*
										 * Trigger sound
										 */
										ipb.chat.triggerEnterSound();
										
										/*
										 * Update count on tab
										 */
										if( $('chat-tab-count') )
										{
											var _curCount	= parseInt( $('chat-tab-count').innerHTML );
											var _newCount	= _curCount + 1;
											
											$('chat-tab-count').update( _newCount );
											$('chat-tab-count').writeAttribute( 'title', ipb.chat.templates['count-title'].evaluate({ count: _newCount }) );
										}
									}
								}
							);
		}
	},
	
	/*
	 * Remove a user from the "Online chat users" list dynamically
	 */
	removeUserFromList: function( user_id, username )
	{
		if( $('user_' + user_id) )
		{
			$('user_' + user_id).remove();
			
			if( $('mod_link_' + user_id + '_menucontent' ) )
			{
				$('mod_link_' + user_id + '_menucontent' ).remove();
			}
			
			$('online-chat-count').innerHTML	= parseInt( $('online-chat-count').innerHTML ) - 1;

			/*
			 * Trigger sound
			 */
			ipb.chat.triggerLeaveSound();

			/*
			 * Update count on tab
			 */
			if( $('chat-tab-count') )
			{
				var _curCount	= parseInt( $('chat-tab-count').innerHTML );
				var _newCount	= _curCount - 1;
				
				$('chat-tab-count').update( _newCount );
				$('chat-tab-count').writeAttribute( 'title', ipb.chat.templates['count-title'].evaluate({ count: _newCount }) );
			}
		}
	},
	
	/*
	 * Initialize the moderator kick user links
	 */
	initKickLinks: function()
	{
		/*
		 * First let's unregister all the click observers 
		 * since this will get built more than once per page load
		 */
		$$('.kick_user', '.ban_user', '.priv_user', '.block_user', '.unblock_user').each( function(elem) {
			$(elem).stopObserving('click');
		});
		
		/*
		 * Now we register kick user link handler
		 */
		$$('.kick_user').each( function(elem) {
			$(elem).observe( 'click', ipb.chat.kickUser );
		});
		
		$$('.ban_user').each( function(elem) {
			$(elem).observe( 'click', ipb.chat.banUser );
		});
		
		$$('.priv_user').each( function(elem) {
			$(elem).observe( 'click', ipb.chat.privateChat );
		});
		
		$$('.block_user').each( function(elem) {
			$(elem).observe( 'click', ipb.chat.blockPrivateChats );
		});
		
		$$('.unblock_user').each( function(elem) {
			$(elem).observe( 'click', ipb.chat.unblockPrivateChats );
		});
	},

	/*
	 * Unblock private chats from a particular user
	 */
	unblockPrivateChats: function(e)
	{
		Event.stop(e);
		
		/*
		 * Get user id from element ID
		 */
		var elem	= Event.findElement( e, 'a' );
		var elemId	= elem.id.replace( "block_user_", "" );
		var elemP	= elemId.split( '_' );	// 0 is chat user id, 1 is forum user id
		
		/*
		 * Close menu
		 */
		ipb.menus.closeAll();
		
		/*
		 * Can't kick self
		 */
		if( elemId == userId )
		{
			alert( ipb.lang['cant_kick_self'] );
			return false;
		}
		else
		{
			Debug.write( "Unblocked the user with id " + elemId );
		}
		
		/*
		 * Send block request to IPB
		 */
		new Ajax.Request( 
							ipb.vars['base_url'] + "app=ipchat&module=ajax&section=block&md5check=" + ipb.vars['secure_hash'] + "&id=" + elemP[1] + "&block=0", 
							{ method: 'post' }
						);
		
		/*
		 * And add to dynamic block list
		 */
		ipb.chat.ignoreChats.unset( elemP[1] );
		
		/*
		 * And lastly, update the menu
		 */
		$(elem).removeClassName('unblock_user').addClassName('block_user');
		$(elem).writeAttribute( { title: ipb.lang['block_priv_user'] } );
		$(elem).update( "<img src='" + ipb.vars['img_url'] + "/comments_ignore.png' /> " + ipb.lang['block_priv_user'] );
		
		/*
		 * Re-initialize kick links
		 */
		ipb.chat.initKickLinks();
		
		return false;
	},

	/*
	 * Block private chats from a particular user
	 */
	blockPrivateChats: function(e)
	{
		Event.stop(e);
		
		/*
		 * Get user id from element ID
		 */
		var elem	= Event.findElement( e, 'a' );
		var elemId	= elem.id.replace( "block_user_", "" );
		var elemP	= elemId.split( '_' );	// 0 is chat user id, 1 is forum user id
		
		var _forumUser	= ipb.chat.forumIdMap.get( elemP[0] );
		
		if( !_forumUser[1] )
		{
			alert( ipb.lang['cant_block_user'] );
			return false;
		}
		
		/*
		 * Close menu
		 */
		ipb.menus.closeAll();
		
		/*
		 * Can't kick self
		 */
		if( elemId == userId )
		{
			alert( ipb.lang['cant_kick_self'] );
			return false;
		}
		else
		{
			Debug.write( "Blocked the user with id " + elemId );
		}
		
		/*
		 * Send block request to IPB
		 */
		new Ajax.Request( 
							ipb.vars['base_url'] + "app=ipchat&module=ajax&section=block&md5check=" + ipb.vars['secure_hash'] + "&id=" + elemP[1] + "&block=1", 
							{ method: 'post' }
						);
		
		/*
		 * And add to dynamic block list
		 */
		ipb.chat.ignoreChats.set( elemP[1], elemP[1] );
		
		/*
		 * And lastly, update the menu
		 */
		$(elem).removeClassName('block_user').addClassName('unblock_user');
		$(elem).writeAttribute( { title: ipb.lang['unblock_priv_user'] } );
		$(elem).update( "<img src='" + ipb.vars['img_url'] + "/comments_ignore.png' /> " + ipb.lang['unblock_priv_user'] );
		
		/*
		 * Re-initialize kick links
		 */
		ipb.chat.initKickLinks();
		
		return false;
	},

	/*
	 * Initiate a private chat
	 */
	privateChat: function(e)
	{
		Event.stop(e);
		
		/*
		 * Get user id from element ID
		 */
		var elem	= Event.findElement( e, 'a' );
		var elemId	= elem.id.replace( "priv_user_", "" );
		var elemP	= elemId.split( '_' );	// 0 is chat user id, 1 is forum user id
		
		/*
		 * Close menu
		 */
		ipb.menus.closeAll();
		
		/*
		 * Can't send a private chat to yourself
		 */
		if( elemId == userId )
		{
			alert( ipb.lang['cant_kick_self'] );
			return false;
		}
		
		if( ipb.chat.privateChats.get( 'privchatwindow_' + elemP[0] ) )
		{
			ipb.chat.privateChats.get( 'privchatwindow_' + elemP[0] ).show();
		}
		else
		{
			ipb.chat.privateChats.set( 'privchatwindow_' + elemP[0], new ipb.Popup( 'privchatwindow_' + elemP[0], {
									type: 'balloon',
									initial: ipb.chat.templates['send_private'].evaluate({ id: elemP[0] }),
									stem: true,
									hideAtStart: false,
									attach: { target: $( 'mod_link_' + elemP[0] ), position: 'auto' },
									w: '400px'
							}) );
							
			ipb.chat.privateChats.get( 'privchatwindow_' + elemP[0] ).show();
			
			Event.observe( 'priv_chat_text_' + elemP[0], 'keypress', ipb.chat.checkForSendPrivateChat );

			new ipb.Menu( $('mod_link_' + elemP[0] ), $( 'mod_link_' + elemP[0] + '_menucontent' ), {}, { afterOpen: ipb.chat.repositionModMenu } );
			
			ipb.chat.initKickLinks();
		}
		
		return false;
	},
		
	/*
	 * Ban a user from the chat room
	 */
	banUser: function(e)
	{
		Event.stop(e);
		
		/*
		 * Get user id from element ID
		 */
		var elem	= Event.findElement( e, 'a' );
		var elemId	= elem.id.replace( "ban_user_", "" );
		var elemP	= elemId.split( '_' );	// 0 is chat user id, 1 is forum user id
		
		/*
		 * Close menu
		 */
		ipb.menus.closeAll();
		
		/*
		 * Can't kick self
		 */
		if( elemId == userId )
		{
			alert( ipb.lang['cant_kick_self'] );
			return false;
		}
		else
		{
			Debug.write( "Banned the user with id " + elemId );
		}
		
		/*
		 * Send ban request to IPB
		 */
		new Ajax.Request( 
							ipb.vars['base_url'] + "app=ipchat&module=ajax&section=ban&md5check=" + ipb.vars['secure_hash'] + "&id=" + elemP[1], 
							{ method: 'post' }
						);
		
		/*
		 * Send it to the server
		 */
		ipb.chat.sendMessageToChild( "server=" + serverHost + "&path=" + serverPath + "&room=" + roomId + "&user=" + userId + "&access_key=" + accessKey + "&action=kick&against=" + elemP[0] );
		
		return false;
	},
	
	/*
	 * Kick a user from the chat room
	 */
	kickUser: function(e)
	{
		Event.stop(e);
		
		/*
		 * Get user id from element ID
		 */
		var elem	= Event.findElement( e, 'a' );
		var elemId	= elem.id.replace( "kick_user_", "" );
		
		/*
		 * Close menu
		 */
		ipb.menus.closeAll();
		
		/*
		 * Can't kick self
		 */
		if( elemId == userId )
		{
			alert( ipb.lang['cant_kick_self'] );
			return false;
		}
		else
		{
			Debug.write( "Kicked the user with id " + elemId );
		}
		
		/*
		 * Send it to the server
		 */
		ipb.chat.sendMessageToChild( "server=" + serverHost + "&path=" + serverPath + "&room=" + roomId + "&user=" + userId + "&access_key=" + accessKey + "&action=kick&against=" + elemId );
		
		return false;
	},
	
	/*
	 * "Clean" messages to preserve certain things
	 */
	cleanMessage: function( message )
	{
		message	= message.replace( /\r/g, '' );
		message	= message.replace( /\n/g, "__N__" );
		message	= message.replace( /,/g, "__C__" );
		message	= message.replace( /=/g, "__E__" );
		message	= message.replace( /\+/g, "__PS__" );
		message	= message.replace( /&/g, "__A__" );
		message	= message.replace( /%/g, "__P__" );
		
		return message;
	},
	
	/*
	 * "UN-Clean" messages to restore certain things
	 */
	unCleanMessage: function( message )
	{
		message	= message.replace( /__N__/g, "<br />" );
		message	= message.replace( /__C__/g, "," );
		message	= message.replace( /__E__/g, "=" );
		message	= message.replace( /__A__/g, "&" );
		message	= message.replace( /__P__/g, "%" );
		message	= message.replace( /__PS__/g, "+" );

		return message;
	},
				
	/*
	 * Verify a URL is valid
	 */
	isValidUrl: function( url )
	{
		Debug.write( "Checking url: " + url );
		
		var regexp = /(https?|ftp|file):\/\/([^<>\"\s]+|[a-z0-9/\._\- !&\#;,%\+\?:=])/i;

		return regexp.test( url );
	},
	
	/*
	 * Parse bbcode and emoticons
	 */
	parseEmoticonsAndBbcode: function( text )
	{
		/*
		 * First we have to parse out and store url bbcode tags, not replace
		 */
		var urlReplacements	= $H();
		var iteration		= 0;
		
		while( text.match( /\[url\](.+?)\[\/url\]/gi ) )
		{
			var matches	= /\[url\](.+?)\[\/url\]/gi.exec( text );
	
			if( matches != null )
			{
				matches[1]	= matches[1].replace( /&quot;/g, '' );

				if( ipb.chat.isValidUrl( matches[1] ) )
				{
					urlReplacements.set( "__URL" + iteration + "__", "<a target='_blank' class='bbc' href='" + matches[1] + "'>" + matches[1] + "</a>" );
					text	= text.replace( matches[0], "__URL" + iteration + "__" );
					iteration++;
				}
				else
				{
					text	= text.replace( matches[0], matches[1] );
				}
			}
		}

		while( text.match( /\[url=(.+?)\](.+?)\[\/url\]/gi ) )
		{		
			var matches	= /\[url=(.+?)\](.+?)\[\/url\]/gi.exec( text );
	
			if( matches != null )
			{
				matches[1]	= matches[1].replace( /&quot;/g, '' );

				if( ipb.chat.isValidUrl( matches[1] ) )
				{
					urlReplacements.set( "__URL" + iteration + "__", "<a target='_blank' class='bbc' href='" + matches[1].replace( /"/gi, '' ).replace( /&quot;/gi, '' ) + "'>" + matches[2] + "</a>" );
					text	= text.replace( matches[0], "__URL" + iteration + "__" );
					iteration++;
				}
				else
				{
					text	= text.replace( matches[0], matches[1] );
				}
			}
		}

		/*
		 * Now we parse the raw URLs
		 */
		var exp = /(\b(https?|ftp|file):\/\/([^<>\"\s]+|[a-z0-9/\._\- !&\#;,%\+\?:=]+))/ig;
		text	= text.replace(exp,"<a target='_blank' class='bbc' href='$1'>$1</a>" ); 

		/*
		 * And lastly, loop through and replace stored bbcode url tags
		 */
		urlReplacements.each( function(pair)
		{
			text	= text.replace( pair.key, pair.value );
		});
		
		/*
		 * IMG tags
		 * Images aren't very smooth - they redownload each time a new chat is inserted, and larger (slower)
		 * images this becomes very noticeable for.  Shelving img tag support until a later version when we can
		 * handle them differently.
		 */
		/*while( text.match( /\[img\](.+?)\[\/img\]/gi ) )
		{		
			var matches	= /\[img\](.+?)\[\/img\]/gi.exec( text );
	
			if( matches != null )
			{
				if( ipb.chat.isValidUrl( matches[1] ) )
				{
					var randId	= Math.floor(Math.random()*999999999);
					
					text	= text.replace( matches[0], "<img class='bbc_img' id='img_" + randId + "' src='" + matches[1] + "' />" );
					
					ipb.chat.resizeImage( randId );
				}
				else
				{
					text	= text.replace( matches[0], matches[1] );
				}
			}
		}*/

		/*
		 * Other basics
		 */
		text	= text.replace( /\[b\](.+?)\[\/b\]/gi, "<strong class='bbc'>$1</strong>" );
		text	= text.replace( /\[i\](.+?)\[\/i\]/gi, "<em class='bbc'>$1</em>" );
		text	= text.replace( /\[u\](.+?)\[\/u\]/gi, "<u class='bbc'>$1</u>" );
		
		/*
		 * Emoticons...
		 */
		text	= text.replace( '!', '&#33;' );
		
		ipb.chat.emoticons.each( function(emoticon) {
			var _tmp	= emoticon.value.split(',');
			
			/*
			 * We need to capture opening and closing space
			 */
			var img		= "$1<img src='" + ipb.vars['emoticon_url'] + '/' + _tmp[1] + "' class='bbc' />$2";
			
			var _regexp	= new RegExp( "(^|\\s)" + RegExp.escape(emoticon.key) + "(\\s|$)", "gi" );
			
			while( text.match( _regexp ) )
			{
				text	= text.replace( _regexp, img );
			}
		});
		
		/*
		 * Bad words...
		 */
		var badwordReplacements	= $H();
		var iteration			= 0;
		
		ipb.chat.badwords.each( function(badword) {
			if( !badword.value[1] )
			{
				badword.value[1]	= '######';
			}
			
			/*
			 * Have to treat 'ass' special, due to HTML use of 'class'
			 */
			if( badword.key == 'ass' )
			{
				if( badword.value[0] )
				{
					var pattern	= '(\\b|!|\\?|\\.|,|$)' + RegExp.escape( String.reverse( badword.key ) ) + '(?!lc)(^|\\b|\\s)';
				}
				else
				{
					var pattern	= RegExp.escape( String.reverse( badword.key ) ) + '(?!lc)';
				}

				var _test	= String.reverse( text );
				var _regexp	= new RegExp( pattern, "gi" );

				while( matches = _regexp.exec( _test ) )
				{
					if( matches != null )
					{
						if( badword.value[0] )
						{
							badwordReplacements.set( "__BW" + iteration + "__", String.reverse( matches[2] ) + badword.value[1] + String.reverse( matches[1] ) );
						}
						else
						{
							badwordReplacements.set( "__BW" + iteration + "__", badword.value[1] );
						}
						
						_test	= _test.replace( matches[0], "__" + iteration + "WB__" );

						iteration++;
					}
				}
				
				text	= String.reverse( _test );
				return;
			}

			if( badword.value[0] )
			{
				var pattern	= '(^|\\b|\\s)' + RegExp.escape(badword.key) + '(\\b|!|\\?|\\.|,|$)';
			}
			else
			{
				var pattern	= RegExp.escape(badword.key);
			}
			
			var _regexp	= new RegExp( pattern, "gi" );
			
			while( matches = _regexp.exec( text ) )
			{
				if( matches != null )
				{
					if( badword.value[0] )
					{
						badwordReplacements.set( "__BW" + iteration + "__", matches[1] + badword.value[1] + matches[2] );
					}
					else
					{
						badwordReplacements.set( "__BW" + iteration + "__", badword.value[1] );
					}
					
					text	= text.replace( matches[0], "__BW" + iteration + "__" );
					iteration++;
				}
			}
		});

		badwordReplacements.each( function(pair)
		{
			text	= text.replace( pair.key, pair.value );
		});

		return text;
	},
	
	/*
	 * Format user name
	 */
	formatName: function( _user_id, _user_name )
	{
		var _details	= ipb.chat.nameFormatting.get( _user_id );

		if( _details )
		{
			return _details[0].replace( /__DBQ__/g, '"' ) + _user_name + _details[1].replace( /__DBQ__/g, '"' );
		}
		
		return _user_name;
	},

	/*
	 * Ping the IPB installation in order to update "who's chatting"
	 */
	ping: function( pe )
	{
		/*
		 * If kicked, shut off executer
		 */
		if( ipb.chat.kicked )
		{
			pe.stop();
			return false;
		}
		
		new Ajax.Request( 
						ipb.vars['base_url'] + "app=ipchat&module=ajax&section=update&md5check="+ipb.vars['secure_hash'], 
						{ method: 'get' }
						);
	},

	/*
	 * This is here mainly for Safari.  In Safari, it automatically encodes chars
	 * and they are not valid for decodeURI/decodeURIComponent.
	 * Example: teraßyte becomes tera%DFyte
	 * This function will decode those characters
	 */
	manualDecode: function( string )				
	{
		string	= string.replace( /\%([a-zA-Z0-9]{2})/gi, function( hex ) {
						return String.fromCharCode( parseInt( hex.replace( '%', '' ), 16 ) );
					});

		return string;
	},
	
	/*
	 * Attempt to fix position of moderator menu *sigh*
	 */
	repositionModMenu: function( menu )
	{
		/*
		 * Top position is only one we have trouble with >.<
		 */
		var _top	= $( menu.target ).getStyle('top').replace( /px/, '' );
		var _cont	= $('chatters-online-wrap').scrollTop;
		
		Debug.write( "Online chatters current top pos: " + _top );
		Debug.write( "Online chatters scroll offset: " + _cont );
		Debug.write( "New top pos: " + (_top - _cont) );
		
		$( menu.target ).setStyle( 'top:'  + (_top - _cont) + 'px;' );
	}
}

ipb.chat.init();