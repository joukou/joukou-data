###
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
###
schema = require( 'schemajs' )
port   = require( './port/schema' )

module.exports = schema.create(
  name:
    type: 'string+'
    required: yes
  description:
    type: 'string'
  library:
    type: 'string'
  icon:
    type: 'string+'
# Docker image
  image:
    type: 'string'
  subgraph:
    type: 'boolean'
  inports:
    type: 'array'
    required: yes
    schema: port
  outports:
    type: 'array'
    required: yes
    schema: port
  personas:
    type: 'array'
    required: yes
    schema:
      schema:
        key:
          type: "string+"
          required: yes
)