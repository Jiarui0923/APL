from setuptools import setup, find_packages
import os


LONG_DESCRIPTION = '''
To accommodate non-coding users and simplify the utilization of APL computations,
we have developed a web application supported by the DRAF and DST frameworks, built on Django.
This application incorporates all functionalities of DRAF and DST,
offering various operational modes tailored for both novice and experienced users.
The web application consists of five primary views: Dashboard View,
Project View, Tool View, Quick Start View, and Resource Management View.
Each computation algorithm or chained algorithm is represented as a tool,
while each computation case is managed as a project. 
Users can manage tools and projects centrally through the dashboard view.

If there is any issue, please put up with an issue or contact Jiarui Li (jli78@tulane.edu)
'''
VERSION = '0.0.5'
NAME = 'APL'


install_requires = [
    "django",
    "mongita",
    "docflow",
    "gpucorex",
    "easyapi",
    "caltable",
    "caltable-bio",
    "easyapi-ncbiblast",
    "easyapi-aplsuite",
]


setup(
    name=NAME,
    description="Standalone APL Suite Web Application.",
    long_description=LONG_DESCRIPTION,
    long_description_content_type="text/markdown",
    version=VERSION,
    packages=find_packages(),
    install_requires=install_requires,
    url="https://git.tulane.edu/apl/aplproject/apl-suites-standalone",
    author='Jiarui Li, Marco K. Carbullido, Jai Bansal, Samuel J. Landry, Ramgopal R. Mettu',
    author_email=('jli78@tulane.edu'),
    maintainer=("Jiarui Li"),
    maintainer_email="jli78@tulane.edu",
    classifiers=[
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "Operating System :: MacOS :: MacOS X",
        "Operating System :: Microsoft :: Windows",
        "Operating System :: POSIX",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Build Tools",
    ],
    zip_safe=True,
    platforms=["any"],
    entry_points={
        'console_scripts': [
            'apl=apl.__main__:main',  # Define the command and target function
        ],
    },
    include_package_data=True, 
)
