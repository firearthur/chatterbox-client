
const BASEURL = 'http://parse.la.hackreactor.com/chatterbox/classes';



const getMessages = (asOf) => {

  $.ajax({
  // This is the url you should use to communicate with the parse API server.
    url: `${BASEURL}/messages`,
    type: 'GET',
    data: 'order=-createdAt',
    contentType: 'application/json',
    success: function (data) {
      console.log('chatterbox: Messages recieved');
      console.log(data);
      displayNewMessages(data.results);
    },
    error: function (data) {
      // See: https://developer.mozilla.org/en-US/docs/Web/API/console.error
      console.error('chatterbox: Failed to retrieve messages', data);
    }
  });
};

const displayNewMessages = (data, limit) => {
  let $target = $('#feed');
  let messages = data.map((message) => {
    return composeMessageDisplay(message);
  });
  messages = messages.slice(0, 2);
  messages.forEach( ($message) => {
    $target.append($message);
  });
};

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


// get my information

// manage my account

// get messages

// display messages

// post messages



$(document).ready( () => {
  $('.getMessages').on('click', getMessages);
  $('.currentTime').text(moment());
});
