#!/bin/bash
for directory in ./*/
do
  echo ""
  echo "Deploying in $directory..."
  cd "$directory" || continue
  if [ -f "./config.tf" ] ; then
    echo "Run terraform apply..."
    terraform apply -var-file=ca.tfvars
  fi

  cd ..
done