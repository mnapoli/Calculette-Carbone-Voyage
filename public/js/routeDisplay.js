/**
 * @author Matthieu Napoli
 * 
 * This file is part of the program "Calculette Carbone Voyage"
 * 
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the Lesser GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  Lesser GNU General Public License for more details.
 *
 *  You should have received a copy of the Lesser GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Process and display the route
 * @param route
 * @param indexRoute
 * @return void
 */
function processAndDisplay(route, indexRoute)
{
    getRouteCoordinates(route, indexRoute);
    switch (route.type) {
        case enumRouteType.car:
        case enumRouteType.motorbike:
        case enumRouteType.walking:
        case enumRouteType.bike:
        case enumRouteType.bus:
        case enumRouteType.coach:
        case enumRouteType.train:
            processAndDisplayGMapDirections(route, indexRoute);
            break;
            
        case enumRouteType.plane:
            processAndDisplayAerialDistance(route, indexRoute);
            break;
            
        default:
            console.error("Unknown route type : "+route.type);
            return;
    }
}

/**
 * Get route point coordinates
 * @param route
 * @param indexRoute
 * @return void
 */
function getRouteCoordinates(route, indexRoute)
{
    // Geocoding for start
    geocoder.geocode({
        'address': route.start
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            route.startLatLng = {
                "lat": results[0].geometry.location.lat(),
                "lng": results[0].geometry.location.lng()
            };
            // Save
            saveRoutes();
            if (route.startLatLng != null && route.endLatLng != null) {
                // Update map viewport
                updateMapViewport();
            }
        } else {
            console.error("Geocoding was not successful: " + status);
        }
    });
    // Geocoding for end
    geocoder.geocode({
        'address': route.end
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            route.endLatLng = {
                    "lat": results[0].geometry.location.lat(),
                    "lng": results[0].geometry.location.lng()
            };
            // Save
            saveRoutes();
            if (route.startLatLng != null && route.endLatLng != null) {
                // Update map viewport
                updateMapViewport();
            }
        } else {
            console.error("Geocoding was not successful: " + status);
        }
    });
}

/**
 * Process and display the route using GMap Directions
 * @param route
 * @param indexRoute
 * @return void
 */
function processAndDisplayGMapDirections(route, indexRoute)
{
    var travelMode;
    switch (route.type) {
        case enumRouteType.car:
        case enumRouteType.motorbike:
        case enumRouteType.bus:
        case enumRouteType.coach:
        case enumRouteType.train:
        case enumRouteType.bike:
            travelMode = google.maps.DirectionsTravelMode.DRIVING;
            break;
        case enumRouteType.walking:
            travelMode = google.maps.DirectionsTravelMode.WALKING;
            break;
        default:
            console.error("Unknown route type : "+route.type);
            return;
    }
    var request = {
        origin: route.start, 
        destination: route.end,
        travelMode: travelMode,
        region: "fr"
    };
    // Clear old display
    if (routesDisplays[indexRoute] != null) {
        routesDisplays[indexRoute].setMap(null);
        routesDisplays[indexRoute] = null;
    }
    directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            routesDisplays[indexRoute] = new google.maps.DirectionsRenderer({
                polylineOptions: {
                    strokeColor: "#3311EE",
                    strokeOpacity: 0.6,
                    strokeWeight: 5
                },
                directions: response,
                map: map,
                suppressMarkers: true,
                suppressBicyclingLayer: true,
                preserveViewport: true
            });
            // Extract distances and infos
            var distance = response.routes[0].legs[0].distance.value;
            // Distance in km
            route.distance = distance / 1000.;
            // Calculate emissions
            route.emission = route.distance * enumEmission[route.type];
            // Display infos
            $("#distanceRoute"+indexRoute).html(route.distance.toFixed(0));
            $("#emissionRoute"+indexRoute).html((route.emission / 1000.).toFixed(2));
            // Save
            saveRoutes();
            // Update total
            updateTotal();
            // Update map viewport
            updateMapViewport();
        } else {
            deleteRoute(indexRoute);
            messageBox("Le trajet demandé ne peut être résolu.", "Erreur", MSGBOX_ERROR);
        }
    });
}

/**
 * Process and display the route using aerial distance
 * @param route
 * @param indexRoute
 * @return void
 */
