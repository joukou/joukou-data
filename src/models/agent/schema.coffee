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
@module joukou-api/agent/schema
@requires schemajs
@author Isaac Johnston <isaac.johnston@joukou.com>
@copyright (c) 2009-2014 Joukou Ltd. All rights reserved.
###

schema = require( 'schemajs' )
module.exports = schema.create(
  email:
    type: 'email'
    required: true
    allownull: false
    filters: [ 'trim' ]
  github_login:
    type: 'string'
    required: false
    allownull: true
  github_id:
    type: 'int'
    required: false
    allownull: true
  image_url:
    type: 'string'
    required: false
    allownull: false
  website:
    type: 'url'
    required: false
    allownull: false
  github_url:
    type: 'url'
    required: false
    allownull: false
  name:
    type: 'string'
    required: false
    allownull: false
  company:
    type: 'string'
    required: false
    allownull: false
  location:
    type: 'string'
    required: false
    allownull: false
  jwt_token:
    type: 'string'
    required: false
    allownull: false
  github_token:
    type: 'string'
    required: false
    allownull: false
  github_refresh_token:
    type: 'string'
    required: false
    allownull: false
  roles:
    type: 'array'
    items:
      type: 'string'
)