npx lerna run build
# Tag next=upcoming version, latest=current latest version
npx lerna publish --dist-tag next
# If publishing `latest` from `main` branch, need to merge changes back into `develop` branch