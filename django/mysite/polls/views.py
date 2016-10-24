
from django.shortcuts import get_object_or_404
from django.shortcuts import render

from django.http import HttpResponseRedirect

from django.views import generic

from django.urls import reverse

from django.utils import timezone

from .models import Question
from .models import Choice
from .forms import PollsForm

class QuestionCreate(generic.edit.CreateView):
    template_name = 'polls/new.html'
    model = Question
    fields = ['question_text']
    success_url = '/polls'

    def form_valid(self, form):
        form.submit_question()
        return super(QuestionCreate, self).form_valid(form)

class IndexView(generic.ListView):
    template_name = 'polls/index.html'
    context_object_name = 'latest_question_list'

    def get_queryset(self):
        """Return the last five published questions."""
        return Question.objects.filter(pub_date__lte=timezone.now()).order_by('-pub_date')[:5]


class DetailView(generic.DetailView):
    model = Question
    template_name = 'polls/detail.html'

    def get_queryset(self):
        """Excludes any questions that aren't published yet."""
        return Question.objects.filter(pub_date__lte=timezone.now())


class ResultsView(generic.DetailView):
    model = Question
    template_name = 'polls/results.html'

def vote(request, question_id): 
    question = get_object_or_404(Question, pk=question_id)
    try:
        cid = request.POST['choice']
        if cid == "new": #new entry
            selected_choice = question.choice_set.create(choice_text=request.POST['newchoicetext'], votes=0)
        else:
            selected_choice = question.choice_set.get(pk=cid)
    except (KeyError, Choice.DoesNotExist):
        # Redisplay the question voting form.
        return render(request, 'polls/detail.html', {
            'question': question,
            'error_message': "You didn't select a choice.",
        })
    else:
        selected_choice.votes += 1
        selected_choice.save()
        return HttpResponseRedirect(reverse('polls:results', args=(question.id,)))