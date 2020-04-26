/*
 * Servidor http normal (sin Colyseus) para probar codigo jvascript
 */
const http = require('http');
const url = require('url');
const fs = require('fs');

const port = 3000;

const server = http.createServer((req, res) => {
    var myUrl = url.parse(req.url , true);
    var filename = "." + myUrl.pathname;
    fs.readFile(filename, (err, data) => {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/html'});
            return res.end("404 Not Found");
        }  
        console.log(`Enviando ${filename}`);
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        return res.end();
    });
});

server.listen(port, () => {
  console.log(`Server running at port ${port}`);
});

