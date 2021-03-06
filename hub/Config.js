"use strict";

var fs        = require ("fs");
var path      = require ("path");
var util      = require ("util");

var Petal     = require ("../petal/lib/Petal.js");
var Utils     = require ("./Utils.js");

/**
 * HubConfig:
 * This is actually an internal petal which creates
 * a special lic/config item. This item can be used by all
 * petals to access, update, and modify global configuration.
 **/

var HubConfig = function (item_manager, path) {
	Petal.call (this, item_manager);

	item_manager.listen (["lic", "config"], this);

	this.path = path;

	// lic defaults
	this.data = {};
};

util.inherits (HubConfig, Petal);

/**
 * HubConfig#get(keys, callback):
 * Accepts an array of keys relating to the config and
 * calls back with a new array of corresponding values
 **/
HubConfig.prototype.get = function (keys, callback) {
	var parts, node, response = [];

	if (typeof keys === "string") {
		keys = [keys];
	}

	for (var key_i = 0, key_len = keys.length; key_i < key_len; key_i++) {

		node = this.data;
		parts = keys[key_i].split (".");

		for (var i = 0, len = parts.length; i < len; i++) {

			if (typeof node !== "object") {
				if (callback) {
					callback.call (this, new Error("Cannot access property of non-object"));
				}
				return;
			}

			node = node[parts[i]];
		}

		response.push (node);
	}

	if (callback) {
		callback.call (this, null, response);
	}
};


/**
 * HubConfig#set(obj, callback):
 * Accepts an object of key/value pairs and attemps to
 * set the configuration keys to the corresponding values
 **/
HubConfig.prototype.set = function (obj, callback) {
	var parts, node, value;

	Object.keys(obj).forEach(function(key) {
		node = this.data;
		parts = key.split (".");
		value = obj[key];

		for (var i = 0, len = parts.length; i < len; i++) {
			
			if (typeof node !== "object") {
				if (callback) {
					// TODO: Rollback other set properties?
					callback.call (this, new Error("Cannot set property on non-object"));
				}
				return;
			}

			if (i >= (len-1)) {
				node[parts[i]] = value;
			} else {
				node = node[parts[i]];
			}
		}
	});

	if (callback) {
		callback.call (this, null);
	}

};

/**
 * HubConfig#clear(keys, callback):
 * Removes keys from the configuration
 **/
HubConfig.prototype.clear = function (keys, callback) {
	// TODO: Implement this.
};

HubConfig.prototype.load = function (callback) {
	var location;

	location = this.path;

	this.load_file (location, function (error) {
		if (error) {
			console.error ("Could not create configuration file: %s", location);
			process.exit ();
		}

		if (callback) {
			callback.call (this);
		}
	});

};


HubConfig.prototype.create_directory = function (dir, callback) {
	var self = this;

	path.exists (dir, function (exists) {
		if (exists) {
			callback.call (self, null);
		} else {
			fs.mkdir (dir, function (error) {
				if (error) {
					self.create_directory (path.dirname (dir), function(error) {
						if (error) {
							callback.call (self, error);
						} else {
							self.create_directory (dir, callback);
						}
					});
					return;
				}
				
				callback.call (self, null);
			});
		}
	});
};


HubConfig.prototype.create_config = function (filename, callback) {
	var self = this;

	console.log ("Creating configuration file: %s", filename);

	this.create_directory (path.dirname (filename), function (error) {
		if (error) {
			callback.call (self, error);
			return;
		}
		
		self.write_file (filename, callback);
	});
};


/**
 * HubConfig#load_file()
 * Read a lic configuration file into the object
 **/
HubConfig.prototype.load_file = function (filename, callback) {
	var self = this;

	fs.readFile (filename, "utf8", function (error, json) {
		var data;

		if (error) {
			self.create_config (filename, function(error) {
				if (error) {
					console.error ("Could not create configuration file: %s", filename);
					process.exit ();
					return;
				}
				callback.call (self, error);
			});
			return;
		}

		console.log ("Reading configuration: %s", filename);

		try {
			// Try to parse the file as JSON
			data = JSON.parse (json);

			self.load_config_data (data);
			callback.call (self, null);
		} catch (e) {
			console.error (String(e));
			callback.call (self, e);
		}
	});
};

/**
 * HubConfig#write_file():
 * Save the configuration data as-is to disk.
 **/
HubConfig.prototype.write_file = function(file, callback) {
	var data, self = this;

	data = JSON.stringify (this.data, null, 4);

	console.log ("Saving configuration: %s", file);

	fs.writeFile (file, data, 'utf8', function(error) {
		callback.call (self, error);
	});
};


HubConfig.prototype.load_config_data = function (data) {

	var getOwn = Object.getOwnPropertyNames;

	(function extend (base, extension) {
		getOwn (extension).forEach(function (prop) {
			if (typeof base[prop] === 'object') {
				if (typeof extension[prop] !== 'object') {
					throw new Error ('A ' + typeof extension[prop] + ' exists where an object is expected.');
				}
				extend (base[prop], extension[prop]);
			} else {
				base[prop] = extension[prop];
			}
		});
	}(this.data, data));

};

/**
 * HubConfig#shutdown:
 * This command is called when the hub begins to shutdown.
 * It it inherited from Petal#shutdown.
 *
 * It does not write changes in the configuration to disk
 * because that should be done by the user. Some petals may change
 * configuration that the user only wants set temporarily.
 **/

module.exports = HubConfig;
