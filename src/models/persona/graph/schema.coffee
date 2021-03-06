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
"use strict"

###*
@module joukou-api/persona/graph/schema
@requires schemajs
@author Isaac Johnston <isaac.johnston@joukou.com>
@copyright (c) 2009-2014 Joukou Ltd. All rights reserved.
###

schema  = require( 'schemajs' )
network = require( './network/schema' )

module.exports = schema.create(
  name:
    type: 'string+'
  inports:
    type: 'object'
  outports:
    type: 'object'
  processes:
    type: 'object'
  connections:
    type: 'array'
  personas:
    type: 'array'
    schema:
      key:
        type: 'string'
  network:
    type: 'object'
    schema: network.schema
  public_key:
    type: 'string'
  properties:
    type: 'object'
)