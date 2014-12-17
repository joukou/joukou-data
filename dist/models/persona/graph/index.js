
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
"use strict";

/**
In flow-based programs, the logic is defined as a *Graph*. Each node of the
*Graph* is a *Process* that is implemented by a *Circle*, and the edges define
the *Connections* between them.

@class joukou-api/persona/graph/Model
@extends joukou-api/riak/Model
@requires joukou-api/persona/graph/schema
@requires restify.ConflictError
@requires lodash
@requires q
@requires node-uuid
@author Isaac Johnston <isaac.johnston@joukou.com>
@copyright &copy; 2009-2014 Joukou Ltd. All rights reserved.
 */
var ConflictError, ConnectionSchema, GraphModel, Model, PersonaModel, ProcessSchema, Q, schema, uuid, _;

_ = require('lodash');

Q = require('q');

uuid = require('node-uuid');

Model = require('../../../lib/Model');

schema = require('./schema');

PersonaModel = require('../index');

ConflictError = require('restify').ConflictError;

ConnectionSchema = require('./connection/schema');

ProcessSchema = require('./process/schema');

GraphModel = Model.define({
  type: 'graph',
  schema: schema,
  bucket: 'graph'
});

GraphModel.prototype.getPersona = function() {
  return PersonaModel.retrieve(this.getValue().personas[0].key);
};

GraphModel.prototype.addProcess = function(_arg) {
  var circle, deferred, form, key, metadata, processValue, _base;
  circle = _arg.circle, metadata = _arg.metadata;
  key = uuid.v4();
  processValue = {
    circle: circle,
    metadata: metadata
  };
  form = ProcessSchema.validate(processValue);
  if (!form.valid) {
    deferred = Q.defer();
    process.nextTick(function() {
      return deferred.reject(form.errors);
    });
    return deferred.promise;
  }
  ((_base = this.getValue()).processes != null ? _base.processes : _base.processes = {})[key] = processValue;
  return Q.fcall(function() {
    return key;
  });
};

GraphModel.prototype.getProcess = function(key) {
  return Q.fcall((function(_this) {
    return function() {
      return _this.getValue().processes[key];
    };
  })(this));
};

GraphModel.prototype.getProcesses = function() {
  return Q.fcall((function(_this) {
    return function() {
      return _this.getValue().processes;
    };
  })(this));
};

GraphModel.prototype.addConnection = function(_arg) {
  var connection, connections, data, deferred, form, metadata, src, tgt, value;
  data = _arg.data, src = _arg.src, tgt = _arg.tgt, metadata = _arg.metadata;
  deferred = Q.defer();
  if (this._hasConnection({
    src: src,
    tgt: tgt
  })) {
    process.nextTick((function(_this) {
      return function() {
        return deferred.reject(new ConflictError(("Graph " + (_this.getKey()) + " already ") + "has an identical connection between the source and the target."));
      };
    })(this));
  } else {
    connection = {
      key: uuid.v4(),
      data: data,
      src: src,
      tgt: tgt,
      metadata: metadata
    };
    form = ConnectionSchema.validate(connection);
    if (!form.valid) {
      process.nextTick(function() {
        return deferred.reject(form.errors);
      });
      return deferred.promise;
    }
    value = this.getValue();
    connections = value.connections || (value.connections = []);
    connections.push(connection);
    process.nextTick(function() {
      return deferred.resolve(connection);
    });
  }
  return deferred.promise;
};

GraphModel.prototype._hasConnection = function(_arg) {
  var src, tgt;
  src = _arg.src, tgt = _arg.tgt;
  return _.some(this.getValue().connections, function(connection) {
    return _.isEqual(connection.src, src) && _.isEqual(connection.tgt, tgt);
  });
};

GraphModel.prototype.hasConnection = function(options) {
  return Q.fcall((function(_this) {
    return function() {
      return _this._hasConnection(options);
    };
  })(this));
};

GraphModel.prototype.getConnections = function() {
  return Q.fcall((function(_this) {
    return function() {
      return _this.getValue().connections;
    };
  })(this));
};

GraphModel.prototype.beforeSave = function() {};

GraphModel.prototype.afterRetrieve = function() {
  this.addSecondaryIndex('name');
  return this.addSecondaryIndex('public_key');
};

module.exports = GraphModel;

/*
//# sourceMappingURL=index.js.map
*/
