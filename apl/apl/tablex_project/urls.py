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
from .views import project, del_project
from .views import table, add_row, add_col, del_row, dup_row
from .views import project_infomation
from .views import workflow
from .views import history, del_history
from .views import upload_file, upload_table
from .views import all_workflows, add_workflow, del_workflow
from .views import download_data, download_report
from .views import get_resources, add_resources, del_resources

urlpatterns = [
    path("projects/<project_id>/", project),
    path("projects/<project_id>/table/", table),
    path("projects/<project_id>/table/row/add/", add_row),
    path("projects/<project_id>/table/row/del/", del_row),
    path("projects/<project_id>/table/row/dup/", dup_row),
    path("projects/<project_id>/table/col/add/", add_col),
    path("projects/<project_id>/info/", project_infomation),
    path("projects/<project_id>/workflow/", workflow),
    path("projects/<project_id>/history/", history),
    path("projects/<project_id>/history/<history_id>/del/", del_history),
    path("projects/<project_id>/upload/files/", upload_file),
    path("projects/<project_id>/upload/table/", upload_table),
    path("projects/<project_id>/workflow/all/", all_workflows),
    path("projects/<project_id>/workflow/add/", add_workflow),
    path("projects/<project_id>/workflow/del/", del_workflow),
    path("projects/<project_id>/del/", del_project),
    path("projects/<project_id>/download/report/", download_report),
    path("projects/<project_id>/download/data/", download_data),
    path("projects/<project_id>/resources/", get_resources),
    path("projects/<project_id>/resources/add/", add_resources),
    path("projects/<project_id>/resources/del/", del_resources),
]
