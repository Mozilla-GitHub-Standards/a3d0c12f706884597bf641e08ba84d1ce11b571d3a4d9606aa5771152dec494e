Gecko Presence Service
======================

Building
--------

To add this service in your B2G build, insert this directory in <B2G>/gecko/dom as
"presence".

e.g.::

    $ cd B2G/gecko/dom
    $ ln -s /path/to/repos/gecko-dom-presence presence

Then, add those lines into gecko/b2g/installer/package-manifest.in ::

    @BINPATH@/components/Presence.js
    @BINPATH@/components/Presence.manifest
    @BINPATH@/components/PresenceServiceLauncher.js

Under @BINPATH@/components/PushServiceLauncher.js

Rebuild & Flash::

    $ cd B2G
    $ ./build.sh
    $ ./flash.sh


Activation
----------

Add a **custom-prefs.js** file inside your gaia/build directory with this content::

    user_pref("services.presence.serverURL", "ws://presence.ziade.org/presence");
    user_pref("services.presence.enabled", true);
    user_pref("services.presence.connection.enabled", true);
    user_pref("services.presence.debug", true);

This will activate the service.

Reset Gaia::

    $ cd gaia
    $ make reset-gaia

