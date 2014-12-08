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
persona is from greek prosōpon meaning "mask" or "character". Personas are a
legal person (Latin: persona ficta) or a natural person
(Latin: persona naturalis).

@class joukou-api/persona/Model
@copyright (c) 2009-2014 Joukou Ltd. All rights reserved.
@author Isaac Johnston <isaac.johnston@joukou.com>
###

_       = require( 'lodash' )
Q       = require( 'q' )
Model   = require( '../../lib/Model' )
schema  = require( './schema' )

PersonaModel = Model.define(
  type: 'persona'
  bucket: 'persona'
  schema: schema
)

PersonaModel.getForAgent = (key) ->
  if key instanceof Object
    if key["getKey"] instanceof Function
      key = key["getKey"]()

  PersonaModel.search("agents.key:#{key}")

PersonaModel::getName = ->
  @getValue().name

module.exports = PersonaModel
