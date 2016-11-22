from django.views import generic, View
from django.shortcuts import render
from django.http import JsonResponse

from .models import StreetBlockCoords
from .models import StreetBlock

from decimal import *

class IndexView(View):

    def dispatch(self, request):
        return render(request, 'maps/index.html', {})


def test(request):
    response = {}
    north = Decimal(request.POST['north'])
    south = Decimal(request.POST['south'])
    east = Decimal(request.POST['east'])
    west = Decimal(request.POST['west'])

    streets = StreetBlockCoords.objects.filter(
                latgps__lte=north
            ).filter(
                latgps__gte=south
            ).filter(
                longps__lte=east
            ).filter(
                longps__gte=west
            )
    for street in streets:
        if street.sb.pk not in response.keys():
            response[street.sb.pk] = {}
        response[street.sb.pk][street.order]={'lat':street.latgps, 'lng':street.longps}



    return JsonResponse(response)
