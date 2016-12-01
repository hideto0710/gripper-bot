var request = require('request');

function Jobcan(apiKey, apiUrl, apiClient) {
  // common options
  function getJsonOptions(resource, body) {
    return {
      url: apiUrl + "/" + resource,
      json: true,
      headers: { 'x-api-key': apiKey, "Content-Type": "application/json; charset=utf-8" },
      body: body,
    };
  }

  this.attend = function (user, password, callback) {
    request.post(
      getJsonOptions('working', { client: apiClient, user: user, password: password }),
      callback
    );
  };

  this.leave = function (user, password, callback) {
    request.delete(
      getJsonOptions('working', { client: apiClient, user: user, password: password }),
      callback
    );
  };
}

module.exports = Jobcan;
