from skyfield.api import Star, load, wgs84, N, E, W, S
from skyfield.data import hipparcos
from skyfield.magnitudelib import planetary_magnitude
import csv
import pandas as pd
from math import sin, cos, radians, degrees



def load_datasets():
    with load.open("data/hip_main.dat") as f:
        df = hipparcos.load_dataframe(f)
    print(f"Loaded {len(df)} stars from Hipparcos catalog.")

    df = df[df['ra_degrees'].notnull()]

    planets = load('de405.bsp')

    targets = {
        "mercury": planets["mercury"],
        "venus": planets["venus"],
        "mars": planets["mars"],
        "jupiter": planets["jupiter barycenter"],
        "saturn": planets["saturn barycenter"],
        "uranus": planets["uranus barycenter"],
        "neptune": planets["neptune barycenter"]
    }

    sun = planets['sun']
    earth = planets['earth']
    observer = earth + wgs84.latlon(-33.8688 * N, 151.2093 * W, elevation_m=43)

    
    read_df = pd.read_csv('data/star_names.csv')
    star_names_df = read_df[["proper names", "HIP", "Constellation"]]
    star_names_df = star_names_df[star_names_df["HIP"].notnull()]
    star_names_df["HIP"] = star_names_df["HIP"].astype(int)
    star_names_df["HIP"] = star_names_df["HIP"].astype(str)

    id_to_names = {}
    id_to_common_name = {}

    with open('data/ident4.txt', "r", encoding="utf-8") as file:
        content =  file.read()
        names_array = content.splitlines()
        for name in names_array:
            row = name.split("|")
            name = row[0].strip()
            name = name.strip("\ufeff")
            id = row[1].strip()

            if(id in id_to_names):
                prev = id_to_names[id]
                if isinstance(prev, list):
                    prev.append(name)
                    id_to_names[id] = prev
                else:
                    names = [prev, name]
                    id_to_names[id] = names
            else:
                id_to_names[id] = name

        for key in targets:
            key = key.capitalize()
            id_to_names[key] = key
        
        for index, rows in star_names_df.iterrows():
            name = rows["proper names"]
            id = rows["HIP"]
            constellation = rows["Constellation"]
            
            id_to_common_name[id] = [name, constellation]
            
    print(id_to_common_name)
    return df, planets, star_names_df, id_to_names, targets, earth, observer, id_to_common_name
    