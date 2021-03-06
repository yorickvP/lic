"use strict";

var path = require ("path");

var Utils = {
	home: function() {
		var home = process.env.HOME;
		
		if (process.platform === 'win32') {
			// Only believe $HOME if it exists
			if (home) {
				if (!path.existsSync(home)) {
					home = null;
				}
			}
			// In case HOME is Unix-style (it happens), convert it to
			// Windows style.
			if (home) {
				home = home.replace(/\//g, '\\');
			}
			
			if (!home) {
				// USERPROFILE is probably the closest equivalent to $HOME?
				home = process.env.USERPROFILE;
			}
		}
		
		// I don't think we can use the getpwid function in Node.js very easily
		// If home still isn't set, we use the current dir I guess
		if (!home) {
			home = '.';
		}
		
		return home;
	}
};

module.exports = Utils;
