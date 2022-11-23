# Python
if [ -f "./requirements.txt" ] || [ -f "./handler.py" ] ; then
  echo "Removing old dependencies..."
  rm -Rf ./package
  rm -f function.zip
  if [ -f "./requirements.txt" ] ; then
    echo "Installing dependencies..."
    pip install -r requirements.txt --target ./package || ( echo "FAILED TO INSTALL DEPENDENCIES" && continue )
    echo "Packaging function as zip..."
    cd package
    zip -r9 ../function.zip .
    cd ..
    zip -g function.zip ./*.py
  else
    echo "Packaging python files as zip..."
    zip -r9 ./function.zip ./*.py
  fi
fi
