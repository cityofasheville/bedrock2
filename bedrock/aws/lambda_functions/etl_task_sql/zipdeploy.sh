
    echo "Packaging function as zip..."
    rm -f function.zip
    cd node_modules
    zip -r9q ../function.zip .
    cd ..
    zip -gq function.zip ./*.js
    echo "send it"
    terraform apply -auto-approve