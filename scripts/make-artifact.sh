#!/bin/sh
# The repo's index.html is a standalone document, which is what GitHub Pages
# serves. Claude Artifacts supply their own <head> skeleton, so republishing
# there needs the wrapper stripped. This writes that variant to build/.
set -e
cd "$(dirname "$0")/.."
mkdir -p build/js
sed -e '1,3d' -e 's#^</head>$##' -e 's#^<body>$##' -e 's#^</body>$##' -e 's#^</html>$##' \
  index.html > build/index.html
cp styles.css build/
cp js/*.js build/js/
echo "wrote build/ — publish build/index.html as the artifact"
