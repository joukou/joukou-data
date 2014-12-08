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
In flow-based programs, the logic is defined as a *Graph*. Each node of the
*Graph* is a *Process* that is implemented by a *Circle*, and the edges define
the *Connections* between them.

@class joukou-api/persona/graph/Model
@extends joukou-api/riak/Model
@requires joukou-api/persona/graph/schema
@requires restify.ConflictError
@requires lodash
@requires q
@requires node-uuid
@author Isaac Johnston <isaac.johnston@joukou.com>
@copyright &copy; 2009-2014 Joukou Ltd. All rights reserved.
###

_                 = require( 'lodash' )
Q                 = require( 'q' )
uuid              = require( 'node-uuid' )
Model             = require( '../../../lib/Model' )
schema            = require( './schema' )
PersonaModel      = require( '../index' )
{ ConflictError } = require( 'restify' )
ConnectionSchema  = require( './connection/schema' )
ProcessSchema     = require( './process/schema' )

GraphModel = Model.define(
  type: 'graph'
  schema: schema
  bucket: 'graph'
)



GraphModel::getPersona = ->
  PersonaModel.retrieve( @getValue().personas[ 0 ].key )

GraphModel::addProcess = ( { circle, metadata } ) ->
  key = uuid.v4()

  processValue = {
    circle: circle
    metadata: metadata
  }

  form = ProcessSchema.validate(processValue)
  if not form.valid
    deferred = Q.defer()
    process.nextTick(->
      deferred.reject(form.errors)
    )
    return deferred.promise

  (@getValue().processes ?= {})[ key ] = processValue

  Q.fcall( -> key )

GraphModel::getProcess = ( key ) ->
  Q.fcall( => @getValue().processes[ key ] )

GraphModel::getProcesses = ->
  Q.fcall( => @getValue().processes )

GraphModel::addConnection = ( { data, src, tgt, metadata } ) ->
  deferred = Q.defer()

  # TODO add src/tgt validation against connection/port/schema
  if @_hasConnection( { src: src, tgt: tgt } )
    process.nextTick( =>
      deferred.reject( new ConflictError( "Graph #{@getKey()} already " +
        "has an identical connection between the source and the target." ) )
    )
  else
    connection =
      key: uuid.v4()
      data: data
      src: src
      tgt: tgt
      metadata: metadata

    form = ConnectionSchema.validate(connection)
    if not form.valid
      process.nextTick( ->
        deferred.reject(form.errors)
      )
      return deferred.promise


    value = @getValue()
    connections = value.connections or (value.connections = [])
    connections.push( connection )

    process.nextTick( -> deferred.resolve( connection ) )

  deferred.promise

GraphModel::_hasConnection = ( { src, tgt } ) ->
  _.some( @getValue().connections, ( connection ) ->
    _.isEqual( connection.src, src ) and _.isEqual( connection.tgt, tgt )
  )

GraphModel::hasConnection = ( options ) ->
  Q.fcall( => @_hasConnection( options ) )

GraphModel::getConnections = ->
  Q.fcall( => @getValue().connections )


module.exports = GraphModel