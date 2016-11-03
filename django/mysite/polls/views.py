
from django.shortcuts import get_object_or_404
from django.shortcuts import render

from django.http import HttpResponseRedirect

from django.views import generic

from django.urls import reverse

from django.utils import timezone

from .models import Question
from .models import Choice
from .forms import PollsForm



class IndexView(generic.ListView):
    template_name = 'polls/index.html'
    context_object_name = 'indexset'

    def get_queryset(self):
        """Return the last five published questions."""
        queryset = {'latest_questions': Question.objects.filter(pub_date__lte=timezone.now()).order_by('-pub_date')[:5],
                    'highest_questions': Question.objects.filter().order_by('-tally')[:5]}
        return queryset;


class DetailView(generic.DetailView):
    model = Question
    template_name = 'polls/detail.html'

    def get_queryset(self):
        """Excludes any questions that aren't published yet."""
        return Question.objects.filter(pub_date__lte=timezone.now())


class ResultsView(generic.DetailView):
    model = Question
    template_name = 'polls/results.html'

class CreateQuestionView(generic.DetailView):
    model = Question
    template_name = 'polls/new.html'

    def get_object(self):
        return None

def new(request):

    newpoll = request.POST['NewPoll']
    choices = request.POST.getlist('Choices')
    
    if newpoll and choices:
        question = Question(question_text=newpoll, pub_date=timezone.now())
        question.save()
        for choice in choices:
            newchoice = question.choice_set.create(choice_text=choice, votes=0)
            newchoice.save()

    return HttpResponseRedirect(reverse('polls:detail', args=(question.id,)))
    # return HttpResponseRedirect(reverse('polls:index'))

def vote(request, question_id): 
    question = get_object_or_404(Question, pk=question_id)
    try:
        cid = request.POST['choice']
        if cid == "new": #new entry
            #todo - detect if new choice is already a choice
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
        question.tally += 1
        question.save()
        selected_choice.votes += 1
        selected_choice.save()
        return HttpResponseRedirect(reverse('polls:results', args=(question.id,)))