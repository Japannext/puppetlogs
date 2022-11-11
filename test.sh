#!/usr/bin/env bash

port=8000
echo http://"$(facter ipaddress)":${port}
set -x
ruby -rwebrick -e 'WEBrick::HTTPServer.new(:Port => '${port}', :DocumentRoot => ".").start'
