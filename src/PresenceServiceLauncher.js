/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
const Cr = Components.results;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/Preferences.jsm");

const prefs = new Preferences("services.presence.");


function debug(s) {
  dump("-*- PresenceServiceLauncher.jsm: " + s + "\n");
}



function PresenceServiceLauncher() {
};

PresenceServiceLauncher.prototype = {
  classID: Components.ID("{4b8caa3b-3c58-4f3c-a7g5-7bd9cb24c11d}"),

  contractID: "@mozilla.org/presence/ServiceLauncher;1",

  QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver,
                                         Ci.nsISupportsWeakReference]),

  observe: function observe(subject, topic, data) {
    switch (topic) {
      case "app-startup":
        debug("app-startup");
        Services.obs.addObserver(this, "final-ui-startup", true);
        break;
      case "final-ui-startup":
        debug("final-ui-startup");
        Services.obs.removeObserver(this, "final-ui-startup");
        if (!Services.prefs.getBoolPref("services.presence.enabled")) {
          return;
        }
        debug("loading the service");
        Cu.import("resource://gre/modules/PresenceService.jsm");
        PresenceService.init();
        break;
    }
  }
};

this.NSGetFactory = XPCOMUtils.generateNSGetFactory([PresenceServiceLauncher]);
