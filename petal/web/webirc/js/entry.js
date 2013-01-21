/*jshint browser:true */
var shoe = require('shoe');
var dnode = require('dnode');

var domready = require('domready');

domready(function () {
    var stream = shoe('/dnode');
    
    var d = dnode();
    d.on('remote', function (remote) {
        remote.register("webirc", function shutdown(c) {
            console.log('server shutting down');
            c();
        }, function(handle, unregister) {
            console.log(handle);
        });

        console.log(remote);
    });
    d.pipe(stream).pipe(d);
    var main = document.getElementById("main");
    main.innerHTML = "";
    var num = 100;
    var int = setInterval(function(){
        var line = document.createElement("div");
        line.innerHTML = "hello";
        main.appendChild(line);
        if (--num === 0) {
            clearInterval(int);
        }
    }, 100);
});
