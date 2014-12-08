
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
"use strict";

/**
@class joukou-api/error/DuplicateError
@extends restify/RestError
@author Isaac Johnston <isaac.johnston@joukou.com>
@copyright (c) 2009-2014 Joukou Ltd. All rights reserved.
 */
var RestError,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

RestError = require('restify').RestError;

module.exports = (function(_super) {

  /**
  @private
  @static
  @property {joukou-api.error.DuplicateError} self
   */
  var self;

  __extends(_Class, _super);

  self = _Class;


  /**
  @method constructor
  @param {String} indexName
   */

  function _Class(indexName) {
    this.indexName = indexName;
    _Class.__super__.constructor.call(this, {
      restCode: 'DuplicateError',
      statusCode: 409,
      message: this.indexName,
      constructorOpt: self.DuplicateError
    });
  }

  return _Class;

})(RestError);

/*
//# sourceMappingURL=DuplicateError.js.map
*/
