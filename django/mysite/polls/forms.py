from django import forms

class PollsForm(forms.Form):
	question = forms.CharField()
	choices = [forms.CharField()]

	def add_choice(self):
		choices.append(forms.CharField)

	def submit_question(self):
		print self.cleaned_data