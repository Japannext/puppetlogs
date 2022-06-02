Puppetlogs: A resource visualization aggregator for Puppet reports
------------------------------------------------------------------

This project makes it easy to visualize the amount of changes happening on a
fleet of puppet-managed hosts. This is especially meaningful when the agents
are not actually deploying any changes for environments where change management
may require changes are deployed in certain windows.

Prerequisites
-------------

- Any web server to host the page
- Access to a PuppetDB instance to get the code from
- The following utilities available in `$PATH`:
  - `jq`
  - `pv`
  - `tmpwatch`
  - `curl`
  - `bash`
  - `readlink`

How to use
----------

1. Prepare the data to be visualized. `update.sh` would download the latest
   reports from a locally running PuppetDB, you can point it to a different
   host by exporting the `$url` environment variable. You may want to run this
   periodically.

2. You may want to create a `puppetlogs.local.js` file in which you can set the
   `ownwer_to_roles` and `permanentConfig` variables to suit your environment.

3. Make a web server serve this repository. You would need to let it follow
   symbolic links. "test.sh" can be used to try it in a simple Ruby WebRick
   webserver.

