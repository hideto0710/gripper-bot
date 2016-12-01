var MongoClient = require('mongodb').MongoClient;
var crypto = require('crypto');
var CharacterCode = 'utf8';
var CharacterCode2 = 'hex';

function UserStorage(mongoUrl, secret, scheme) {
  function crypt(planeText) {
    var cipher = crypto.createCipher(scheme, secret);
    cipher.update(planeText, CharacterCode, CharacterCode2);
    return cipher.final(CharacterCode2);
  }
  function decrypt(cryptedText) {
    var decipher = crypto.createDecipher(scheme, secret);
    decipher.update(cryptedText, CharacterCode2, CharacterCode);
    return decipher.final(CharacterCode);
  }

  this.set = function (userId, password, callback) {
    MongoClient.connect(mongoUrl, function(err, db) {
      var collection = db.collection('users');
      collection.insertMany([ { 'user_id': userId, password: crypt(password) } ], callback);
    });
  };

  this.update = function (userId, password, callback) {
    MongoClient.connect(mongoUrl, function(err, db) {
      var collection = db.collection('users');
      collection.updateOne({ 'user_id': userId }, { $set: { password : crypt(password) } }, callback);
    });
  };

  this.setJobcan = function (userId, jobcanUser, callback) {
    MongoClient.connect(mongoUrl, function(err, db) {
      var collection = db.collection('users');
      collection.insertMany([ { 'user_id': userId, jobcanUser: jobcanUser } ], callback);
    });
  };

  this.updateJobcan = function (userId, jobcanUser, callback) {
    MongoClient.connect(mongoUrl, function(err, db) {
      var collection = db.collection('users');
      collection.updateOne({ 'user_id': userId }, { $set: { jobcanUser : jobcanUser } }, callback);
    });
  };

  this.get = function (userId, callback) {
    MongoClient.connect(mongoUrl, function(err, db) {
      var collection = db.collection('users');
      collection.find({ 'user_id': userId }).toArray(function(err, users) {
        callback(err, users.map(function (u) {
          return Object.assign(u, { password: decrypt(u.password) });
        }));
      });
    });
  }
}

module.exports = UserStorage;
