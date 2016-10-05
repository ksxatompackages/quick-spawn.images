echo 'Building...'
source ./sh/init-env.sh || exit 1
node $(pwd)/build || exit 2
echo 'Done'
