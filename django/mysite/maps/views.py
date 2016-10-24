from django.views import generic

class IndexView(generic.ListView):
    template_name = 'maps/index.html'
    context_object_name = 'maps_list'

    def get_queryset(self):
        """Return the last five published questions."""
        return []