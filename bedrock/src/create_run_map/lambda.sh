#!/bin/bash
echo `pwd`
rm -Rf ./package
pip install --target ./package toposort
cd package/
zip -r9 ../function.zip .
cd ..
zip -g function.zip create_run_map.py


