conda create -n bedrock 
conda activate bedrock
pip install -r scripts/process_asset_dependencies/requirements.txt


pip install toposort (or conda install -c conda-forge toposort?)
conda env export --name bedrock > bedrock-conda-env.yml
conda env create --file bedrock-conda-env.yml

conda install --yes --file requirements.txt

conda info --envs
conda activate (changes back to base env)

UNDO:
conda list --revisions
conda install --rev 1

conda env export > <environment-name>.yml
conda env create -f <environment-name>.yml

conda list --explicit > requirements.txt
conda create --name NEWENV --file requirements.txt

pip install -r scripts/process_asset_dependencies/requirements.txt