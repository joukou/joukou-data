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
An agent is authorized to act on behalf of a persona (called the principal).
By way of a relationship between the principal and an agent the principal
authorizes the agent to work under his control and on his behalf.

Latin: qui facit per alium, facit per se, i.e. the one who acts through
another, acts in his or her own interests.

@class joukou-api/agent/Model
@requires joukou-api/agent/schema
@requires joukou-api/riak/Model
@requires joukou-api/error/BcryptError
@requires lodash
@requires q
@requires bcrypt
@author Isaac Johnston <isaac.johnston@joukou.com>
@copyright (c) 2009-2014 Joukou Ltd. All rights reserved.
###

_               = require( 'lodash' )
Q               = require( 'q' )
bcrypt          = require( 'bcrypt' )
schema          = require( './schema')
Model           = require( '../../lib/Model' )
BcryptError     = require( '../../lib/errors/BcryptError' )

AgentModel      = Model.define(
  schema: schema
  type: 'agent'
  bucket: 'agent'
)

###*
After creating an agent model instance, encrypt the password with bcrypt.
###
AgentModel.afterCreate = ( agent ) ->
  deferred = Q.defer()

  agent.afterRetrieve();

  # Hash password
  ###
  bcrypt.genSalt( 10, ( err, salt ) ->
    if err
      deferred.reject( new BcryptError( err ) )
    else
      bcrypt.hash( agent.getValue().password, salt, ( err, hash ) ->
        if err
          deferred.reject( new BcryptError( err ) )
        else
          agent.setValue( _.assign( agent.getValue(), password: hash ) )
          deferred.resolve( agent )
      )
  )
  ###

  deferred.resolve(agent)

  deferred.promise

###*
Verify the given `password` against the stored password.
@method verifyPassword
@return {q.promise}
###
AgentModel::verifyPassword = ( password ) ->
  deferred = Q.defer()

  bcrypt.compare( password, @getValue().password, ( err, authenticated ) ->
    if err
      deferred.reject( new BcryptError( err ) )
    else
      deferred.resolve( authenticated )
  )

  deferred.promise

AgentModel.retriveByGithubId = ( id ) ->
  AgentModel.retrieveBySecondaryIndex( 'githubId_int', id, true )

AgentModel.retrieveByEmail = ( email ) ->
  AgentModel.retrieveBySecondaryIndex( 'email_bin', email, true )

AgentModel.deleteByEmail = ( email ) ->
  deferred = Q.defer()

  AgentModel.retrieveByEmail( email ).then( ( agent ) ->
    agent.delete()
  )
  .then( -> deferred.resolve() )
  .fail( ( err ) -> deferred.reject( err ) )

  deferred.promise

AgentModel::getRepresentation = ->
  _.pick( @getValue(), [ 'email', 'roles', 'name' ] )

AgentModel::getEmail = ->
  @getValue().email

AgentModel::getName = ->
  @getValue().name

AgentModel::getRoles = ->
  @getValue().roles

AgentModel::hasRole = ( role ) ->
  roles = [ role ]
  @hasSomeRoles( roles )

AgentModel::hasSomeRoles = ( roles ) ->
  _.some( roles, ( role ) =>
    (@getRoles() or []).indexOf( role ) isnt -1
  )

AgentModel::beforeSave = ->

AgentModel::afterRetrieve = ->
  this.addSecondaryIndex( 'email' )
  this.addSecondaryIndex( 'github_id' )


module.exports = AgentModel
