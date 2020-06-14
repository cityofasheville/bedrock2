#Setup Commands

EJ 6/14/2020 - These are the commands I ran to set up for development.

```
conda create --name conda-env python
conda activate conda-env
conda install boto3

conda install jinja2 pyyaml colorlog // production dependencies
conda install pytest pytest-cov coverage twine setuptools wheel // dev dependencies
pip install cement==3.0.2
pip install toposort
conda env export --name conda-env > conda-env.yml

python .\setup.py develop

# I'm working in powershell, so I ran this:
$env:bedrock_bucketname = 'managed-data-assets-dev'


```