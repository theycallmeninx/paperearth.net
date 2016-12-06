from django.conf.urls import url
from django.conf.urls.static import static

from django.conf import settings

from . import views

app_name = 'maps'
urlpatterns = [
    url(r'^$', views.IndexView.as_view(), name='index'),   
    url(r'^start/$', views.InitMap, name='start'),
    url(r'^new/$', views.NewSign, name='newsign')
]