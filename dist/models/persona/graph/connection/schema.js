
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

/**
@module joukou-api/persona/graph/connection/schema
@author Fabian Cook <fabian.cook@joukou.com>
@copyright (c) 2009-2014 Joukou Ltd. All rights reserved.
 */
var port, schema;

schema = require('schemajs');

port = require('./port/schema');

module.exports = schema.create({
  key: {
    type: "string+",
    required: true
  },
  metadata: {
    type: "object"
  },
  data: {
    type: "string"
  },
  src: {
    type: "object",
    required: true,
    schema: port
  },
  tgt: {
    type: "object",
    required: true,
    schema: port
  }
});

/*
//# sourceMappingURL=schema.js.map
*/
