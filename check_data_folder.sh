#!/bin/bash
DIR="~/local_data"

if [ ! -d "$DIR" ]; then
    echo "The data folder is not existing, then make it ... \n"
    mkdir ~/local_data
    echo "Done"
else
    echo "The data folder is existing in ${DIR} \N "
fi

echo "Publish the data folder ..."
chmod 777 ~/local_data