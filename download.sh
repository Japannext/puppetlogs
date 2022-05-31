set -x
rsync -avPAH $(head -n1 .hosts.txt):/var/www/puppetlogs/.data/ ./.data/
