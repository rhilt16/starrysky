import type { ApiClient } from "../ApiClient";
import { z } from 'zod';

const ZoomResponseSchemaVal = z.object({
    count: z.number(),
    added_count: z.number(),
    message: z.string(),
});

const CelestialBodiesPositionVal = z.object({
    alt: z.string(),
    az: z.string(),
    degrees: z.string(),
    distance_au: z.number(),
});

const CelestialBodiesSchemaVal = z.object({
    name: z.string(),
    magnitude: z.number(),
    position: CelestialBodiesPositionVal
})

export interface ZoomResponseSchema {
    count: number;
    added_count: number;
    message: string;
}

export interface CelestialBodiesPosition {
    alt: number;
    az: number;
    degrees: string;
    distance_au: number;
}

export interface CelestialBodiesSchema {
    name: string;
    cata_names: string[];
    ID: string[];
    magnitude: number;
    constellation: string;
    position: CelestialBodiesPosition;
}

export interface CelestialBodiesResponse {
    names: string[];
    bodies: CelestialBodiesSchema[];
}

interface APIResponse<T = unknown> {
  data?: T;
  message: string;
}



export class MainService {
    private api: ApiClient;

    constructor(api: ApiClient){
        this.api = api;
    }

    // GET /stars 
    // params: loc_W, loc_N, min_magnitude, loc_elev
    getSky(params: string){
        return this.api.get<APIResponse<ZoomResponseSchema>>(`/sky?${params}`)
    }

    zoomOut(min_magnitude: number){
        return this.api.get<APIResponse<ZoomResponseSchema>>(`/zoom-out?new_magnitude=${min_magnitude}`);
    }

    zoomIn(min_magnitude: number){
        return this.api.get<APIResponse<ZoomResponseSchema>>(`/zoom-in?new_magnitude=${min_magnitude}`);
    }

    getCount(min_magnitude: number){
        return this.api.get<APIResponse<{ count: number }>>(`/count?min_magnitude=${min_magnitude}`);
    }

    getBodies(){
        return this.api.get<APIResponse<CelestialBodiesResponse>>(`/celestial-bodies`)
    }

}
