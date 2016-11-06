if (!process.env.token) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}
var Botkit = require('./lib/Botkit.js');
var os = require('os');
var controller = Botkit.slackbot({
  debug: true,
});
var bot = controller.spawn({ token: process.env.token }).startRTM();

var Gripper = require('./beat-gripper/Gripper.js');
var gripper = new Gripper(process.env.apiKey, process.env.apiUrl, process.env.apiUser);

var UserStorage = require('./beat-gripper/UserStorage.js');
var userStorage = new UserStorage(process.env.MONGODB_URI, process.env.secret, process.env.scheme);

controller.hears(['出勤'], 'direct_message,direct_mention,mention', function(bot, message) {
  userStorage.get(message.user, function(err, users) {
    if (users.length === 0) {
      bot.reply(message, 'I do not know your password yet!');
      bot.reply(message, 'Say `my password is ***`');
    } else {
      var password = users[0].password;
      gripper.attend(password, function(error, response, body) {
        switch (response.statusCode){
          case 400:
            bot.reply(message, body.errorMessage);
            break;
          case 401:
            bot.reply(message, body.errorMessage);
            break;
          case 200:
            bot.api.reactions.add({ timestamp: message.ts, channel: message.channel, name: 'robot_face' },
              function(err) {
                if (err) bot.botkit.log('Failed to add emoji reaction :(', err);
              });
            break;
          default:
            bot.reply(message, 'unhandled error occurred.');
            break;
        }
      });
    }
  });
});

controller.hears(['退勤'], 'direct_message,direct_mention,mention', function(bot, message) {
  userStorage.get(message.user, function(err, users) {
    if (users.length === 0) {
      bot.reply(message, 'I do not know your password yet!');
      bot.reply(message, 'Say `my password is ***`');
    } else {
      var password = users[0].password;
      gripper.leave(password, function (error, response, body) {
        switch (response.statusCode) {
          case 400:
            bot.reply(message, body.errorMessage);
            break;
          case 401:
            bot.reply(message, body.errorMessage);
            break;
          case 200:
            bot.api.reactions.add({timestamp: message.ts, channel: message.channel, name: 'robot_face'},
              function (err) {
                if (err) bot.botkit.log('Failed to add emoji reaction :(', err);
              });
            break;
          default:
            bot.reply(message, 'unhandled error occurred.');
            break;
        }
      });
    }
  });
});

controller.hears(['my password is (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
  var password = message.match[1];
  userStorage.get(message.user, function(err, users) {
    if (users.length === 0) {
      userStorage.set(message.user, password, function(err, results) {
        console.log(results);
        bot.reply(message, 'Got it. I remember your password is ' + password);
      });
    } else {
      userStorage.update(message.user, password, function(err, results) {
        console.log(results);
        bot.reply(message, 'Got it. I remember your password is ' + password);
      });
    }
  });
});

controller.hears(['what is my password'], 'direct_message,direct_mention,mention', function(bot, message) {
  userStorage.get(message.user, function(err, users) {
    if (users.length !== 0) {
      bot.reply(message, 'Your password is ' + users[0].password);
    } else {
      bot.startConversation(message, function(err, convo) {
        if (!err) {
          convo.say('I do not know your password yet!');
          convo.ask('What is your password?', function(response, convo) {
            convo.ask('Your password is `' + response.text + '`?', [
              {
                pattern: 'yes',
                callback: function(response, convo) {
                  convo.next();
                }
              },
              {
                pattern: 'no',
                callback: function(response, convo) {
                  convo.stop();
                }
              },
              {
                default: true,
                callback: function(response, convo) {
                  convo.repeat();
                  convo.next();
                }
              }
            ]);
            convo.next();
          }, {'key': 'password'});
          convo.on('end', function(convo) {
            if (convo.status == 'completed') {
              bot.reply(message, 'OK! I will update my dossier...');
              userStorage.get(message.user, function(err, user) {
                var password = convo.extractResponse('password');
                if (users.length === 0) {
                  userStorage.set(message.user, password, function(err, results) {
                    console.log(results);
                    bot.reply(message, 'Got it. I remember your password is ' + password);
                  });
                } else {
                  userStorage.update(message.user, password, function(err, results) {
                    console.log(results);
                    bot.reply(message, 'Got it. I remember your password is ' + password);
                  });
                }
              });
            } else {
              bot.reply(message, 'OK, nevermind!');
            }
          });
        }
      });
    }
  });
});

controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
  'direct_message,direct_mention,mention', function(bot, message) {
    var hostname = os.hostname();
    var uptime = formatUptime(process.uptime());
    bot.reply(message,
      ':robot_face: I am a bot named <@' + bot.identity.name +
      '>. I have been running for ' + uptime + ' on ' + hostname + '.');
  }
);

function formatUptime(uptime) {
  var unit = 'second';
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'minute';
  }
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'hour';
  }
  if (uptime != 1) {
    unit = unit + 's';
  }
  uptime = uptime + ' ' + unit;
  return uptime;
}
