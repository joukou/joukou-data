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
_       = require('lodash')
pbc     = require('../../src/lib/pbc')
glob    = require('glob')
fs      = require('fs')
cheerio = require('cheerio')
Q       = require('q')
child   = require('child_process')
jade    = require('jade')
env     = require('../../src/lib/env')
elastic = require('../../src/lib/elastic')

isActive = ( name ) ->
  deferred = Q.defer()
  args = [
    'bucket-type'
    'status'
    name
  ]
  admin = child.spawn(
    'riak-admin',
    args
  )
  data = ""
  admin.stdout.on('data', ( d ) ->
    data += d
  )
  admin.stderr.on('data', ( d ) ->
    console.log("stderr: " + d)
  )
  admin.on('close', ( code ) ->
    if code is 0
      return deferred.resolve( data.indexOf("is active") isnt -1 )
    deferred.resolve( false )
  )
  return deferred.promise

riakAdmin = ( args ) ->
  deferred = Q.defer()
  admin = child.spawn(
    'riak-admin',
    args
  )
  admin.stdout.on('data', ( data ) ->
    console.log("stdout: " + data)
  )
  admin.stderr.on('data', ( data ) ->
    console.log("stderr: " + data)
  )
  admin.on('close', ( code ) ->
    if code is 0
      return deferred.resolve()
    deferred.reject(new Error("riak-admin #{JSON.stringify(args)} exited with code #{code}"))
  )
  return deferred.promise

activate = ( name ) ->
  console.log( "Activating schema for #{name}")
  riakAdmin(
    [
      'bucket-type'
      'activate'
      name
    ]
  )

create = ( name, active ) ->
  console.log( "Creating schema for #{name}")
  riakAdmin(
    [
      'bucket-type'
      if active then 'update' else 'create'
      name
      '{"props":{"search_index":"' + name + '","allow_mult":false}}'
    ]
  )
  .then( ->
    return activate( name )
  )

deleteIndex: ( name, schema, active ) ->
  if not active
    return putIndex( name, schema, active )
  console.log( "Deleting index for #{name}")
  deferred = Q.defer()
  pbc.putSearchIndex({
    index:
      name: name
      schema: name
  }, ( err, reply ) ->
    if err
      return deferred.reject( err )
    putIndex( name, schema, active )
    .then( deferred.resolve )
    .fail( deferred.reject )
  )
  return deferred.promise

putIndex = ( name, schema, active ) ->
  console.log( "Putting index for #{name}")
  deferred = Q.defer()
  pbc.putSearchIndex({
    index:
      name: name
      schema: name
  }, ( err, reply ) ->
    if err
      return deferred.reject( err )
    console.log( 'Waiting 10 seconds for index to process' )
    setTimeout( ->
      create( name, active )
      .then( deferred.resolve )
      .fail( deferred.reject )
    , 10000)
  )
  return deferred.promise

putSchema = ( name, schema, active ) ->
  console.log( "Putting schema for #{name}")
  deferred = Q.defer()
  pbc.putSearchSchema({
    schema:
      name: name
      content: schema
  }, ( err, reply ) ->
    if err
      return deferred.reject( err )
    putIndex( name, schema, active )
    .then( deferred.resolve )
    .fail( deferred.reject )
  )
  return deferred.promise

runForSchema = ( name, schema ) ->
  deferred = Q.defer()
  isActive( name )
  .then( ( active ) ->
    console.log( "#{name} is #{if active then '' else 'not '}active")
    putSchema( name, schema, active )
    .then( deferred.resolve )
  )
  .fail( deferred.reject )
  return deferred.promise

addElasticIndex = ( name ) ->
  if not env.elastic_search
    return Q.resolve( )
  console.log("creating elastic search index for %s", name)
  deferred = Q.defer()
  elastic.indices.exists(
    {
      index: name
    },
    ( err, reply ) ->
      if err
        return deferred.reject(
          err
        )
      if reply
        console.log("elastic search index for %s already exists", name)
        return deferred.resolve()
      elastic.indices.create(
        {
          index: name
        },
        if err
          deferred.reject(
            err
          )
        else
          console.log("created elastic search index for %s", name)
          deferred.resolve(

          )
      )

  )

  return deferred.promise



domToSchema = ( name, dom ) ->
  ###
  Purpose for this is to remove all comments and to match correct casing
  Cheerio lower cases all the tags and attributes which is a problem,
  While riak doesn't like having a commend as the first element
  ###

  lines = []

  keyMap = {
    multivalued: 'multiValued'
    positionincrementgap: 'positionIncrementGap'
    sortmissinglast: 'sortMissingLast'
  }

  lines.push("<fields>")
  for field in dom( 'schema fields field' )
    line = "<field "
    attribs = field.attribs
    for attributeKey of attribs
      if not attribs.hasOwnProperty(attributeKey)
        continue
      line += "#{keyMap[attributeKey] or attributeKey}='#{attribs[attributeKey]}' "
    line += ">"
    line += cheerio( field ).text()
    line += "</field>"
    lines.push( line )
  lines.push("</fields>")

  if dom( 'schema uniquekey' )
    uniqueKey = dom( 'schema uniquekey' )
    lines.push("<uniqueKey>#{uniqueKey.text()}</uniqueKey>")

  lines.push("<types>")
  for fieldType in dom( 'schema types fieldType' )
    line = "<fieldType "
    attribs = fieldType.attribs
    for attributeKey of attribs
      if not attribs.hasOwnProperty(attributeKey)
        continue
      line += "#{keyMap[attributeKey] or attributeKey}='#{attribs[attributeKey]}' "
    line += ">"
    line += cheerio( fieldType ).text()
    line += "</fieldType>"
    lines.push( line )
  lines.push("</types>")

  return "<schema name='#{name}' version='1.5'>#{lines.join('')}</schema>"

arg = process.argv[2]

glob('src/**/schema.jade', ( err, files ) ->
  if err
    console.log( err )
    return process.exit( 1 )
  next = ->
    console.log( '\n-----------------------\n' )
    file = files.pop()
    if not file
      return process.exit( 0 )
    console.log( "Reading file #{file}" )
    fs.readFile(file, ( err, data ) ->
      if err
        return next( )
      console.log( "Rendering file #{file}" )
      xml = jade.render( data, {} )
      console.log( "Loading DOM for file #{file}" )
      dom = cheerio.load( xml )
      schema = dom( 'schema[name]' )
      if not schema
        return next( )
      name = schema.attr( 'name' )
      if (
        not dom( 'schema fields field') or
        not dom( 'schema types fieldType')
      )
        return next( )
      if arg and name.toLowerCase() isnt arg.toLowerCase()
        console.log( "%s isn't %s", name.toLowerCase(), arg.toLowerCase())
        return next( )
      console.log( "Running for #{name}" )
      xmlSchema = domToSchema( name, dom )
      runForSchema( name, xmlSchema )
      .then( ->
        return addElasticIndex(
          name
        )
      )
      .then( next )
      .fail( ( err ) ->
        console.log( err )
        if err and err.stack
          console.log( err.stack )
        next( )
      )
    )
  next( )
)


