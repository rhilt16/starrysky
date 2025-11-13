# skyfield_service.py
from flask import Flask, jsonify, request
from skyfield.api import Star, load, wgs84, N, E, W, S
from skyfield.data import hipparcos
from skyfield.magnitudelib import planetary_magnitude
from math import sin, cos, radians, degrees

app = Flask(__name__)

class CelestialBody:
    def __init__(self, name, magnitude, position):
        self.name = name
        self.magnitude = magnitude
        self.position = position

celestial_bodies = []



with load.open("hip_main.dat") as f:
    df = hipparcos.load_dataframe(f)
print(f"Loaded {len(df)} stars from Hipparcos catalog.")

df = df[df['ra_degrees'].notnull()]
print(df.keys())
print(df.head())
print(f"Stars brighter than a magnitude of 10.0: {len(df[df['magnitude'] <= 10.0])}")

# Load ephemeris once → much faster
ts = load.timescale()
planets = load('de405.bsp')
sun = planets['sun']
earth = planets['earth']


targets = {
    "mercury": planets["mercury"],
    "venus": planets["venus"],
    "mars": planets["mars"],
    "jupiter": planets["jupiter barycenter"],
    "saturn": planets["saturn barycenter"],
    "uranus": planets["uranus barycenter"],
    "neptune": planets["neptune barycenter"]
}

@app.get("/sky")
def get_sky(min_magnitude: float = 6.0, time: str = None, loc_N: float = -33.8688, loc_W: float = 151.2093, loc_elev: float = 43):
    if(request.args.get('time')):
        time = request.args.get('time')
    if(request.args.get('min_magnitude')):
        min_magnitude = float(request.args.get('min_magnitude'))
    if(request.args.get('loc_N')):
        loc_N = float(request.args.get('loc_N'))
    if(request.args.get('loc_W')):
        loc_W = float(request.args.get('loc_W'))
    if(request.args.get('loc_elev')):
        loc_elev = float(request.args.get('loc_elev'))
    
    t=ts.now()

    observer = earth + wgs84.latlon(loc_N * N, loc_W * W, elevation_m=loc_elev)  # Example: Sydney, Australia
    stars_df = df[df['magnitude'] <= min_magnitude]

    # Iterate through stars and compute positions
    count = 0
    for hip_id, star_data in stars_df.iterrows():
        star = Star(ra_hours=star_data['ra_degrees'] / 15.0,
                    dec_degrees=star_data['dec_degrees'])
        
        
        astrometric = observer.at(t).observe(star)
        alt, az, distance = astrometric.apparent().altaz()
        if(alt.degrees < 0):
            continue  # Skip bodies below the horizon
        #print(f"alt: {alt}, az: {az}, distance: {distance} \n")
        count += 1
        newBody = CelestialBody(
            name=f"HIP {hip_id}",
            magnitude=star_data['magnitude'],
            position={"alt": alt.degrees, "az": az.degrees, "distance_au": distance.au}
        )
        if(newBody not in celestial_bodies):
            celestial_bodies.append(newBody)

    for name, body in targets.items():
        # Calculate magnitude as seen from Earth
        astrometric = observer.at(t).observe(body)
        # Compute the magnitude
        magnitude = float(planetary_magnitude(astrometric))
        alt, az, distance = astrometric.apparent().altaz()
        #print(f"alt: {alt}, az: {az}, distance: {distance} \n")
        if(alt.degrees < 0):
            continue  # Skip bodies below the horizon
        newBody = CelestialBody(
            name=name.capitalize(),
            magnitude=magnitude,
            position={"alt": alt.degrees, "az": az.degrees, "distance_au": distance.au}
        )
        if(newBody not in celestial_bodies):
            celestial_bodies.append(newBody)
        count += 1

    return jsonify({"count": count, "message": "This endpoint is under construction.", "names": [body.name for body in celestial_bodies], "bodies": [{"name": body.name, "magnitude": body.magnitude, "position": body.position} for body in celestial_bodies]})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001)
