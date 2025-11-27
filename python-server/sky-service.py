# skyfield_service.py
from flask import Flask, jsonify, request, make_response
from skyfield.api import Star, load, wgs84, N, E, W, S
from skyfield.data import hipparcos
from skyfield.magnitudelib import planetary_magnitude
from flask_cors import CORS
from open_data import load_datasets

app = Flask(__name__)
CORS(app)

class CelestialBody:
    def __init__(self, name, magnitude, position):
        self.name = name
        self.magnitude = magnitude
        self.position = position

celestial_bodies = []
displayed_objects = []
old_magnitude = 0.0
ts = load.timescale()

# Load data into global variables 
df, planets, star_names_df, id_to_names, targets, earth, observer, id_to_common_name = load_datasets()

# API Routes
@app.get("/sky")
def get_sky(min_magnitude: float = 3.0, time: str = None, loc_N: float = -33.8688, loc_W: float = 151.2093, loc_elev: float = 43):
    global celestial_bodies
    global observer
    global old_magnitude
    
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
    stars_df = stars_df.sort_values(by='magnitude')

    # Iterate through stars and compute positions
    count = 0
    added_count = 0
    old_magnitude = min_magnitude
  
    for hip_id, star_data in stars_df.iterrows():
        star = Star(ra_hours=star_data['ra_degrees'] / 15.0,
                    dec_degrees=star_data['dec_degrees'])
        name = f"HIP {hip_id}"
        
        astrometric = observer.at(t).observe(star)
        alt, az, distance = astrometric.apparent().altaz()
        if(alt.degrees < 0):
            if(any(body.name == name.capitalize() for body in celestial_bodies)):
                celestial_bodies = [body for body in celestial_bodies if body.name != name]
            continue  # Skip bodies below the horizon

        count += 1
        if(celestial_bodies):
            if(any(body.name == name for body in celestial_bodies)):
                continue  # Skip if already in the list
        
        newBody = CelestialBody(
            name=f"HIP {hip_id}",
            magnitude=star_data['magnitude'],
            position={"alt": alt.degrees, "az": az.degrees, "distance_au": distance.au}
        )       
        celestial_bodies.append(newBody)
        added_count += 1

    for name, body in targets.items():
        # Calculate magnitude as seen from Earth
        astrometric = observer.at(t).observe(body)
        # Compute the magnitude
        magnitude = float(planetary_magnitude(astrometric))
        alt, az, distance = astrometric.apparent().altaz()
        #print(f"alt: {alt}, az: {az}, distance: {distance} \n")
        if(alt.degrees < 0):
            if(any(body.name == name for body in celestial_bodies)):
                celestial_bodies = [body for body in celestial_bodies if body.name != name]
            continue  # Skip bodies below the horizon

        count += 1
        if(celestial_bodies):
            if(any(body.name == name.capitalize() for body in celestial_bodies)):
                continue  # Skip if already in the list

        newBody = CelestialBody(
            name=name.capitalize(),
            magnitude=magnitude,
            position={"alt": alt.degrees, "az": az.degrees, "distance_au": distance.au}
        )
        if(newBody not in celestial_bodies):
            celestial_bodies.append(newBody)
        
        added_count += 1

    celestial_bodies.sort(key=lambda body: body.magnitude)
    data = {
        "count": count,
        "added_count": added_count
    }
    return send_res(200, data, "Sky ayo")
    

@app.get("/count")
def get_stars_count(min_magnitude: float = 6.0, time: str = None, loc_N: float = -33.8688, loc_W: float = 151.2093, loc_elev: float = 43):
    if(request.args.get('time')):
        time = request.args.get('time')
    if(request.args.get('min_magnitude')):
        min_magnitude = float(request.args.get('min_magnitude'))
    
    stars_df = df[df['magnitude'] <= min_magnitude]
    count = len(stars_df)

    data = {
        "count": count
    }
    return send_res(200, data, "Star count returned")
    

@app.get("/celestial-bodies")
def get_celestial_bodies():
    global celestial_bodies
    data_names = []
    data_bodies = []
    for body in celestial_bodies:
        name = body.name
        constellation = "none"
        if body.name.strip("HIP ") in id_to_common_name:
            name = id_to_common_name[body.name.strip("HIP ")][0]
            constellation = id_to_common_name[body.name.strip("HIP ")][1]
        data_names.append(name)
        if body.name.strip("HIP ") in id_to_names:
            data_bodies.append({"name": name, "cata_names": id_to_names[body.name.strip("HIP ")], "ID": body.name, "magnitude": body.magnitude, "constellation": constellation,  "position": body.position})
        else: 
            data_bodies.append({"name": name, "cata_names": 'none', "ID": body.name, "magnitude": body.magnitude, "constellation": constellation, "position": body.position})
        
    
    data = {
        "names": data_names,
        "bodies": data_bodies
    }
    return send_res(200, data, "Celestial bodies data returned")
    

