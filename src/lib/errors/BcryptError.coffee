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
###*
@class joukou-api/error/BcryptError
@extends restify/RestError
@author Isaac Johnston <isaac.johnston@joukou.com>
@copyright (c) 2009-2013 Joukou Ltd. All rights reserved.
###

{ RestError } = require( 'restify' )

module.exports = self = class extends RestError
  constructor: ( @originalError ) ->
    super(
      restCode: 'InternalError'
      statusCode: 503
      message: '' # TODO
      constructorOpt: self
    )