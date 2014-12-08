
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
var CircleModel, Model, Q, schema;

Model = require('../../lib/Model');

schema = require('./schema');

Q = require('q');

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

CircleModel.prototype.beforeSave = function() {};

CircleModel.prototype.afterRetrieve = function() {
  this.addSecondaryIndex('name_bin');
  return this.addSecondaryIndex('personas.key_bin');
};

module.exports = CircleModel;

/*
//# sourceMappingURL=index.js.map
*/
