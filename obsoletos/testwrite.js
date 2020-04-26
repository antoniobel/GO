var fs = require('fs');
var os = require("os");

d = new Date();
nombre = 'F' + d.getFullYear() + '.' + (d.getMonth()+1) + '.' + d.getDate() + "-" + d.getHours() + "." + d.getMinutes() + 
        '.' + d.getSeconds() + '_';
var file = nombre + 'A. Bel.txt';
var path = 'logs/' + file;

var contenido = [];
contenido.push('linea 1');
contenido.push('linea 2');

var todo ='';
contenido.forEach(linea => {
    todo += linea + os.EOL;
});
//create a file named mynewfile3.txt:
fs.writeFile(path, todo, function (err) {
  if (err) throw err;
  console.log('fichero salvado!' + path);
});