"""
URL configuration for tablex project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path
from .views import index
from .views import private_projects
from .views import create_project
from .views import copy_project
from .views import private_workflows
from .views import create_workflow
from .views import private_resources
from .views import create_resource
from .views import public_workflows
from .views import accept_share_workflow

urlpatterns = [
    path("", index, name='index'),
    path("projects/", private_projects, name='projects'),
    path("projects/create", create_project, name='create-projects'),
    path("projects/<project_id>/copy", copy_project, name='copy-projects'),
    path("workflows/", private_workflows, name='workflows'),
    path("workflows/create", create_workflow, name='create-workflows'),
    path("resources/", private_resources, name='resources'),
    path("resources/create", create_resource, name='create-resources'),
    path("market/workflows/", public_workflows, name="public-workflows"),
    path("market/workflows/<workflow_id>/add/", accept_share_workflow, name="add-public-workflows")
]
