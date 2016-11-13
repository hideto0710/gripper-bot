
var ReplyMessages = {
  AlreadyAttend: [
    'あれ、今日はもう出勤しているみたいだよ。',
    'また出勤したいの？でも、僕にはその力がないみたいだ。',
    '落ち着いて、もう今日は出勤できてるよ。'
  ],
  AlreadyLeft: [
    '出退勤は1日1回で十分だよ。',
    'うぃぼ。'
  ],
  NothingToDo: [
    'そんなこと言われても。僕はまだ出退勤しかできないんだ。',
    '僕にどうして欲しいんだい？',
    'もっと色々して欲しかったら僕を改良してよ。'
  ],
  random: function (arr) {
    var index = Math.floor(Math.random() * arr.length) ;
    return arr[index];
  }
};

module.exports = ReplyMessages;
