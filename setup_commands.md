#Setup Commands

```
conda create --name conda-env python
conda activate conda-env
conda install boto3

conda install jinja2 pyyaml colorlog // production dependencies
conda install pytest pytest-cov coverage twine setuptools wheel // dev dependencies
pip install cement==3.0.2
conda env export --name conda-env > conda-env.yml
