
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
var GraphStateModel, Model, Q, schema;

schema = require('./schema');

Model = require('../../../../lib/Model');

Q = require('q');

GraphStateModel = Model.define({
  schema: schema,
  type: 'graph_state',
  bucket: 'graph_state'
});

GraphStateModel.retrieveForGraph = function(agentKey, graphKey) {
  return GraphStateModel.search("agent_key:" + agentKey + " graph_key:" + graphKey, {
    firstOnly: true
  });
};

GraphStateModel.put = function(agentKey, graphKey, state) {
  var data, deferred, numberOr, save;
  if (state == null) {
    state = {};
  }
  deferred = Q.defer();
  save = function(model) {
    return model.save().then(function() {
      return deferred.resolve(model);
    }).fail(deferred.reject);
  };
  numberOr = function(number, other) {
    if (typeof number !== 'number') {
      return other;
    }
    if (isNaN(number)) {
      return other;
    }
    return number;
  };
  data = {
    agent_key: agentKey,
    graph_key: graphKey,
    x: numberOr(state.x, 0),
    y: numberOr(state.y, 0),
    scale: numberOr(state.scale, 1),
    metadata: state.metadata || {}
  };
  GraphStateModel.retrieveForGraph(agentKey, graphKey).then(function(model) {
    model.setValue(data);
    return save(model);
  }).fail(function() {
    return GraphStateModel.create(data).then(save).fail(deferred.reject);
  });
  return deferred.promise;
};

GraphStateModel.afterCreate = function(model) {
  model.afterRetrieve();
  return Q.resolve(model);
};

GraphStateModel.prototype.beforeSave = function() {};

GraphStateModel.prototype.afterRetrieve = function() {
  this.addSecondaryIndex('agent_key_bin');
  return this.addSecondaryIndex('graph_key_bin');
};

module.exports = GraphStateModel;

/*
//# sourceMappingURL=index.js.map
*/
