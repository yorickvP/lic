/*jshint browser:true */
var shoe = require('shoe');
var dnode = require('dnode');

var domready = require('domready');
var bean = require('bean');
var util = require('util');
var events = require('events');


function Petal() {
    var stream = shoe('/dnode');
    
    var d = dnode();

    var self = this;

    d.on('remote', function (remote) {
        remote.register("webirc", function shutdown(c) {
            self.emit('shutdown');
            c();
        }, function(handle, unregister) {
            self.unregister = unregister;
            self.handle = handle;
            self.emit('connect');
        });

    });
    stream.on('end', function() {
        self.emit('disconnect');
    });
    d.pipe(stream).pipe(d);
}

util.inherits(Petal, events.EventEmitter);
function padNum(num, i) {
    num = ""+num;
    if (i===0 || num.length >= i) {
        return num;
    }
    return padNum("0" + num, i-1);
}
function ircToHTML(ircevent) {
    ircevent = ircevent.data;
    function textSpan(className, text) {
        var sp = document.createElement('span');
        sp.className = className;
        sp.appendChild(document.createTextNode(text));
        return sp;
    }
    var wrapper = document.createElement('div');
    wrapper.className = "textline";
    var time = new Date();
    var timeSpan = textSpan('time', '['+
                [time.getHours(), time.getMinutes(), time.getSeconds()]
                    .map(function(x) { return padNum(x, 2); }).join(':') + ']');
    wrapper.appendChild(timeSpan);
    var nick;
    if (ircevent.commmand === "PRIVMSG") {
        nick = textSpan('nick', '<'+ircevent.prefix.split('!')[0]+'>');
        wrapper.appendChild(nick);
        wrapper.appendChild(textSpan('msg', ircevent.params.join('/')));
    } else {
        if (ircevent.prefix) {
            nick = textSpan('nick', '<'+ircevent.prefix.split('!')[0]+'>');
            wrapper.appendChild(nick);
        }
        wrapper.appendChild(textSpan('action', ircevent.command));
        wrapper.appendChild(textSpan('msg', ircevent.params.join('/')));
    }
    return wrapper;
}
function OutputField(elem) {
    this.elem = elem;
    elem.innerHTML = '';
}
OutputField.prototype.append = function(text) {
    var scrollold = this.elem.scrollHeight;
    var textline = document.createElement("div");
    textline.className = "textline";
    textline.innerHTML = text;
    this.elem.appendChild(textline);
    this.elem.scrollTop += this.elem.scrollHeight - scrollold;
};
OutputField.prototype.appendHTML = function(elem) {
    var scrollold = this.elem.scrollHeight;
    this.elem.appendChild(elem);
    this.elem.scrollTop += this.elem.scrollHeight - scrollold;
};
function InputField(elem) {
    this.elem = elem;
    var input = elem.firstChild;
    var self = this;
    bean.on(input, 'keypress', function(e) {
        if (e.keyCode === 13) {
            var content = input.value;
            input.value = "";
            self.emit('input', content);
        }
    });
}
util.inherits(InputField, events.EventEmitter);

function StatusField(elem) {
    return {
        set: function(status) {
            elem.innerHTML = status;
        }
    };
}

domready(function () {
    var petal = new Petal();

    var mainout = new OutputField(document.getElementById('main'));
    var mainin = new InputField(document.getElementById('input'));
    var statusout = new StatusField(document.getElementById('status'));
    mainin.on('input', function(content) {
        mainout.append(content);
    });
    mainout.append("welcome to LIC!");
    petal.on('connect', function() {
        console.log('connected');
        mainout.append('Connection Established.');
        statusout.set('Connected'); // ping here?
        petal.handle.subscribe(['irc', '*'], '*', function(event) {
            mainout.appendHTML(ircToHTML(event));
            event.next(event);
        });
    });
    petal.on('disconnect', function() {
        mainout.append('Connection Lost.');
        statusout.set('Disconnected');
    });
    var commands = {
        "eval": function(command) {
            /*jshint evil: true */
            mainout.append(eval(command.slice('/eval '.length)));
        }
    };
    mainin.on('input', function(content) {
        if (content.indexOf('/') === 0) {
            var cmd = content.slice(1).split(' ')[0];
            if (commands[cmd]) {
                commands[cmd](content);
            }
        }
    });
});
