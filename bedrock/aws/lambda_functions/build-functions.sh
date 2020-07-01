#!/bin/bash
for directory in ./*/
do
  echo ""
  echo "Building in $directory..."
  cd "$directory" || continue
  echo "Removing old dependencies..."
  rm -Rf ./package
  echo "Installing dependencies..."
  pip install -r requirements.txt --target ./package || ( echo "FAILED TO INSTALL DEPENDENCIES" && continue )
  echo "Packaging function as zip..."
  rm -f function.zip
  cd package
  zip -r9 ../function.zip .
  cd ..
  zip -g function.zip ./*.py
  cd ..
done