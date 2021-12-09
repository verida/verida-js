# To use this you will need to set an named AWS profile.
# Docs are at https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html
#
# Something like this works 
#   export AWS_PROFILE=verida-prod
#

if [[ -z "$AWS_PROFILE" ]]; then
    echo "You need to set AWS_PROFILE to use this script" 1>&2
    exit 1
fi



# make sure the docs are up to date
rm -rf api-docs
yarn generate-api-docs

# This copys from the build target directory to S3
aws s3 sync api-docs s3://apidocs.verida.io --delete

# And now we invalidate the cached cloudfront distribution so changes are available
aws cloudfront create-invalidation --distribution-id E1L1Y2VRSXQCBR  --paths "/*"