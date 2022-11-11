#!/usr/bin/env bash

set -eux -o pipefail

[[ -d "${0%/*}"/.data ]] || mkdir "${0%/*}"/.data
cd "${0%/*}"/.data
now=$(date -Is)
symlink=puppetlogs-${now%T*}.json
latest_symlink=puppetlogs-latest.json
old_file=$(readlink "${symlink}" || echo "")

new_file=puppetlogs-${now}.json
: "${url:=http://localhost:8080}"

[[ -f $new_file ]] && exit 1

curl -s -X GET "${url}"/pdb/query/v4/reports --data-urlencode 'include_total=false' --data-urlencode 'query=["=","latest_report?",true]' \
	| pv -N downloaded \
	| jq '[
		.[]
		| (
			.certname as $certname
			| ( .certname | split(".") | .[0] ) as $hostname
			| .environment as $environment
			| ( .start_time[0:19] + "Z" | fromdateiso8601 ) as $epoch
			| ( $epoch | strflocaltime("%F")) as $date
			| ( ( now - $epoch) / 86400 | floor ) as $age
			| ( {
				certname: $certname,
				hostname: $hostname,
				run_status: .status,
				environment: $environment,
				date: $date,
				age: $age,
				changes: 0
			} ),
			(
			select(.resource_events)
			| .resource_events
			| select(.data)
			| .data[]
			| del(.timestamp, .message, .corrective_change, .new_value, .old_value)
			| {
				certname: $certname,
				hostname: $hostname,
				environment: $environment,
				date: $date,
				age: $age,
				changes: 1
			} * .
			)
		)
		]' \
	| pv -N processed \
	> "${new_file}"

ln -sfnv "${new_file}" "${symlink}"
ln -sfnv "${new_file}" "${latest_symlink}"
ls -gG "${old_file}" "${new_file}" "${symlink}" "${latest_symlink}"
rm -fv "${old_file}"

tmpwatch --mtime $((45*24)) ./
