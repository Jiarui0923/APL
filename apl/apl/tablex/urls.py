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
from django.contrib import admin
from django.contrib.auth.views import LoginView, LogoutView
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.shortcuts import redirect
from django.urls import path
from django.urls import include

def guested_login(request):
    try:
        user = User.objects.get(username="guest") 
    except:
        user = User.objects.create_user("guest")
    login(request, user)
    return redirect("projects")

urlpatterns = [
    path("admin/", admin.site.urls),
    # path('login/', auth_views.LoginView.as_view(template_name='auth/login.html'), name='login'),
    # path('logout/', LogoutView.as_view(next_page='index'), name='logout'),
    path('login/', guested_login, name='login'),
    path("", include('tablex_dashboard.urls')),
    path("", include('tablex_project.urls')),
    path("", include('tablex_workflow.urls')),
    path("", include('tablex_resources.urls')),
]
