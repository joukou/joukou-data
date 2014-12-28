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
_       = require( 'lodash' )

CircleModel = Model.define(
  type: 'circle'
  bucket: 'circle'
  schema: schema
)

CircleModel.afterCreate = (circle) ->
  circle.afterRetrieve()
  return Q.resolve(circle)

CircleModel.getByFullName = ( fullName, persona ) ->
  unless fullName
    return Q.reject( 'Name is required' )
  unless persona
    return Q.reject( 'Persona key is required' )

  results = []

  getByFullNamePersona = ( persona_key ) ->

    library = undefined
    name = fullName

    split = fullName.split( '/' )
    if split.length > 1
      library = split[ 0 ]
      name = split[ 1 ]

    unless library and name
      library = undefined
      name = fullName

    escapedName = CircleModel.escapeElasticSearchCharacters(
      name
    )
    escapedKey = CircleModel.escapeElasticSearchCharacters(
      persona_key
    )

    query = "personas.key:#{ escapedKey } AND name:#{ escapedName }"

    if library?
      escapedLibrary = CircleModel.escapeElasticSearchCharacters(
        library
      )
      query += " AND library:#{ escapedLibrary }"

    CircleModel.elasticSearch(
      query
    )
    .then( ( circles ) ->
      if circles.length > 1
        throw new Error(
          "More then one component found for #{ persona_key }##{ fullName }"
        )
      circle = circles[ 0 ]
      results.push(
        circle
      )
      return circle
    )

  personas = undefined
  if _.isArray( persona )
    personas = persona
  else
    personas = [ persona ]

  funcs = _.map( personas, ( persona ) ->
    key = undefined
    if typeof persona is 'string'
      key = persona
    else if persona.key?
      key = persona.key

    unless typeof key is 'string'
      return Q.reject( 'Persona key is not a string' )

    return ->
      return getByFullNamePersona( key )
  )

  result = Q( [] )
  funcs.forEach( ( func ) ->
    result = result
    .then( func )
  )
  result.then( ->
    distinct = { }
    _.each( results, ( circle ) ->
      distinct[ circle.getKey( ) ] = circle
    )
    values = _.values( distinct )
    if values.length > 1
      throw new Error( "More then one component found for #{ fullName }" )
    return values[ 0 ]
  )
  return result

CircleModel.retrieveByPersona = ( key ) ->
  CircleModel.search( "personas.key:#{key}" )

CircleModel.retrieveByPersonas = ( keys ) ->
  unless _.isArray( keys )
    keys = [ keys ]
  deferred = Q.defer()
  promises = _.map( keys, ( key ) ->
    CircleModel.retrieveByPersona(
      key
    )
    .then((result) ->
      return {
        persona: key,
        result: result
      }
    )
  )
  Q.all(
    promises
  )
  .then((results) ->
    circles = {}
    for group in results
      for circle in group.result
        if circles[ circle.getKey() ]
          continue
        circles[ circle.getKey() ] = circle
    result = []
    for key of circles
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

CircleModel::getFullName = ->
  if not @library?
    return "#{ @library }/#{ @name }"
  return @name

module.exports = CircleModel
