/**
 * Created by danielhuebner on 05.01.14 KW 1.
 */

var spawn = require('child_process').spawn;
var child = spawn('./resources/shell');

exports.Child = child;
child.stderr.pipe(process.stderr);
child.stdout.pipe(process.stdout);


exports.runpicloop = function () {

    child.stdin.write('previewNAN\n');


}
setInterval(function () {
    exports.runpicloop();
}, 100);