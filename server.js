var dnsd = require('dnsd');
//  dnsd = dnsd.defaults({convenient: false});
var http = require('http');
var hash = {};

// Sends HTTP GET request to Docker's JSON API
function callDocker(endpoint, done) {
  const req = http.request({socketPath: '/var/run/docker.sock', path: endpoint}, (res) => {
    var data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => done(JSON.parse(data)));
  });
  req.on('error', console.error);
  req.end();
}

// Sends HTTP GET request to Docker's JSON API
function callDocker(endpoint, done) {
    const req = http.request({socketPath: '/var/run/docker.sock', path: endpoint}, (res) => {
        var data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => done(JSON.parse(data)));
    });
    req.on('socket', (socket) => {
      socket.setTimeout(500);
      socket.on('timeout', () => req.abort());
    });
    req.on('error', console.error);
    req.end();
}

// Call docker client every 1 second and maintain a hash of containerName => IP
setInterval(() => {
  callDocker('/containers/json', (containers) => {
     containers.forEach(container => {
       container.Names.forEach(containerName => {
         const name = containerName.replace('/', '');
         const ips  = [];
         for(let network in container.NetworkSettings.Networks) {
           ips.push(container.NetworkSettings.Networks[network].IPAddress);

         }
         hash[name] = ips;
       });
     });
  });
}, 1000);

// DNS Server
var dns = dnsd.createServer((req, res) => {
  var question = res.question[0];
  var hostname = question.name;

  // Only send answer if we have it
  if(question.type == 'A' && hash[hostname] !== undefined) {
    hash[hostname].forEach(ip => res.answer.push({name: hostname, type: 'A', data: ip, 'ttl': 5}))
    console.log(`A [${hostname}] :`, hash[hostname].join(','));
  } else {
    console.log(`! [${hostname}]`);
  }
  res.end();
});
dns.on('error', (error) => console.error(error));
dns.listen(53);

console.log('Server running at *:53')








