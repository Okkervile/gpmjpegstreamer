var fs = require('fs');
var pc = require('./resources/piccontrol.js')
var express = require("express");
var app = express();

var exec = require('child_process').exec
var spawn = require('child_process').spawn;

var ps = exec('pkill PTPCamera');


pc.runpicloop();


app.get('/', function (request, response) {
    response.send('<br/><img src=snapshot.jpg><br/>');

});

app.get('/snapshot.jpg', function (request, res) {
    res.writeHead(200, {
        'Content-Type': 'multipart/x-mixed-replace; boundary=myboundary',
        'Cache-Control': 'no-cache',
        'Connection': 'close',
        'Pragma': 'no-cache'
    });

    var i = 0;
    var stop = false;

    res.connection.on('close', function () {
        stop = true;
    });

    var send_next = function () {
        if (stop) {
            pc.Child.stdin.write('gpclose\n')
            return;
        }
        i = (i + 1) % 100;

        fs.readFile('./snapshot.jpg', function (err, content) {
            res.write("--myboundary\r\n");
            res.write("Content-Type: image/jpeg\r\n");
            res.write("Content-Length: " + content.length + "\r\n");
            res.write("\r\n");
            res.write(content, 'binary');
            res.write("\r\n");


            setTimeout(send_next, 100);
        });


    };
    send_next();


});


var port = process.env.PORT || 5000;
app.listen(port, function () {
    console.log("Listening on " + port);
});
