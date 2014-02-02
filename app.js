var fs = require('fs');
var path = require('path');
var pc = require('./piccontrol.js')
var express = require("express");
var im = require('imagemagick');
var app = express();
app.use(express.urlencoded());
var exec = require('child_process').exec
var spawn = require('child_process').spawn;
var fileop = require('child_process').spawn;
var util = require('util');
var ps = exec('pkill PTPCamera');
var sleep = require('sleep');
var filearray = [];
var picctr=0;
pc.Child.stderr.pipe(process.stderr);
pc.Child.stdout.pipe(process.stdout);


fs.readdir('./previews/', function (err, files) {
    if (err) throw err;
    files.forEach( function (file) {
        if(path.extname(file)=='.jpg')
            filearray.push(file);
    })

});

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
    var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    console.log(ip + ": is connected");

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
            //res.end();


            setTimeout(send_next, 100);
        });


    };
    send_next();


});

app.post('/autofocus', function (request, response) {
    pc.Child.stdin.write('autofocus\n')
    console.log('did autofocus')
    response.end()

});
app.post('/manufocus', function (request, response) {
    var focus = request.body.focus
    pc.Child.stdin.write('manufocus='+focus+'\n')
    console.log('did manufocus:', focus)
    response.end()

});
app.post('/setiso', function (request, response) {
    var iso = request.body.iso
    console.log('did iso:', iso)
    pc.Child.stdin.write('iso='+iso+'\n')
    console.log('did iso:', iso)
    response.end()

});
app.post('/takeshot', function (request, response) {
    pc.sema=false;
    pc.Child.stdin.write('shot\n')
    console.log('did shot')
    response.end()

    setTimeout(function () {
        pc.sema=true;
    }, 5000);
    var ps = exec('mv 13* ./resources');

    fs.watch('./resources', function (event, filename) {
        console.log('event is: ' + event);
        if (filename) {
            console.log('filename provided: ' + filename);
            im.resize({
                srcPath: './resources/'+filename,
                dstPath: './previews/'+filename,
                width:   700
            }, function(err, stdout, stderr){
                if (err) throw err;
                console.log('resized image to fit within 200x200px');
                filearray.push(filename);
            });

        } else {
            console.log('filename not provided');
        }
    });




});

app.get('/picsite', function (request, response) {

    //console.log(request);
    var direc = request.query.direc;
    //console.log(request.query);
    if(direc=='next' && picctr<(filearray.length-1)) {
        picctr++;

    }
    if(direc=='back' && picctr>0){
        picctr--;
    }


    response.send('<br/><img src=pic.jpg><br/>');






});
//console.log('/'+filearray[0]);

app.get('/pic.jpg', function (request, response) {
    response.writeHead(200, {
        'Content-Type': 'multipart/x-mixed-replace; boundary=myboundary',
        'Cache-Control': 'no-cache',
        'Connection': 'close',
        'Pragma': 'no-cache'
    });

   var send_next_picsite = function () {
   //console.log('in:'+filearray[picctr]);
   fs.readFile('./previews/'+ filearray[picctr], function (err, content) {

            response.write("--myboundary\r\n");
            response.write("Content-Type: image/jpeg\r\n");
            response.write("Content-Length: " + content.length + "\r\n");
            response.write("\r\n");
            response.write(content, 'binary');
            response.write("\r\n");
            setTimeout(send_next_picsite(), 3000);

        })
   }

   send_next_picsite();

});




var port = process.env.PORT || 5000;
app.listen(port, function () {
    console.log("Listening on " + port);
});
process.on('uncaughtException', function(err) {
    console.log(util.inspect(err));
})