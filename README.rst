Gecko Presence Service
======================

To add this service in your B2G build, insert this directory in <B2G>/gecko/dom as
"presence".

e.g.::

    $ cd B2G/gecko/dom
    $ ln -s /path/to/repos/gecko-dom-presence presence

Add a **custom-prefs.js** file inside your build directory with this content::

    user_pref("services.presence.serverURL", "ws://presence.ziade.org/presence");
    user_pref("services.presence.enabled", true);
    user_pref("services.presence.connection.enabled", true);
    user_pref("services.presence.debug", true);

This will activate the service.

Prune your profile::

    rm -rf profile

Rebuild & Flash::

    $ ./build.sh
    & ./flash.sh
