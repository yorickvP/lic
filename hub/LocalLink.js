var LocalLink = function (hub, petal) {
	this.hub   = hub;
	this.petal = petal;
};

require ("util").inherits (LocalLink, process.EventEmitter);

LocalLink.prototype.register = function (name, connect, disconnect)  {
	var self = this;

	this.hub.register_petal (name, function () {
		self.connected  = true;
		self.petal_name = name;
		self.emit ("connect");

		connect ();
	}, function (success) {

		disconnect (function () {
			self.connected = false;
			self.emit ("disconnect");
			success ();
		});
	});
};

LocalLink.prototype.disconnect = function () {
	this.hub.disconnect_petal (this.petal_name);
};

LocalLink.prototype.item = function (id) {
	return new Item (this.hub, this.petal_name, id);
};

LocalLink.prototype.respond = function (handler) {
	var wrapped_handler = function (item, command, data, success, error) {
		try {
			handler (item, command, data, success, error);
		} catch (e) {
			error ({type: "NativeException", description: "" + e});
		}
	};

	this.hub.command_manager.define_provider (this.petal_name, wrapped_handler);
};

var Item = function (hub, petal_name, id) {
	this.hub        = hub;
	this.petal_name = petal_name;
	this.id         = id;
};

Item.prototype.subscribe = function (type, handler) {
	var self = this;

	var wrapped_handler = function (item, type, data) {
		try {
			handler ({item: item, type: type, data: data, next: function () {
				self.hub.event_manager.next (self.petal_name, this.item, this.type, this.data);
			}});
		} catch (e) {
			console.error ("[WARN] in " + self.petal_name + ": " + e);
		}
	};
	this.hub.event_manager.subscribe (this.petal_name, this.id, type, wrapped_handler);
};

Item.prototype.unsubscribe = function (type) {
	this.hub.event_manager.unsubscribe (this.petal_name, this.id, type);
};

Item.prototype.publish = function (type, data) {
	this.hub.event_manager.publish (this.id, type, data);
};

Item.prototype.invoke = function (command, args, success, error) {
	this.hub.command_manager.dispatch (this.id, command, args, success, error);
};

module.exports = LocalLink;