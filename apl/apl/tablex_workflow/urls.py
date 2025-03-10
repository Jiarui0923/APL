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
from .views import workflow, quickstart
from .views import workflow_info, toolkits_list
from .views import tool
from .views import blocks, add_block, insert_block, del_block, update_block
from .views import create_project_by_workflow
from .views import del_workflow
from .views import share_workflow


urlpatterns = [
    path("workflows/<workflow_id>/", workflow, name="workflow-edit"),
    path("workflows/<workflow_id>/info/", workflow_info),
    path("workflows/<workflow_id>/toolkits/", toolkits_list),
    path("workflows/<workflow_id>/tools/<tool_name>/", tool),
    path("workflows/<workflow_id>/blocks/", blocks),
    path("workflows/<workflow_id>/blocks/add/", add_block),
    path("workflows/<workflow_id>/blocks/insert/", insert_block),
    path("workflows/<workflow_id>/blocks/del/", del_block),
    path("workflows/<workflow_id>/blocks/update/", update_block),
    path("workflows/<workflow_id>/start/", quickstart),
    path("workflows/<workflow_id>/start/create/", create_project_by_workflow),
    path("workflows/<workflow_id>/del/", del_workflow),
    path("workflows/<workflow_id>/share/", share_workflow),
]
