var request = require('request');

function Gripper(apiKey, apiUrl, apiUser) {
  // common options
  function getJsonOptions(resource, body) {
    return {
      url: apiUrl + "/" + resource,
      json: true,
      headers: { 'x-api-key': apiKey, "Content-Type": "application/json; charset=utf-8" },
      body: body,
    };
  }

  this.attend = function (password, callback) {
    request.post(
      getJsonOptions('working', { user: apiUser, password: password }),
      callback
    );
  };

  this.leave = function (password, callback) {
    request.delete(
      getJsonOptions('working', { user: apiUser, password: password }),
      callback
    );
  };
}

module.exports = Gripper;
