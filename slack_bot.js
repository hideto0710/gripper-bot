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

var Jobcan = require('./beat-gripper/Jobcan.js');
var jobcan = new Jobcan(process.env.apiKey, process.env.apiJobcanUrl, process.env.apiJobcanClient);

var UserStorage = require('./beat-gripper/UserStorage.js');
var userStorage = new UserStorage(process.env.MONGODB_URI, process.env.secret, process.env.scheme);

var ReplyMessages = require('./messages.js');

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
            if (body.errorMessage.match(/出勤中/)) {
              bot.reply(message, ReplyMessages.random(ReplyMessages.AlreadyAttend));
            } else if (body.errorMessage.match(/退勤/)) {
              bot.reply(message, ReplyMessages.random(ReplyMessages.AlreadyLeft));
            }
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

controller.hears(['jobcan出'], 'direct_message,direct_mention,mention', function(bot, message) {
  userStorage.get(message.user, function(err, users) {
    if (users.length === 0) {
      bot.reply(message, 'I do not know your password yet!');
      bot.reply(message, 'Say `my password is ***`');
    } else if (!users[0].jobcanUser) {
      bot.reply(message, 'I do not know your jobcan user yet!');
      bot.reply(message, 'Say `my jobcan user is ***`');
    } else {
      var password = users[0].password;
      var jobcanUser = users[0].jobcanUser;
      jobcan.attend(jobcanUser, password, function(error, response, body) {
        switch (response.statusCode){
          case 400:
            if (body.errorMessage.match(/working/)) {
              bot.reply(message, ReplyMessages.random(ReplyMessages.AlreadyAttend));
            } else if (body.errorMessage.match(/resting/)) {
              bot.reply(message, ReplyMessages.random(ReplyMessages.AlreadyLeft));
            }
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
            if (body.errorMessage.match(/未だ出勤/)) {
              bot.reply(message, ReplyMessages.random(ReplyMessages.NotYet));
            } else if (body.errorMessage.match(/退勤/)) {
              bot.reply(message, ReplyMessages.random(ReplyMessages.AlreadyLeft));
            }
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

controller.hears(['jobcan退'], 'direct_message,direct_mention,mention', function(bot, message) {
  userStorage.get(message.user, function(err, users) {
    if (users.length === 0) {
      bot.reply(message, 'I do not know your password yet!');
      bot.reply(message, 'Say `my password is ***`');
    } else if (!users[0].jobcanUser) {
      bot.reply(message, 'I do not know your jobcan user yet!');
      bot.reply(message, 'Say `my jobcan user is ***`');
    } else {
      var password = users[0].password;
      var jobcanUser = users[0].jobcanUser;
      jobcan.leave(jobcanUser, password, function (error, response, body) {
        switch (response.statusCode) {
          case 400:
            if (body.errorMessage.match(/having_breakfast/)) {
              bot.reply(message, ReplyMessages.random(ReplyMessages.NotYet));
            } else if (body.errorMessage.match(/resting/)) {
              bot.reply(message, ReplyMessages.random(ReplyMessages.AlreadyLeft));
            }
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
        bot.reply(message, 'Got it. I remember your password is ' + password);
      });
    } else {
      userStorage.update(message.user, password, function(err, results) {
        bot.reply(message, 'Got it. I remember your password is ' + password);
      });
    }
  });
});

controller.hears(['my jobcan user is (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
  var jobcanUser = message.match[1];
  userStorage.get(message.user, function(err, users) {
    if (users.length === 0) {
      userStorage.setJobcan(message.user, jobcanUser, function(err, results) {
        bot.reply(message, 'Got it. I remember your jobcan user is ' + jobcanUser);
      });
    } else {
      userStorage.updateJobcan(message.user, jobcanUser, function(err, results) {
        bot.reply(message, 'Got it. I remember your jobcan user is ' + jobcanUser);
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

controller.hears(['ありがとう', 'サンキュー', 'thanks', 'thank you', 'thx'],
  'direct_message,direct_mention,mention', function(bot, message) {
    bot.reply(message, ReplyMessages.random(ReplyMessages.ThankYou));
  }
);

controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
  'direct_message,direct_mention,mention', function(bot, message) {
    var hostname = os.hostname();
    var uptime = formatUptime(process.uptime());
    bot.reply(message,
      ':robot_face: I am a bot named <@' + bot.identity.name +
      '>. I have been running for ' + uptime + ' on ' + hostname + '.');
  }
);

controller.hears('', 'direct_message,direct_mention,mention', function(bot, message) {
    bot.reply(message, ReplyMessages.random(ReplyMessages.NothingToDo));
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
