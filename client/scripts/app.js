
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

const cleanText = (text) => {
  return _.escape(text);
};

const dateFromNow = function (date) {
  var now = moment(new Date());
  var created = moment(date);
  return created.from(now);
};

//-----------------------------------------------------------------------

const app = {
  state: {
    user: "Eminem",
    activeRoom: '',
    messages: {},
    lastRequest: null,
    rooms: new Set(),
    users: new Set(),
    friends: new Set(),
  },
  server: 'http://parse.la.hackreactor.com/chatterbox/classes/messages',
  $feed: $('#feed')

};

// application state
//    who am i 
//    what am i looking at 
//    who are my friends

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
  let request = {
    order: '-createdAt',
    limit: 25,
  };
  if ( app.state.activeRoom ) { request.where = { roomname: app.state.activeRoom }; }

  $.ajax({
    // This is the url you should use to communicate with the parse API server.
    url: `${BASEURL}/messages`,
    type: 'GET',
    data: request,
    contentType: 'application/json',
    success: function (data) {
      console.log('chatterbox: Messages recieved');
      console.log(data);
      app.renderMessages(data.results);
    },
    error: function (data) {
      // See: https://developer.mozilla.org/en-US/docs/Web/API/console.error
      console.error('chatterbox: Failed to retrieve messages', data);
    }
  });
};

app.clearMessages = function() {
  this.state.messages = [];
  $('#chats').empty();
};


app.renderMessages = function(data = []) {
  let $target = $('#chats');
  data.forEach( (message) => {
    if ( message.text.trim() ) {
      if ( !this.state.messages[message.objectId] ) {
        this.state.messages[message.objectId] = true; // consider caching message 
        this.renderMessage(message);
      }
    }
    // if ( !this.state.rooms.has(message.roomname) ) {
    //   this.addRoom(message.roomname);
    //   this.refreshRooms();
    // }
  });
};

/*


<div class="card">
  <div class="card-block">
    <h4 class="card-title">Card title</h4>
    <h6 class="card-subtitle mb-2 text-muted">Card subtitle</h6>
    <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
    <a href="#" class="card-link">Card link</a>
    <a href="#" class="card-link">Another link</a>
  </div>
</div>

*/

app.renderMessage = function(message) {

  let $messageCard = $('<div></div>');
  $messageCard.addClass('card');

  $message = $('<div></div>');
  $message.addClass('card-block message');

  let userName = cleanText(message.username);
  if ( this.state.friends.has(userName) ) {
    $message.addClass('friend');
  }
  let $user = $('<h4></h4>');
  $user.addClass('username card-title message__user');
  $user.text(userName);

  let $room = $('<h5></h5>');
  $room.addClass('room card-subtitle mb-2 text-muted');
  $room.text(cleanText(message.roomname));

  let dateText = dateFromNow(message.createdAt);
  let $date = $('<span></span>');
  $date.addClass('message__date');
  $date.text(dateText);

  let messageText = cleanText(message.text);
  let $text = $('<p></p>').text(messageText);
  $text.addClass('message__text');

  $message.append($user).append($room).append($text).append($date);
  $messageCard.append($message);
  $('#chats').prepend($messageCard);

  // check for new users
  // check for new room
};

app.renderRoom = function(room) {
  if ( !this.state.rooms.has(room) ) {
    this.addRoom(room);
  }
  this.state.activeRoom = room;
  this.refreshRooms();

  this.clearMessages();
  this.renderMessages();
};

app.addRoom = function(name) {
  this.state.rooms.add(name);
};

app.refreshRooms = function() {
  $('#roomSelect').empty();
  this.state.rooms.forEach((room) => { 
    let isActive = room === this.state.activeRoom ? 'active' : '';
    $('#roomSelect').append($(`<option ${isActive}>${room}</option>`));
    $('#roomName').val('');    
  });
};

app.handleUsernameClick = function() {

};

app.handleSubmit = function() {
  let formValue = $('#send .submit').val();
  if (formValue.trim()) {
    let message = {
      username: app.state.user,
      text: formValue,
      roomname: app.state.activeRoom
    };
    app.send(message);
    $('messageText').val('');
  }
};

app.init = function() {
  $(document).ready(() => {
    $('.getMessages').on('click', app.fetch);
    $('.currentTime').text(moment());
    $('.clearMessages').on('click', app.clearMessages);
    $('.username').on('click', app.handleUsernameClick);
    app.refreshRooms();
    $('#send .submit').on('submit', app.handleSubmit);
    $('#submitRoomName').on('click', function () { 
      let room = $('#roomName').val();
      if ( room.trim() ) {
        room = cleanText(room.trim());
        app.addRoom(room);
      }
    });
    app.renderRoom('lobby');
    setInterval(app.fetch, 2000);
    // populate room list
    //    built from messages we found
    // populate user list
    //    built from messages we found
    // bound add-room function to a button somewhere
    //    sets current room state

  });
};

app.init();

