
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
Lightweight model client for Basho Riak 2.0

Prefers the protocol buffers API, but may fall back to the HTTP API for missing
functionality.

Search is supported via solr-client.

@class joukou-api/riak/Model
@extends events.EventEmitter
@requires lodash
@requires q
@requires node-uuid
@requires riakpbc
@requires solr-client
@author Isaac Johnston <isaac.johnston@joukou.com>
@copyright (c) 2009-2014 Joukou Ltd. All rights reserved.
 */
var EventEmitter, NotFoundError, Q, RiakError, ValidationError, elastic, env, pbc, uuid, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EventEmitter = require('events').EventEmitter;

_ = require('lodash');

Q = require('q');

uuid = require('node-uuid');

NotFoundError = require('./errors/RiakNotFoundError');

ValidationError = require('./errors/ValidationError');

RiakError = require('./errors/RiakError');

pbc = require('./pbc');

env = require('./env');

elastic = require('./elastic');

module.exports = {
  define: function(_arg) {
    var bucket, schema, type;
    type = _arg.type, bucket = _arg.bucket, schema = _arg.schema;
    if (type == null) {
      type = 'default';
    }
    if (!_.isString(bucket)) {
      throw new TypeError('type is not a string');
    }
    if (!(_.isObject(schema) && _.isFunction(schema.validate))) {
      throw new TypeError('schema is not a schema object');
    }
    return (function(_super) {
      var afterRetrieve, self;

      __extends(_Class, _super);

      self = _Class;

      _Class.getType = function() {
        return type;
      };

      _Class.getBucket = function() {
        return bucket;
      };

      _Class.getSchema = function() {
        return schema;
      };


      /**
      Expand a shortened content type to the full equivalent.
      @private
      @static
      @param {string} type
      @return {string}
       */

      _Class._expandContentType = function(type) {
        switch (type) {
          case 'json':
            return 'application/json';
          case 'xml':
          case 'html':
          case 'plain':
            return 'text/' + type;
          case 'jpeg':
          case 'gif':
          case 'png':
            return 'image/' + type;
          case 'binary':
            return 'application/octet-stream';
          default:
            return type;
        }
      };


      /**
      Create a new instance of `this` *Model* based on the provided raw client
      data.
        @param {Object.<string,*>} rawValue The raw data from the client.
      @return {q.promise}
       */

      _Class.create = function(rawValue) {
        var afterCreate, data, deferred, errors, instance, key, valid, _ref;
        if (rawValue == null) {
          rawValue = {};
        }
        deferred = Q.defer();
        _ref = self.getSchema().validate(rawValue), data = _ref.data, errors = _ref.errors, valid = _ref.valid;
        if (!valid) {
          process.nextTick(function() {
            return deferred.reject(new ValidationError(errors, rawValue));
          });
          return deferred.promise;
        }
        key = uuid.v4();
        instance = new self({
          key: key,
          value: data
        });
        if (self.afterCreate) {
          afterCreate = self.afterCreate(instance);
        } else {
          afterCreate = Q.fcall(function() {
            return instance;
          });
        }
        afterCreate.then(function(instance) {
          return deferred.resolve(instance);
        }).fail(function(err) {
          return deferred.reject(err);
        });
        return deferred.promise;
      };

      _Class.createFromReply = function(_arg1) {
        var content, key, reply, ret;
        key = _arg1.key, reply = _arg1.reply;
        if (reply.content.length !== 1) {
          throw new Error('Unhandled reply.content length');
        }
        content = reply.content[0];
        ret = new self({
          type: self.getType(),
          bucket: self.getBucket(),
          key: key,
          contentType: content.content_type,
          lastMod: content.last_mod,
          lastModUsecs: content.last_mod_usecs,
          value: content.value,
          vclock: reply.vclock,
          vtag: content.vtag
        });
        if (ret.afterRetrieve instanceof Function) {
          ret.afterRetrieve();
        }
        return ret;
      };


      /**
      Retrieve an instance of this *Model* class from Basho Riak.
      @param {string} key
      @return {q.promise}
       */

      _Class.retrieve = function(key) {
        var deferred;
        deferred = Q.defer();
        pbc.get({
          type: self.getType(),
          bucket: self.getBucket(),
          key: key
        }, function(err, reply) {
          if (err) {
            return deferred.reject(new RiakError(err));
          } else if (_.isEmpty(reply)) {
            return deferred.reject(new NotFoundError({
              type: self.getType(),
              bucket: self.getBucket(),
              key: key
            }));
          } else {
            return deferred.resolve(self.createFromReply({
              key: key,
              reply: reply
            }));
          }
        });
        return deferred.promise;
      };

      _Class.likeQuery = function(key, value, op) {
        var split, val, values, _i, _len;
        if (op == null) {
          op = "";
        }
        if (!value || !value.trim()) {
          return;
        }
        values = [];
        split = value.trim().split(" ");
        for (_i = 0, _len = split.length; _i < _len; _i++) {
          val = split[_i];
          values.push("" + key + ":*" + val + "*");
        }
        if (values.length === 0) {
          return "";
        }
        return " (" + (values.join(" " + op + " ")) + ") ";
      };

      _Class.escapeElasticSearchCharacters = function(value) {
        if (typeof value !== 'string') {
          return value;
        }
        return value.replace(/\&{2}|\|{2}|[\+\-≈!\(\)\{\}\[\]\^"~\*\?:\\/ ]/g, '\\$&');
      };

      _Class.elasticSearch = function(q, first) {
        var deferred, params, requestedParams;
        deferred = Q.defer();
        params = {
          index: self.getBucket()
        };
        requestedParams = typeof q === 'string' ? {
          q: q
        } : q;
        params = _.assign(params, requestedParams);
        elastic.search(params, function(err, reply) {
          var hit, hits, key, result, ret, riakReply, value, _i, _len;
          if (err) {
            return deferred.reject(err);
          }
          hits = reply.hits;
          hits = hits.hits;
          result = [];
          for (_i = 0, _len = hits.length; _i < _len; _i++) {
            hit = hits[_i];
            key = hit._id;
            value = hit._source;
            riakReply = {
              content: [
                {
                  value: value
                }
              ]
            };
            ret = self.createFromReply({
              key: key,
              reply: riakReply
            });
            if (first) {
              return deferred.resolve(ret);
            }
            result.push(ret);
          }
          if (!result.length) {
            return deferred.reject(new NotFoundError({
              index: params.index,
              bucket: self.getBucket(),
              key: q
            }));
          } else {
            return deferred.resolve(result);
          }
        });
        return deferred.promise;
      };

      _Class.search = function(q, opts) {
        var deferred;
        deferred = Q.defer();
        if (typeof opts === 'boolean') {
          opts = {
            firstOnly: opts
          };
        }
        opts = opts || {};
        pbc.search({
          q: q,
          index: self.getBucket(),
          rows: opts.rows,
          start: opts.start,
          sort: opts.sort,
          filter: opts.filter,
          df: opts.df,
          op: opts.op,
          fl: opts.fl,
          presort: opts.presort
        }, function(err, reply) {
          var first, getPromise, promises;
          if (err) {
            deferred.reject(new RiakError(err));
            return;
          }
          if (_.isEmpty(reply) || reply.num_found === 0 || _.isEmpty(reply.docs)) {
            deferred.reject(new NotFoundError({
              index: q,
              bucket: q,
              key: q
            }));
            return;
          }
          getPromise = function(doc) {
            var fields, keys, pair;
            fields = doc.fields;
            keys = _.where(fields, {
              key: '_yz_rk'
            });
            if (!keys || !keys.length) {
              if (opts.firstOnly) {
                return Q.reject(new NotFoundError());
              }
              return;
            }
            pair = keys[0];
            if (!pair || !pair.value) {
              if (opts.firstOnly) {
                return Q.reject(new NotFoundError());
              }
              return;
            }
            return self.retrieve(pair.value);
          };
          if (opts.firstOnly) {
            first = _.first(reply.docs);
            if (!first) {
              return Q.reject(new NotFoundError({
                index: q,
                bucket: q,
                key: q
              }));
            }
            return getPromise(first).then(deferred.resolve).fail(deferred.reject);
          } else {
            promises = _.map(reply.docs, getPromise);
            return Q.all(promises).then(function(values) {
              return deferred.resolve(values);
            }).fail(deferred.reject);
          }
        });
        return deferred.promise;
      };


      /**
      Retrieve a collection of instances of this *Model* class from Basho Riak
      via a secondary index query.r t
      @param {string} index
      @param {string} key
       */

      _Class.retrieveBySecondaryIndex = function(index, key, firstOnly) {
        var deferred;
        if (firstOnly == null) {
          firstOnly = false;
        }
        deferred = Q.defer();
        pbc.getIndex({
          type: self.getType(),
          bucket: self.getBucket(),
          index: index,
          qtype: 0,
          key: key
        }, function(err, reply) {
          if (err) {
            return deferred.reject(new RiakError(err));
          } else if (_.isEmpty(reply)) {
            return deferred.reject(new NotFoundError({
              type: self.getType(),
              bucket: self.getBucket(),
              key: key
            }));
          } else {
            if (firstOnly) {
              return deferred.resolve(self.retrieve(_.first(reply.keys)));
            } else {
              return deferred.resolve(_.map(reply.keys, function(key) {
                return self.retrieve(key);
              }));
            }
          }
        });
        return deferred.promise;
      };

      _Class["delete"] = function(key) {
        var deferred, elasticDelete, riakDelete;
        deferred = Q.defer();
        elasticDelete = function() {
          return elastic["delete"]({
            index: self.getBucket(),
            type: self.getType(),
            id: key
          }, function(err) {
            if (err) {
              return deferred.reject(new RiakError(err));
            }
            return riakDelete();
          });
        };
        riakDelete = function() {
          return pbc.del({
            type: self.getType(),
            bucket: self.getBucket(),
            key: key
          }, function(err, reply, status) {
            if (err && status !== 404) {
              return deferred.reject(new RiakError(err));
            } else {
              return deferred.resolve();
            }
          });
        };
        if (env.elastic_search) {
          elasticDelete();
        } else {
          riakDelete();
        }
        return deferred.promise;
      };


      /**
      @constructor
       */

      function _Class(options) {
        this.contentType = options.contentType, this.key = options.key, this.lastMod = options.lastMod, this.lastModUsecs = options.lastModUsecs, this.value = options.value, this.vclock = options.vclock, this.vtag = options.vtag, this.indexes = options.indexes;
        if (this.indexes == null) {
          this.indexes = [];
        }
        this.contentType = this._detectContentType();
        return;
      }

      _Class.prototype.getKey = function() {
        return this.key;
      };

      _Class.prototype.getValue = function() {
        return this.value;
      };

      _Class.prototype.setValue = function(value) {
        this.value = value;
      };

      _Class.prototype.beforeSave = function() {};

      afterRetrieve = function() {

        /**
        Persists `this` *Model* instance in Basho Riak.
        @return {q.promise}
         */
      };

      _Class.prototype.save = function() {
        var deferred, elasticSearchPut, model, params;
        if (this.beforeSave instanceof Function) {
          this.beforeSave();
        }
        deferred = Q.defer();
        model = this;
        params = this._getPbParams();
        elasticSearchPut = (function(_this) {
          return function(payload) {
            if (!env.elastic_search) {
              return deferred.resolve(reply);
            }
            return elastic.index({
              index: self.getBucket(),
              type: self.getType(),
              id: _this.getKey(),
              body: _this.getValue(),
              refresh: true
            }, function(err) {
              if (err) {
                return deferred.reject(new RiakError(err, model, params));
              } else {
                return deferred.resolve(payload);
              }
            });
          };
        })(this);
        pbc.put(params, (function(_this) {
          return function(err, reply) {
            if (err) {
              return deferred.reject(new RiakError(err, model, params));
            } else {
              return elasticSearchPut(self.createFromReply({
                key: _this.key,
                reply: reply
              }));
            }
          };
        })(this));
        return deferred.promise;
      };

      _Class.prototype["delete"] = function() {
        return self["delete"](this.getKey());
      };


      /**
      Get the params object suitable for sending to the server via the protocol
      buffers API.
      @return {!Object}
       */

      _Class.prototype._getPbParams = function() {
        var content, params;
        params = {};
        params.type = self.getType();
        params.bucket = self.getBucket();
        params.key = this.key;
        if (this.vclock) {
          params.vclock = this.vclock;
        }
        params.return_body = true;
        content = {};
        content.value = this._getSerializedValue();
        content.content_type = this.getContentType();
        if (this.vtag) {
          content.vtag = this.vtag;
        }
        if (this._hasSecondaryIndexes()) {
          content.indexes = this._getSecondaryIndexes();
        }
        params.content = content;
        return params;
      };


      /**
      Get a serialized representation of the value of `this` *Model* instance.
      @return {string}
       */

      _Class.prototype._getSerializedValue = function() {
        switch (this.getContentType()) {
          case 'application/json':
            return JSON.stringify(this.value);
          default:
            return new Buffer(this.value).toString();
        }
      };

      _Class.prototype.getContentType = function() {
        return this.contentType;
      };


      /**
      Automatically detect the content type based on reflection of the value.
      @private
      @return {string}
       */

      _Class.prototype._detectContentType = function() {
        if (this.contentType) {
          return self._expandContentType(this.contentType);
        } else {
          if (this.value instanceof Buffer) {
            return self._expandContentType('binary');
          } else if (typeof this.value === 'object') {
            return self._expandContentType('json');
          } else {
            return self._expandContentType('plain');
          }
        }
      };

      _Class.prototype.addSecondaryIndex = function(key, value) {
        if (value == null) {
          value = null;
        }
        if (value != null) {
          this.addSecondaryIndexWithValue(key, value);
        } else {
          this.indexes.push(key);
        }
        return this;
      };

      _Class.prototype.addSecondaryIndexWithValue = function(key, value) {
        (this.indexValues != null ? this.indexValues : this.indexValues = {})[key] = value;
        return this;
      };

      _Class.prototype._hasSecondaryIndexes = function() {
        return this.indexes.length > 0;
      };

      _Class.prototype._getSecondaryIndexes = function() {
        var indexes, key, keyResult, value, _i, _len, _ref, _ref1;
        indexes = [];
        _ref = this.indexValues != null;
        for (key in _ref) {
          value = _ref[key];
          if (!this.indexValues.hasOwnProperty(key)) {
            continue;
          }
          indexs.push({
            key: key,
            value: value
          });
        }
        _ref1 = this.indexes;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          key = _ref1[_i];
          if (!this.value.hasOwnProperty(key)) {
            continue;
          }
          keyResult = {
            key: this._getSecondaryIndexKey(key),
            value: this.value[key]
          };
          if (_.some(indexes, {
            key: keyResult.key
          })) {
            continue;
          }
          indexes.push(keyResult);
        }
        return indexes;
      };


      /**
      Get the secondary index field name based on reflection of the value
      associated with the given `key`.
       */

      _Class.prototype._getSecondaryIndexKey = function(key) {
        if (key.indexOf("_bin") !== -1 || key.indexOf("_int") !== -1) {
          return key;
        }
        if (_.isNumber(this.value[key])) {
          return "" + key + "_int";
        } else if (_.isString(this.value[key])) {
          return "" + key + "_bin";
        } else {
          throw new Error('Invalid secondary index type');
        }
      };

      return _Class;

    })(EventEmitter);
  }
};

/*
//# sourceMappingURL=Model.js.map
*/
