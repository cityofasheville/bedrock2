#!/bin/bash
for directory in ./*/
do
  echo "Building in $directory..."
  cd "$directory"
  echo "Removing old dependencies..."
  rm -Rf ./package
  echo "Installing dependencies..."
  pip install --target ./package
  echo "Packaging function as zip..."
  zip function.zip ./*
  cd ..
done

