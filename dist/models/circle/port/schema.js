
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
var schema;

schema = require('schemajs');

module.exports = schema.create({
  id: {
    type: "string+",
    required: true
  },
  name: {
    type: "string+",
    required: true
  },
  description: {
    type: "string"
  },
  addressable: {
    type: "boolean"
  },
  required: {
    type: "boolean"
  }
});

/*
//# sourceMappingURL=schema.js.map
*/
