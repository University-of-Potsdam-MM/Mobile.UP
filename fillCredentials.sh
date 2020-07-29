#!/usr/bin/env bash

# Replaces strings in a dist file with environment variables. Then makes dist file the production file by removing the
# '.dist' from the filename.
# $1: path to dist file which should be prepared - file name must include '.dist' before the actual extension
# $2: list of environment variables to be replaced in dist file. Must be one single argument enclosed in a quote.

set -euo pipefail
warn() { echo "$0 Warn: " "$@"; }
die() { rc="$1"; shift; echo "$0 (exit $rc):" "$@"; exit "$rc"; }

[[ -z "$1" ]] && die 1 "Missing dist file name."
! [[ -f "$1" ]] && die 1 "Dist file does not exist."
[[ $1 != *".dist."* ]] && die 1 "Specified file name does not include the .dist extension."
[[ -z "$2" ]] && die 1 "Missing list of environment variables to replace."

distFile="$1"
targetFile="${distFile//.dist/}"

for envVarName in $2; do
  [[ -z "${!envVarName}" ]] && die 1 "\$$envVarName undefined."
  export envVarName
  export envVarValue="${!envVarName}"
  perl -pi -e 's:\[$ENV{envVarName}\]:$ENV{envVarValue}:g' "$distFile" || die 1 "Could not set \$$envVarName."
  echo "Set \$$envVarName successfully."
done

mv "$distFile" "$targetFile" || die 1 "Could not mv dist file '$distFile' to target file '$targetFile'."
echo "Moved target file '$targetFile' in place."