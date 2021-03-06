
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
var schemajs;

schemajs = require('schemajs');

module.exports = schemajs.create({
  port: {
    type: 'string+',
    required: true
  },
  process: {
    type: 'string+',
    required: true
  },
  metadata: {
    type: 'object'
  }
});

/*
//# sourceMappingURL=schema.js.map
*/
