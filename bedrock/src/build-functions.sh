#!/bin/bash
for directory in ./*/
do
  echo ""
  echo "Building in $directory..."
  cd "$directory" || continue
  echo "Removing old dependencies..."
  rm -Rf ./package
  echo "Installing dependencies..."
  pip install --target ./package
  echo "Packaging function as zip..."
  rm -f function.zip
  zip function.zip ./*
  cd ..
done

