#!/usr/bin/env bash

set -e

source ./discord_tools.sh

params=("$@")
len=${#params[@]}

	if [[ $((len % 2)) != 0 ]]
	then
		exit 1
	fi

data_row_num=2
data=()

check_option() {
	case $1
		in
		'-t') return 0;;
		'-f') return 0;;
		*) return 1;;
	esac
}

for (( idx=0 ; idx + 1 < len; idx+=2 ))
do
	option="${params[idx]}"
	check_option "$option"
	text="${params[idx + 1]}"
	valid_text "$text"
	data+=("$option")
	data+=("$text")
done

declare -A func
func['-t']='send_text'
func['-f']='send_file'

for (( idx=0 ; idx + 1 < len; idx+=2 ))
do
	action="${func[${data[idx]}]}"
	"$action" "${data[idx + 1]}"
done
