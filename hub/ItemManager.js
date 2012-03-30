var util = require ("util");

/* ItemManager:
 * This object is the main router for all of lic's events.
 * Petals like the IRC manager will register all of its events
 * with the ItemManager instance belonging to the hub.
 * This is the main starting point for all of the events.
 */
var ItemManager = module.exports = function () {
	this.listener_tree = {};
};

ItemManager.prototype.send = function(event) {
	util.puts (util.inspect (event, false, 2, true));
};

ItemManager.prototype.listen = function(items, listener, callback) {
	if (Array.isArray (items)) {
		if (typeof items[0] === "string") {
			add_listener.call (this, items, listener);
		} else {
			items.forEach (function(item) {
				add_listener.call (this, item, listener);
			});
		}
	} else {
		if (callback) {
			callback.call (this, new Error("Invalid argument for listen"));
		}
	}

	function add_listener(item, listener) {
		var node = this.listener_tree;
		var item_length = item.length;
		var part;

		for (var i = 0; i < item_length; i++) {
			part = item[i];
			if (typeof node[part] !== "object") {
				node[part] = {};
			}

			if (i === item_length-1) {
				// Append the listener
				if (node[part].listeners) {
					node[part].listeners.push (listener);
				} else {
					node[part].listeners = [listener];
				}
				break;
			}

			node = node[part];
		}
	}
};