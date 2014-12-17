elasticsearch = require( 'elasticsearch' )

module.exports = new elasticsearch.Client({
  host: {
    protocol: 'http',
    host: 'localhost',
    port: 9200
  }
})