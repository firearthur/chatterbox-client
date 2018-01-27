
const BASEURL = 'http://parse.la.hackreactor.com/chatterbox/classes';



const composeMessageDisplay = (message) => {
  let $message = $('<div></div>');
  $message.addClass('message');

  let userName = cleanText(message.username);
  let $user = $('<span></span>');
  $user.addClass('message__user');
  $user.text(userName);

  let dateText = dateFromNow(message.createdAt);
  let $date = $('<span></span>');
  $date.addClass('message__date');
  $date.text(dateText);

  let messageText = cleanText(message.text);
  let $text = $('<p></p>').text(messageText);
  $text.addClass('message__text');

  $message.append($user).append($text).append($date);
  return $message;
};

/*
&, <, >, ", ', `, , !, @, $, %, (, ), =, +, {, }, [, and ]
*/

const cleanText = (text) => {
  let htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '=': '&#61;',
    '{': '&#123;',
    '}': '&#125;',
    '+': '&#43;',
    '(': '&#40;',
    ')': '&#41;',
    '@': '&#64;',
    '!': '&#33;',
    '$': '&#36;',
    '%': '&#37;'
  };
  let htmlEscaper = /[&<>"'={}+()!@$%\/]/g;
  escape = function (string) {
    return ('' + string).replace(htmlEscaper, function (match) {
      return htmlEscapes[match];
    });
  };
  return escape(text);
};

const dateFromNow = function (date) {
  let now = moment(new Date());
  let created = moment(date);
  return created.from(now);
};

//-----------------------------------------------------------------------

const app = {
  state: {
    user: "Eminem",
    activeRoom: '',
    messages: {},
    messageList: [],
    renderedMessages: [],
    lastRequest: null,
    rooms: new Set(),
    users: new Set(),
    friends: new Set(),
    paused: false
  },
  server: 'http://parse.la.hackreactor.com/chatterbox/classes/messages',
  $feed: $('#feed')

};

app.send = function (message) {
  $.ajax({
    url: `${BASEURL}/messages`,
    type: 'POST',
    data: JSON.stringify(message),
    contentType: 'application/json',
    success: function (data) {
      console.log('message sent', data);

      $('#messageText').val('');
    },
    error: function (data) {
      // See: https://developer.mozilla.org/en-US/docs/Web/API/console.error
      console.error('chatterbox: Failed to send messages', data);
    }
  });
};

app.fetch = function() {
  if ( !app.state.paused ) {
    let request = {
      order: '-createdAt',
      limit: 25,
    };
    if ( app.state.activeRoom ) { 
      request.where = { roomname: app.state.activeRoom };
      console.log(`querying for messages with room: ${app.state.activeRoom}`); 
    }

    $.ajax({
      // This is the url you should use to communicate with the parse API server.
      url: `${BASEURL}/messages`,
      type: 'GET',
      data: request,
      contentType: 'application/json',
      success: function (data) {
        console.log('chatterbox: Messages recieved');
        console.log(data);
        app.processFeed(data.results);
      },
      error: function (data) {
        // See: https://developer.mozilla.org/en-US/docs/Web/API/console.error
        console.error('chatterbox: Failed to retrieve messages', data);
      }
    });
  }
};

app.clearMessages = function() {
  this.state.messages = {};
  this.state.messageList = [];
  this.state.renderedMessages = [];
  $('#chats').empty();
};

app.processFeed = function(data = []) {
  data.forEach( (message) => {
    if ( message.text && message.text.trim() ) {
      if ( !this.state.messages[message.objectId] ) {
        this.state.messageList.push(message.objectId);
        this.state.messages[message.objectId] = message; // consider caching message 
      }
    }
    if ( !this.state.rooms.has(message.roomname) ) {
      this.addRoom(roomname);
    }
  });
  app.refreshRooms();
  app.renderMessages();
};

app.renderMessages = function() {
  this.state.messageList.reverse();
  this.state.messageList.forEach(function(messageId) {
    if ( !app.state.renderedMessages.includes(messageId) ) {
      app.renderMessage(app.state.messages[messageId]);
      app.state.renderedMessages.push(messageId);
    }
  });
};

app.renderMessage = function(message) {

  let $messageCard = $('<div></div>');
  $messageCard.addClass('card card-block');

  $message = $('<div></div>');
  $message.addClass('message');

  let userName = cleanText(message.username);
  if ( this.state.friends.has(userName) ) {
    $messageCard.addClass('friend alert-info');
  }
  $messageCard.attr('data-username', userName);
  $messageCard.attr('data-message-id', message.objectId);
  let $user = $('<span></span>');
  $user.addClass('username');
  $user.text(userName);

  let $messageDetails = $('<div></div>');

  let $room = $('<small></small>');
  $room.addClass('room message__room mb-2 text-muted text-left');
  $room.text(cleanText(message.roomname));

  let dateText = dateFromNow(message.createdAt);
  let $date = $('<small></small>');
  $date.addClass('message__date text-muted text-right');
  $date.text(dateText);

  let messageText = cleanText(message.text);
  let $text = $('<p></p>').html(messageText);
  $text.addClass('message__text');

  $message.append($user).append($text);
  $messageDetails.append($room).append($date);
  $messageCard.append($message).append($messageDetails);
  $('#chats').prepend($messageCard);

  // check for new users
  // check for new room
};

app.renderRoom = function(room) {
  console.log(`visiting ${room}`);
  if ( !this.state.rooms.has(room) ) {
    this.addRoom(room);
  }
  this.state.activeRoom = room;
  this.refreshRooms();
  $('#roomName').val(''); 

  this.clearMessages();
  this.renderMessages();
};

app.addRoom = function(name) {
  this.state.rooms.add(name);
};

app.refreshRooms = function() {
  $('#roomSelect').empty();
  this.state.rooms.forEach((room) => { 
    let isActive = room === this.state.activeRoom ? 'selected' : '';
    $('#roomSelect').append($(`<option ${isActive}>${room}</option>`));   
  });
};

app.handleUsernameClick = function(username) {
  $(`[data-username*="${username}"]`).toggleClass('friend alert-info');
};


app.handleSubmit = function() {
  let formValue = $('#messageText').val();
  if (formValue.trim()) {
    let message = {
      username: app.state.user,
      text: formValue,
      roomname: app.state.activeRoom
    };
    app.send(message);
    $('#messageText').val('');
  }
};

app.init = function() {
  $(document).ready(() => {
    $('.getMessages').on('click', app.fetch);
    $('.currentTime').text(moment());
    $('.clearMessages').on('click', app.clearMessages);
    $('.username').on('click', app.handleUsernameClick.bind($(this)));
    app.refreshRooms();
    $('#send').on('submit', function(e) {
      console.log('hello');
      e.preventDefault();
      app.handleSubmit();
    });
    $('#rooms').on('submit', function (e) { 
      e.preventDefault();
      let room = $('#roomName').val();
      if ( room.trim() ) {
        room = cleanText(room.trim());
        app.addRoom(room);
        app.renderRoom(room);
      }
    });
    $('#roomSelect').on('change', function(e) {
      let currentRoom = $(this).val();
      app.renderRoom(currentRoom);
    });
    $('body').on('click','.username' ,function (e) {
      console.log('Heeeeeeeeeeeey');
      app.state.friends.add($(this).text());
      app.handleUsernameClick($(this).text());
    });

    $('#pause').on('click', function(e) {
      e.preventDefault();
      app.state.paused = app.state.paused === true ? false : true;
      console.log(`FETCH: ${app.state.paused}`);
    })
    app.renderRoom('lobby');
    setInterval(app.fetch, 2000);

  });
};

app.init();

