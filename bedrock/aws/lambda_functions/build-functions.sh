#!/bin/bash
for directory in ./*/
do
  echo ""
  echo "Building in $directory..."
  cd "$directory" || continue
  if [ -f "./requirements.txt" ]; then
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
  fi
  if [ -f "./package.json" ]; then
    echo "Removing old dependencies..."
    rm -Rf ./node_modules
    echo "Installing dependencies..."
    npm install || ( echo "FAILED TO INSTALL DEPENDENCIES" && continue )
    echo "Packaging function as zip..."
    rm -f function.zip
    cd node_modules
    zip -r9 ../function.zip .
    cd ..
    zip -g function.zip ./*.js
  fi

  cd ..
done