#!/usr/bin/env bash

set -ex
parallel -t git push {} master :::: .remotes.txt
parallel -t ssh {} sudo git -C /var/www/puppetlogs pull :::: .hosts.txt
