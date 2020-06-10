
from setuptools import setup, find_packages
from bedrock.core.version import get_version

VERSION = get_version()

f = open('README.md', 'r')
LONG_DESCRIPTION = f.read()
f.close()

setup(
    name='bedrock',
    version=VERSION,
    description='MyApp Does Amazing Things!',
    long_description=LONG_DESCRIPTION,
    long_description_content_type='text/markdown',
    author='City of Asheville',
    author_email='ejackson@ashevillenc.gov',
    url='https://github.com/johndoe/myapp/',
    license='GPLV4',
    packages=find_packages(exclude=['ez_setup', 'tests*']),
    package_data={'bedrock': ['templates/*']},
    include_package_data=True,
    entry_points="""
        [console_scripts]
        bedrock = bedrock.main:main
    """,
)