# Greater Magnitude Threshold (Fainter Objects)
@app.get("/zoom-out")
def zoom_out(new_magnitude: float=0.0):
    global celestial_bodies
    global observer
    global old_magnitude


    if(request.args.get('new_magnitude')):
        new_magnitude = float(request.args.get('new_magnitude'))
    else:
        response = make_response(jsonify({"message": "new_magnitude parameter is required."}), 400)
        return response
    

    print(old_magnitude)
    print(new_magnitude)
    if(old_magnitude >= new_magnitude):
        response = make_response(jsonify({"message": "new_magnitude must be greater than old_magnitude."}), 400)
        return response
    
    t=ts.now()
    stars_df = df[(df['magnitude'] <= new_magnitude) & (df['magnitude'] > old_magnitude)]
    stars_df = stars_df.sort_values(by='magnitude')
    old_magnitude = new_magnitude

     # Iterate through stars and compute positions
    count = celestial_bodies.__len__()
    added_count = 0
  
    for hip_id, star_data in stars_df.iterrows():
        star = Star(ra_hours=star_data['ra_degrees'] / 15.0,
                    dec_degrees=star_data['dec_degrees'])
        name = f"HIP {hip_id}"
        
        astrometric = observer.at(t).observe(star)
        alt, az, distance = astrometric.apparent().altaz()
        if(alt.degrees < 0):
            if(any(body.name == name.capitalize() for body in celestial_bodies)):
                celestial_bodies = [body for body in celestial_bodies if body.name != name]
            continue  # Skip bodies below the horizon

        count += 1
        if(celestial_bodies):
            if(any(body.name == name for body in celestial_bodies)):
                continue  # Skip if already in the list
        
        newBody = CelestialBody(
            name=f"HIP {hip_id}",
            magnitude=star_data['magnitude'],
            position={"alt": alt.degrees, "az": az.degrees, "distance_au": distance.au}
        )       
        celestial_bodies.append(newBody)
        added_count += 1

    for name, body in targets.items():
        # Calculate magnitude as seen from Earth
        astrometric = observer.at(t).observe(body)
        # Compute the magnitude
        magnitude = float(planetary_magnitude(astrometric))
        alt, az, distance = astrometric.apparent().altaz()
        #print(f"alt: {alt}, az: {az}, distance: {distance} \n")
        if(alt.degrees < 0):
            if(any(body.name == name for body in celestial_bodies)):
                celestial_bodies = [body for body in celestial_bodies if body.name != name]
            continue  # Skip bodies below the horizon

        count += 1
        if(celestial_bodies):
            if(any(body.name == name.capitalize() for body in celestial_bodies)):
                continue  # Skip if already in the list

        newBody = CelestialBody(
            name=name.capitalize(),
            magnitude=magnitude,
            position={"alt": alt.degrees, "az": az.degrees, "distance_au": distance.au}
        )
        if(newBody not in celestial_bodies):
            celestial_bodies.append(newBody)
        
        added_count += 1


    celestial_bodies.sort(key=lambda body: body.magnitude)
    
    data = {
        "count": count,
        "added_count": added_count
    }
    return send_res(200, data, "Zoomed out.")
    

@app.get("/zoom-in")
def zoom_in(new_magnitude: float=0.0):
    global celestial_bodies
    global old_magnitude

    if(request.args.get('new_magnitude')):
        new_magnitude = float(request.args.get('new_magnitude'))
    else:
        response = make_response(jsonify({"message": "new_magnitude parameter is required."}), 400)
        return response
    
    if(old_magnitude <= new_magnitude):
        response = make_response(jsonify({"message": "new_magnitude must be less than old_magnitude."}), 400)
        return response
    
    old_count = celestial_bodies.__len__()
    # Logic to remove celestial bodies with magnitude greater than new_magnitude
    new_celestial_bodies = [body for body in celestial_bodies if body.magnitude <= new_magnitude]
    celestial_bodies.clear()

    new_count = new_celestial_bodies.__len__()
    old_magnitude = new_magnitude

    celestial_bodies = new_celestial_bodies.copy()

    data = {
        "old_count": old_count,
        "count": new_count
    }
    return send_res(200, data, "Narrowed in.")

def send_res(status_code, data: object, message):
    if(status_code < 1):
        status_code = 500
    
    response = make_response(jsonify({"data": {}, "message": message}), status_code)
    
    if(data):
        response = make_response(jsonify({"data": data, "message": message}), status_code)
    
    
    return response

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001)
