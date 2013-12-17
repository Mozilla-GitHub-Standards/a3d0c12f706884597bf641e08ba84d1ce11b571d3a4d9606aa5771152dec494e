/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Don't modify this, instead set services.push.debug.
let gDebuggingEnabled = false;

function debug(s) {
  if (gDebuggingEnabled)
    dump("-*- Presence.js: " + s + "\n");
}

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/DOMRequestHelper.jsm");
Cu.import("resource://gre/modules/AppsUtils.jsm");

const PUSH_CID = Components.ID("{cdf1d019-fad8-4044-b141-65fb4fb7a245}");

/**
 * The Presence component runs in the child process and exposes the SimplePresence API
 * to the web application. The PresenceService running in the parent process is the
 * one actually performing all operations.
 */
function Presence() {
  debug("Presence Constructor");
}

Presence.prototype = {
  __proto__: DOMRequestIpcHelper.prototype,

  contractID: "@mozilla.org/presence/PresenceManager;1",

  classID : PUSH_CID,

  QueryInterface : XPCOMUtils.generateQI([Ci.nsIDOMGlobalPropertyInitializer,
                                          Ci.nsISupportsWeakReference,
                                          Ci.nsIObserver]),

  init: function(aWindow) {
    // Set debug first so that all debugging actually works.
    // NOTE: We don't add an observer here like in PresenceService. Flipping the
    // pref will require a reload of the app/page, which seems acceptable.
    gDebuggingEnabled = Services.prefs.getBoolPref("services.push.debug");
    debug("init()");

    let principal = aWindow.document.nodePrincipal;
    let appsService = Cc["@mozilla.org/AppsService;1"]
                        .getService(Ci.nsIAppsService);

    this._manifestURL = appsService.getManifestURLByLocalId(principal.appId);
    this._pageURL = principal.URI;

    this.initDOMRequestHelper(aWindow, [
      "PresenceService:Register:OK",
      "PresenceService:Register:KO",
      "PresenceService:Unregister:OK",
      "PresenceService:Unregister:KO",
      "PresenceService:Registrations:OK",
      "PresenceService:Registrations:KO"
    ]);

    this._cpmm = Cc["@mozilla.org/childprocessmessagemanager;1"]
                   .getService(Ci.nsISyncMessageSender);
  },

  receiveMessage: function(aMessage) {
    debug("receiveMessage()");
    let request = this.getRequest(aMessage.data.requestID);
    let json = aMessage.data;
    if (!request) {
      debug("No request " + json.requestID);
      return;
    }

    switch (aMessage.name) {
      case "PresenceService:Register:OK":
        Services.DOMRequest.fireSuccess(request, json.pushEndpoint);
        break;
      case "PresenceService:Register:KO":
        Services.DOMRequest.fireError(request, json.error);
        break;
      case "PresenceService:Unregister:OK":
        Services.DOMRequest.fireSuccess(request, json.pushEndpoint);
        break;
      case "PresenceService:Unregister:KO":
        Services.DOMRequest.fireError(request, json.error);
        break;
      case "PresenceService:Registrations:OK":
        Services.DOMRequest.fireSuccess(request, json.registrations);
        break;
      case "PresenceService:Registrations:KO":
        Services.DOMRequest.fireError(request, json.error);
        break;
      default:
        debug("NOT IMPLEMENTED! receiveMessage for " + aMessage.name);
    }
  },

  register: function() {
    debug("register()");
    let req = this.createRequest();
    if (!Services.prefs.getBoolPref("services.push.connection.enabled")) {
      // If push socket is disabled by the user, immediately error rather than
      // timing out.
      Services.DOMRequest.fireErrorAsync(req, "NetworkError");
      return req;
    }

    this._cpmm.sendAsyncMessage("Presence:Register", {
                                  pageURL: this._pageURL.spec,
                                  manifestURL: this._manifestURL,
                                  requestID: this.getRequestId(req)
                                });
    return req;
  },

  unregister: function(aPresenceEndpoint) {
    debug("unregister(" + aPresenceEndpoint + ")");
    let req = this.createRequest();
    this._cpmm.sendAsyncMessage("Presence:Unregister", {
                                  pageURL: this._pageURL.spec,
                                  manifestURL: this._manifestURL,
                                  requestID: this.getRequestId(req),
                                  pushEndpoint: aPresenceEndpoint
                                });
    return req;
  },

  registrations: function() {
    debug("registrations()");
    let req = this.createRequest();
    this._cpmm.sendAsyncMessage("Presence:Registrations", {
                                  manifestURL: this._manifestURL,
                                  requestID: this.getRequestId(req)
                                });
    return req;
  }
}

this.NSGetFactory = XPCOMUtils.generateNSGetFactory([Presence]);
