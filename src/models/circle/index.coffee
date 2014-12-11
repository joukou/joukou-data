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
Model   = require( '../../lib/Model' )
schema  = require( './schema' )
Q       = require( 'q' )

CircleModel = Model.define(
  type: 'circle'
  bucket: 'circle'
  schema: schema
)

CircleModel.afterCreate = (circle) ->
  circle.afterRetrieve()
  return Q.resolve(circle)

CircleModel.retrieveByPersona = ( key ) ->
  CircleModel.search( "personas.key:#{key}" )

CircleModel.retrieveByPersonas = ( keys ) ->
  unless _.isArray( keys )
    keys = [ keys ]
  deferred = Q.defer()
  promises = _.map(personas, (persona) ->
    like = CircleModel.likeQuery("name", req.params.name, "AND")
    CircleModel.search(
                      """
          personas.key:#{persona.getKey()} AND
          #{like}
          """
    ).then((result) ->
      return {
      persona: persona,
      result: result
      }
    )
  )
  Q.all(
    promises
  )
  .then((results) ->
    circles = {}
    for group of results
      for circle in group.result
        if circles[ circle.getKey() ]
          continue
        circles[ circle.getKey() ] = circle
    result = []
    for key in circles
      if not circles.hasOwnProperty( key )
        continue
      result.push(
        circles[ key ]
      )
    deferred.resolve(
      result
    )
  )
  .fail( deferred.reject )

  return deferred.promise



CircleModel::beforeSave = ->

CircleModel::afterRetrieve = ->
  this.addSecondaryIndex( 'name_bin' )
  this.addSecondaryIndex( 'personas.key_bin' )

module.exports = CircleModel
