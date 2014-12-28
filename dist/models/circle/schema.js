
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
var port, schema;

schema = require('schemajs');

port = require('./port/schema');

module.exports = schema.create({
  name: {
    type: 'string+',
    required: true
  },
  description: {
    type: 'string'
  },
  library: {
    type: 'string'
  },
  icon: {
    type: 'string+'
  },
  image: {
    type: 'string'
  },
  subgraph: {
    type: 'boolean'
  },
  inports: {
    type: 'array',
    required: true,
    schema: port
  },
  outports: {
    type: 'array',
    required: true,
    schema: port
  },
  personas: {
    type: 'array',
    required: true,
    schema: {
      schema: {
        key: {
          type: "string+",
          required: true
        }
      }
    }
  }
});

/*
//# sourceMappingURL=schema.js.map
*/
