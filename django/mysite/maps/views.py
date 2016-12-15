from django.views import generic, View
from django.shortcuts import render
from django.http import JsonResponse
from django.db.models import Count


from .models import MapCoordinates
from .models import StreetBlock
from .models import Zone
from .models import Sign
from .models import Photo

from decimal import *

import datetime
import requests
import time
import math



"""
todo:
1) based on location, determine address (based on input? or based on the center of the map? Dropped pin?)
2) determine street block from address 
3) 

SM:
1) Adjust map page bar to reflect 24-hour timeframe, complete with color-codings.
- No long going to use range slider bar. 
- Selecting bar will focus map & display sign details. 
"""

CENSUSURL = "https://geocoding.geo.census.gov/geocoder/locations/address"
GOOGLEURL = "http://maps.google.com/maps/api/geocode/json"

CENSUSDATA = {'street':'',
            'city':'',
            'state':'',
            'benchmark':9,
            'format':'json'}

class MapsResponse:
    def __init__(self):
        self.signs = {} #this is what I ultimately need.

    def addSign(self, sign, sc, zc):
        coords = sc
        imgpath = sign.photo.image.url
        tempdict = {'i': imgpath,
                    'r': sign.restriction,
                    'c': coords.as_set(),
                    't': sign.times_asjson(),
                    'z': sign.zone.json()
                    }
        tempdict['z'][sign.zone_id]['c'] = self.formatZoneCoordinates(zc)
        self.signs[sign.id] = tempdict



    def formatZoneCoordinates(self, zc):
        tempdict = {}
        coords = list(zc)
        dlength = len(coords)*2-1
        for i in range(len(coords)):
            c = coords[i].as_set()
            
            if i == len(coords)-1:
                tempcoords = {'lat': (c['lat']+(c['lat']-coords[i-1].lat)),
                              'lng': (c['lng']+(c['lng']-coords[i-1].lng))
                              }
            else:
                tempcoords = coords[i+1].as_set()
            tempdict[i] = c
            tempdict[dlength-i] = self.calculateNormal(c, tempcoords)
        return tempdict

    def calculateNormal(self, c1, c2):
        getcontext().prec = 9
        dy = Decimal(c2['lng']) - Decimal(c1['lng'])
        dx = Decimal(c2['lat']) - Decimal(c1['lat'])
        magnitude = math.sqrt((dx*dx) + (dy*dy))
        scalar = Decimal(magnitude / 0.000150)
        return {'lat': c1['lat']+(dy/scalar), 'lng': c1['lng']-(dx/scalar)}

    def as_dict(self):
        getcontext().prec = 9
        return self.signs



class IndexView(View):

    def dispatch(self, request):
        return render(request, 'maps/index.html', {})


def generateMapCoordinates(north, south, east, west):
    return MapCoordinates.objects.filter(
                lat__lte=north
            ).filter(
                lat__gte=south
            ).filter(
                lng__lte=east
            ).filter(
                lng__gte=west
            )

def FindBlock(request):
    response = {}
    
    values = CENSUSDATA
    values['state'] = request.POST['state']
    values['city'] = request.POST['city']
    values['street'] = request.POST['number'] + " " + request.POST['name']

    req = requests.get(CENSUSURL, params=values)
    matches = req.json()['result']['addressMatches']

    if matches:
        fromaddress = matches[0]['addressComponents']['fromAddress']
        toaddress = matches[0]['addressComponents']['toAddress']
        tigerline = matches[0]['tigerLine']

        streets = StreetBlock.objects.filter(
                tigerlineid=tigerline['tigerLineId']
            ).filter(
                side=tigerline['side'])

        if streets:
            coords = MapCoordinates.objects.filter(block_id=streets[0].id)
            print "Strets", streets[0].id
            if coords:
                response['coordinates'] = list(coords)
                return JsonResponse(response)

        response['address'] = {'from': fromaddress, 'to':toaddress, 'side': tigerline['side']} #if no match

    return JsonResponse(response)


def NewSign(request):
    """ Generates a new sign json object to be queued for processing. 
    """
    print request.POST['location']
    
    response = {'success': True, 'message': "default success message"}

    return JsonResponse(response)

def InitMap(request):
    response = MapsResponse()
    getcontext().prec = 9
    date = float(request.POST['date'][:-3])
    hour = time.strftime("%H%M", time.localtime(date))
    days = [time.strftime("%A", time.localtime(date)),
            time.strftime("%A", time.localtime(date+86400))] #24 hours
    
    north = Decimal(request.POST['north'])
    south = Decimal(request.POST['south'])
    east = Decimal(request.POST['east'])
    west = Decimal(request.POST['west'])

    signs = Sign.objects.filter(
                pos__lat__lte=north
            ).filter(
                pos__lat__gte=south
            ).filter(
                pos__lng__lte=east
            ).filter(
                pos__lng__gte=west
            )

    # mapsqueryset = generateMapCoordinates(north, south, east, west)

    # signset = mapsqueryset.exclude(sign_id=None)
    # signids = [c['sign_id'] for c in signset.values('sign_id').annotate(n=Count("pk"))]
    # signs = Sign.objects.filter(id__in=signids)

    for sign in signs:
        if sign.applies(days, hour):
            zc = MapCoordinates.objects.filter(zone_id=sign.zone_id)
            response.addSign(sign, sign.pos, zc)

    # print response.as_dict()
    return JsonResponse(response.as_dict())
