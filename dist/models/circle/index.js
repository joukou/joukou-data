
/*
Copyright 2014 Joukou Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */
var CircleModel, Model, Q, schema, _;

Model = require('../../lib/Model');

schema = require('./schema');

Q = require('q');

_ = require('lodash');

CircleModel = Model.define({
  type: 'circle',
  bucket: 'circle',
  schema: schema
});

CircleModel.afterCreate = function(circle) {
  circle.afterRetrieve();
  return Q.resolve(circle);
};

CircleModel.retrieveByPersona = function(key) {
  return CircleModel.search("personas.key:" + key);
};

CircleModel.retrieveByPersonas = function(keys) {
  var deferred, promises;
  if (!_.isArray(keys)) {
    keys = [keys];
  }
  deferred = Q.defer();
  promises = _.map(keys, function(key) {
    return CircleModel.retrieveByPersona(key).then(function(result) {
      return {
        persona: key,
        result: result
      };
    });
  });
  Q.all(promises).then(function(results) {
    var circle, circles, group, key, result, _i, _j, _len, _len1, _ref;
    circles = {};
    for (_i = 0, _len = results.length; _i < _len; _i++) {
      group = results[_i];
      _ref = group.result;
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        circle = _ref[_j];
        if (circles[circle.getKey()]) {
          continue;
        }
        circles[circle.getKey()] = circle;
      }
    }
    result = [];
    for (key in circles) {
      if (!circles.hasOwnProperty(key)) {
        continue;
      }
      result.push(circles[key]);
    }
    return deferred.resolve(result);
  }).fail(deferred.reject);
  return deferred.promise;
};

CircleModel.prototype.beforeSave = function() {};

CircleModel.prototype.afterRetrieve = function() {
  this.addSecondaryIndex('name_bin');
  return this.addSecondaryIndex('personas.key_bin');
};

module.exports = CircleModel;

/*
//# sourceMappingURL=index.js.map
*/
