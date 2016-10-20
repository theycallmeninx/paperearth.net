from django.views import generic


class IndexView(generic.ListView):
    template_name = 'mysite/index.html'

    def get_queryset(self):
        return "Hello, World!!!"