function processAndDisplayAerialDistance(route, indexRoute)
{
    // Coordinates have been found, update distance and emission and display
    update = function(route, indexRoute) {
        var distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(route.startLatLng.lat, route.startLatLng.lng),
            new google.maps.LatLng(route.endLatLng.lat, route.endLatLng.lng)
        );
        // Distance in km
        route.distance = distance / 1000.;
        // Calculate emissions
        route.emission = route.distance * enumEmission[route.type];
        // Display infos
        $("#distanceRoute"+indexRoute).html(route.distance.toFixed(0));
        $("#emissionRoute"+indexRoute).html((route.emission / 1000.).toFixed(2));
        // Clear old display
        if (routesDisplays[indexRoute] != null) {
            routesDisplays[indexRoute].setMap(null);
            routesDisplays[indexRoute] = null;
        }
        // Display
        var path = [
            new google.maps.LatLng(route.startLatLng.lat, route.startLatLng.lng),
            new google.maps.LatLng(route.endLatLng.lat, route.endLatLng.lng)
        ];
        routesDisplays[indexRoute] = new google.maps.Polyline({
            path: path,
            strokeColor: "#3311EE",
            strokeOpacity: 0.6,
            strokeWeight: 5
        });
        routesDisplays[indexRoute].setMap(map);
        // Save
        saveRoutes();
        // Update total
        updateTotal();
        // Update map viewport
        updateMapViewport();
    };
    // Geocoding for start
    geocoder.geocode({
        'address': route.start
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            route.startLatLng = {
                "lat": results[0].geometry.location.lat(),
                "lng": results[0].geometry.location.lng()
            };
            if (route.startLatLng != null && route.endLatLng != null) {
                update(route, indexRoute);
            }
        } else {
            console.error("Geocoding was not successful: " + status);
        }
    });
    // Geocoding for end
    geocoder.geocode({
        'address': route.end
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            route.endLatLng = {
                    "lat": results[0].geometry.location.lat(),
                    "lng": results[0].geometry.location.lng()
            };
            if (route.startLatLng != null && route.endLatLng != null) {
                update(route, indexRoute);
            }
        } else {
            console.error("Geocoding was not successful: " + status);
        }
    });
}

/**
 * Update total emission
 * @return void
 */
function updateTotal()
{
    var totalEmissions = 0.;
    for (i in routes) {
        r = routes[i];
        totalEmissions += r.emission;
    }
    totalEmissions = totalEmissions / 1000.;
    $("#totalEmission").html(totalEmissions.toFixed(2)+" kg équivalent CO&#8322;");
}

/**
 * Update the list of routes
 * @return void
 */
function updateDisplay() {
    // Route list
    $("#routeList").empty();
    for (i in routes) {
        route = routes[i];
        // Delete link
        var deleteLink = ' <button class="routeButton" onclick="deleteRoute('+i+')">Supprimer</button>';
        // Distance field
        var distanceField = ' <p class="distance">Distance : <span id="distanceRoute'+i+'">'
            +route.distance.toFixed(0)
            +'</span> km - Émissions : <span id="emissionRoute'+i+'">'
            +(route.emission / 1000.).toFixed(2)
            +'</span> kg eq. CO&#8322;</p>';
        // Route type
        var routeType = ' <select id="updateTypeRoute'+i+'" class="updateTypeRoute" onchange="changeRoute('+i+')">'
            +'<option value="car"'+((route.type=='car')?' selected="selected"':'')+'>Voiture</option>'
            +'<option value="motorbike"'+((route.type=='motorbike')?' selected="selected"':'')+'>Moto</option>'
            +'<option value="plane"'+((route.type=='plane')?' selected="selected"':'')+'>Avion</option>'
            +'<option value="train"'+((route.type=='train')?' selected="selected"':'')+'>Train</option>'
            +'<option value="coach"'+((route.type=='coach')?' selected="selected"':'')+'>Autocar</option>'
            +'<option value="bus"'+((route.type=='bus')?' selected="selected"':'')+'>Bus</option>'
            +'<option value="bike"'+((route.type=='bike')?' selected="selected"':'')+'>Vélo</option>'
            +'<option value="walking"'+((route.type=='walking')?' selected="selected"':'')+'>Marche à pied</option>'
            +'</select> ';
        // Set html
        $("#routeList").append("<li class=\"route\"><strong>"+route.start+" - "+route.end+"</strong>"
            +deleteLink+routeType+distanceField+"</li>");
        // Enable button
        $(".routeButton").button({
            icons: { primary: "ui-icon-trash", text: false }
        });
    }
}


/**
 * Update the map viewport
 */
function updateMapViewport() {
    // Adjust map center and zoom
    var defaultCenter = new google.maps.LatLng(46.225453, 2.416992);
    var defaultZoom = 5;
    var mapBounds = null;
    if (routes.length > 0) {
        mapBounds = new google.maps.LatLngBounds();
        var nbPoints = 0;
    }
    for (i in routes) {
        route = routes[i];
        // Map center and zoom
        if (route.startLatLng != null && route.endLatLng != null) {
            mapBounds.extend(new google.maps.LatLng(
                route.startLatLng.lat,
                route.startLatLng.lng
            ));
            nbPoints++;
            mapBounds.extend(new google.maps.LatLng(
                route.endLatLng.lat,
                route.endLatLng.lng
            ));
            nbPoints++;
        }
    }
    // Update map center and zoom
    if (mapBounds != null && nbPoints >= 2) {
        map.fitBounds(mapBounds);
    } else {
        map.setCenter(new google.maps.LatLng(46.225453, 2.416992));
        map.setZoom(5);
    }
}
