
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
var agent, circle, circlePort, connection, graph, graphPort, network, persona, process;

agent = require('./models/agent/schema');

circle = require('./models/circle/schema');

circlePort = require('./models/circle/port/schema');

persona = require('./models/persona/schema');

graph = require('./models/persona/graph/schema');

graphPort = require('./models/persona/graph/port/schema');

connection = require('./models/persona/graph/connection/schema');

network = require('./models/persona/graph/network/schema');

process = require('./models/persona/graph/process/schema');

module.exports = {
  agent: agent,
  circle: circle,
  circlePort: circlePort,
  persona: persona,
  graph: graph,
  graphPort: graphPort,
  connection: connection,
  network: network,
  process: process
};

/*
//# sourceMappingURL=schemas.js.map
*/
