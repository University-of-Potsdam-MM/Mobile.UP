#!/usr/bin/env bash
echo "Starting deployment"
echo "Target: gh-pages branch"

GIT_DEPLOY_REPO=${GIT_DEPLOY_REPO:-$(node -p -e "require('./package.json').repository.url")}

cd documentation && \

rm -R .git
git init && \


echo "Pushing new content to $ORIGIN_URL"
git config user.name "Travis CI" && \
git config user.email "github@travis-ci.org" && \

git add . && \
git commit -m "Deploy to GitHub Pages" && \

git push --force "https://${GH_TOKEN}@${GH_REF}" master:gh-pages > /dev/null 2>&1