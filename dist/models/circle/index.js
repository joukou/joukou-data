
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

CircleModel.getByFullName = function(fullName, persona) {
  var funcs, getByFullNamePersona, personas, result, results;
  if (!fullName) {
    return Q.reject('Name is required');
  }
  if (!persona) {
    return Q.reject('Persona key is required');
  }
  results = [];
  getByFullNamePersona = function(persona_key) {
    var escapedKey, escapedLibrary, escapedName, library, name, query, split;
    library = void 0;
    name = fullName;
    split = fullName.split('/');
    if (split.length > 1) {
      library = split[0];
      name = split[1];
    }
    if (!(library && name)) {
      library = void 0;
      name = fullName;
    }
    escapedName = CircleModel.escapeElasticSearchCharacters(name);
    escapedKey = CircleModel.escapeElasticSearchCharacters(persona_key);
    query = "personas.key:" + escapedKey + " AND name:" + escapedName;
    if (library != null) {
      escapedLibrary = CircleModel.escapeElasticSearchCharacters(library);
      query += " AND library:" + escapedLibrary;
    }
    return CircleModel.elasticSearch(query).then(function(circles) {
      var circle;
      if (circles.length > 1) {
        throw new Error("More then one component found for " + persona_key + "#" + fullName);
      }
      circle = circles[0];
      results.push(circle);
      return circle;
    });
  };
  personas = void 0;
  if (_.isArray(persona)) {
    personas = persona;
  } else {
    personas = [persona];
  }
  funcs = _.map(personas, function(persona) {
    var key;
    key = void 0;
    if (typeof persona === 'string') {
      key = persona;
    } else if (persona.key != null) {
      key = persona.key;
    }
    if (typeof key !== 'string') {
      return Q.reject('Persona key is not a string');
    }
    return function() {
      return getByFullNamePersona(key);
    };
  });
  result = Q([]);
  funcs.forEach(function(func) {
    return result = result.then(func);
  });
  result.then(function() {
    var distinct, values;
    distinct = {};
    _.each(results, function(circle) {
      return distinct[circle.getKey()] = circle;
    });
    values = _.values(distinct);
    if (values.length > 1) {
      throw new Error("More then one component found for " + fullName);
    }
    return values[0];
  });
  return result;
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

CircleModel.prototype.getFullName = function() {
  if (this.library == null) {
    return "" + this.library + "/" + this.name;
  }
  return this.name;
};

module.exports = CircleModel;

/*
//# sourceMappingURL=index.js.map
*/
