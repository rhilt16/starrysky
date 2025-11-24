import { useState, type CSSProperties, useEffect, type ReactEventHandler } from 'react'
import { ClipLoader } from "react-spinners";
import LoadingBar from "react-top-loading-bar";
import { ApiFactory } from './api/ApiFactory';
import './App.css'
import { DEFAULT_API_CONFIG } from './config';
import { AxiosError, isAxiosError } from 'axios';
import type { CelestialBodiesSchema } from './api/services/MainService';
import { ScatterChart, type ScatterChartProps } from '@mui/x-charts/ScatterChart';


function App() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ longitude: "-33.8688", latitude: "151.2093", magnitude: '3.0', elevation: '20.0' })
  const [oldMagnitude, setOldMagnitude] = useState('3.0');
  const [loadProgress, setLoadProgress] = useState(0);
  const [formVisibility, setFormVisibility] = useState(true);
  const [bodies_array, setBodies_array] = useState<CelestialBodiesSchema[]>([])
  const [buckets_a, setBuckets] = useState<Record<number, CelestialBodiesSchema[]>>([])
  const [maxMag, setMaxMag] = useState<number>(0)

  interface ChartValue {
    x: Number
    y: Number
    z: Number
    id: String
  }

  const api = new ApiFactory(DEFAULT_API_CONFIG);

  const [colors, setColors] = useState([
    { bgColor: '#000000' },
    { borderColor: '#444444' },
    { loadingColor: '#edff9eff' },
    { textColor: '#FFFFFF' },
    { starColor: '#FFFFFF' },
    { constellationColor: '#FFDD00' }
  ])

  useEffect(() => {
    async function initialSky(){
      try {
        const magnitude: number = 3;
        let initialCount: number = await checkCount(magnitude);
        if(initialCount === -1) {
          setCount(-1)
          return;
        }
        
        const delay:  number = initialCount; // Simulated delay based on count difference
        console.log('waiting for about ' + delay + ' ms');

        moveLoadBar(delay);
        setLoading(true);

        const response = await api.main.getSky('');
        
        setLoading(false);
        setOldMagnitude(position.magnitude);

        if(!response.data){
          console.error("Error fetching initial sky");
          return;
        }

        setCount(response.data.count);
        await get_bodies(false)
        return;

      } catch (error) {
        console.error("Error setting initial count");
      }

    }

    initialSky()
  }, []);

  useEffect(() => {
    setCount(bodies_array.length);
  }, [bodies_array]);

  useEffect(() => {
    show_bodies();
  }, [bodies_array]); 


  let override: CSSProperties = {
    display: "block",
    margin: "0 auto",
    borderColor: colors[2].loadingColor,
  };

  useEffect(() => {
    override.borderColor = colors[2].loadingColor;
  }, [colors[2].loadingColor]);

  
  

  async function handlePositionSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      let longitude: number = parseFloat(position.longitude);
      let latitude: number = parseFloat(position.latitude);
      let magnitude: number = parseFloat(position.magnitude);
      let elevation: number = parseFloat(position.elevation);

      let queryParams: string[] = [];

      if(!isNaN(longitude)) {
        queryParams.push(`loc_N=${longitude}`);
      }
      if(!isNaN(latitude)) {
        queryParams.push(`loc_W=${latitude}`);
      }
      if(!isNaN(magnitude)) {
        queryParams.push(`min_magnitude=${magnitude}`);
      }
      if(!isNaN(elevation)) {
        queryParams.push(`elevation=${elevation}`);
      }

      console.log('Request URL:', queryParams.join('&'));
      let newCount: number = await checkCount(magnitude);

      moveLoadBar(newCount * 5);
      setLoading(true);
      const response = await api.main.getSky(queryParams.join('&'))
      setLoading(false);

      if(!response.data){
        console.error('No data received from server');
        return;
      }
      setCount(response.data.count);
      await get_bodies(false)
      //alert('Received ' + response.data.count + ' celestial bodies from server, ' + "and added " + response.data.added_count + " new bodies.");
      console.log('Response data:', response.data);
    } catch (err: unknown) {
      if(isAxiosError(err)){
        if(err.code === "ECONNABORTED"){
          console.log("timeout lol");
        }
      }
    }
  }

  async function changeMagnitude(e: React.FormEvent) {
    e.preventDefault()
    try {

      let magnitude: number = parseFloat(position.magnitude);

      if(isNaN(magnitude)) {
        alert('Please enter a valid magnitude');
        return;
      }
      if(magnitude === parseFloat(oldMagnitude)) {
        return;
      }
      let newCount: number = await checkCount(magnitude);
      if(newCount === -1) {
        alert('Error checking count');
        return;
      }
      const difference: number = Math.abs(newCount - count);
      
      
      moveLoadBar(difference);
      setLoading(true);
    
      if(magnitude < parseFloat(oldMagnitude)) {
        const response = await api.main.zoomIn(magnitude);
        if(!response.data){
          return;
        }
        setCount(response.data.count)
        await get_bodies(true)
     
      } else if(magnitude > parseFloat(oldMagnitude)) {
        const response = await api.main.zoomOut(magnitude);
        if(!response.data){
          return;
        }
        setCount(response.data.count)
        await get_bodies(false)
      }

      setLoading(false);
      setOldMagnitude(position.magnitude);
      

    } catch (error) {
      if(isAxiosError(error)){
        if(error.code === "ECONNABORTED"){
          console.log("timeout lol");
        }
      } else {
        console.error(error);
      }
      
      setLoading(false);
    }
    
  }

  async function checkCount(min_magnitude: number) {
    try {

      const response = await api.main.getCount(min_magnitude);
      if(!response.data){
        console.error('No data received from server');
        return -1;
      }

      return response.data.count;
    } catch (err: unknown) {
      
      if(err instanceof AxiosError){
        if(err.code === 'ERR_NETWORK'){
          console.error("Error connecting to API using axios");
        }
      } 
      
      return -1;

    }
    
  }

  async function get_bodies(isZoomingIn: boolean){
    try {
      const res = await api.main.getBodies();

      if(!res.data){
        return;
      }
      if(!isZoomingIn){
        setBodies_array(prevBodies => {
          if(!res.data){
            return prevBodies;
          }
          if (prevBodies.length === 0) {
              // first-time load
              return res.data.bodies
          }

        
          const newBodies = res.data.bodies.filter(
              body => !prevBodies.some(existing => existing.name === body.name)
          );

          return [...prevBodies, ...newBodies];
        });
      } else {
        setBodies_array(prevBodies => {
          if(!res.data){
            return prevBodies;
          }
          
          return res.data.bodies
         
        });
      }
      

      
    } catch (err: unknown) {
      console.error(err);
    }
  }  

  async function show_bodies(){
    try {

      if(formVisibility){

        bodies_array.sort((a, b) => a.magnitude - b.magnitude);

        let highest = -Infinity;
        let lowest = Infinity;

        bodies_array.forEach(body => {
          if (body.magnitude < lowest) lowest = body.magnitude;
          if (body.magnitude > highest) highest = body.magnitude;
        });

        const difference = Math.round(highest - lowest);

        const buckets: Record<number, typeof bodies_array> = {};

        for (let i = 0; i <= difference; i++) {
          buckets[i] = [];
        }

        bodies_array.forEach(body => {
          const bucketIndex = Math.floor(body.magnitude - lowest);
          buckets[bucketIndex].push(body);
        });

        setMaxMag(highest);

        const nonEmptyBuckets = Object.values(buckets).filter(
          (bucket) => bucket.length > 0
        );
        setBuckets(nonEmptyBuckets)
      }
      
    } catch (err: unknown) {
      console.error(err);
    }

  }

  function calcMagSize(magnitude: number) {
    const rounded: number = Math.round(magnitude)
    const scale = 2.5

    const base = 1

    let size = base

    for (let index = 0; index < Math.abs(rounded); index++) {
      if(rounded < 1){
        size = (size * scale)
      } else {
        size = (size / scale)
      }
    }

    return Number(size)
    
  }
  function moveLoadBar(loadingTime: number) {
    setLoadProgress(0);

    for (let i = 0; i <= 100; i++) {
      setTimeout(() => {
        setLoadProgress(i);
      }, (Math.pow(loadingTime, 1.5) / 100) * i);
    }
    return;
  }

  const valueFormatter = (value: any) => {
    if (value === null) return '';
    console.log(value.id)
    return value.id as string;
  }


  return (
    <>
      <div style={{backgroundColor: colors[0].bgColor, minHeight: '100vh', minWidth: '100vw'}}>
        {loading && (
          <div className="sweet-loading" style={{alignContent:"center", marginTop: "auto"}}>
            <LoadingBar
              color={colors[2].loadingColor}
              progress={loadProgress}
              onLoaderFinished={() => setLoadProgress(0)}
            />

            <ClipLoader
              color={colors[2].loadingColor}
              loading={loading}
              cssOverride={override}
              size={150}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          </div>
        )}
        {!loading && (
        <div>
          <button type="button" 
            onClick={(e) => setFormVisibility(!formVisibility)}>
            {formVisibility ? "Hide" : "Show"}
          </button>

          {formVisibility && (
          <div style = {{position: 'fixed', backgroundColor: 'black', zIndex: '1000', minWidth: '30%', borderStyle: 'solid', borderWidth: '2px', borderColor: 'whitesmoke'}}>
          {count > 0 && (
            
          <div className="text-center my-4" style={{width: '50%', marginLeft: '25%', color: colors[3].textColor}}>
            <form onSubmit={changeMagnitude} className="p-3 border rounded bg-light">
              <label className="form-label" style={{fontSize: '24px', fontWeight: 'bold'}}>Minimum Magnitude:  </label>
              <input
                type="number"
                style={{fontSize: '20px'}}
                className="form-control"
                value={position.magnitude}
                min='1.0'
                max='10.0'
                step='0.1'
                onChange={e => setPosition({ ...position, magnitude: e.target.value })}
              />
              <button type="submit" className="btn btn-primary px-4 mt-3" style={{color: colors[3].textColor, backgroundColor: colors[0].bgColor}}>Submit</button>
            </form>

          </div>
          )}
          <form onSubmit={handlePositionSubmit} className="p-3 border rounded bg-light">
            <table className="table p-4 w-50 mx-auto" style={{marginLeft: '20%', fontSize: '20px', color: colors[3].textColor}}>
              <thead>
                <tr style={{height: '40px', width: '200px'}}>
                  <th scope="col">Input Name</th>
                  <th scope="col">Input Value</th>
                </tr>
              </thead>
              <tbody>

                <tr style={{height: '40px'}}>
                  <td style={{width: '100px'}}>
                    <label className="form-label">Longitude N</label>
                  </td>
                  <td style={{width: '60px', paddingLeft: '20px'}}>
                    <input
                      type="text"
                      style={{fontSize: '20px', color: colors[3].textColor}}
                      className="form-control"
                      value={position.longitude}
                      onChange={e => setPosition({ ...position, longitude: e.target.value })}
                      defaultValue={"-33.8688"}
                      required
                    />
                  </td>
                </tr>

                <tr style={{height: '40px'}}>
                  <td style={{width: '100px'}}>
                    <label className="form-label">Latitude W</label>
                  </td>
                  <td style={{width: '60px', paddingLeft: '20px'}}>
                    <input
                      type="text"
                      style={{fontSize: '20px', color: colors[3].textColor}}
                      className="form-control"
                      value={position.latitude}
                      onChange={e => setPosition({ ...position, latitude: e.target.value })}
                      defaultValue={"151.2093"}
                      required
                    />
                  </td>
                </tr>

                <tr style={{height: '40px'}}>
                  <td style={{width: '100px'}}>
                    <label className="form-label">Elevation (M)</label>
                  </td>
                  <td style={{width: '60px', paddingLeft: '20px'}}>
                    <input
                      type="text"
                      style={{fontSize: '20px', color: colors[3].textColor}}
                      className="form-control"
                      defaultValue={"20.0"}
                      value={position.elevation}
                      onChange={e => setPosition({ ...position, elevation: e.target.value })}
                      required
                    />
                  </td>
                </tr>
              </tbody>
              <div className="text-center mt-4">
                <button type="submit" className="btn btn-primary px-4" style={{color: colors[3].textColor, backgroundColor: colors[0].bgColor}}>
                  Submit
                </button>
              </div>
              
            </table>
          </form>
          </div>
          )}
          {((buckets_a)) && (
            <ScatterChart
              height={window.screen.height}
              width={window.screen.width}
              voronoiMaxRadius={50}
              series={Object.entries(buckets_a).map(([key, bucket]) => ({
                
                highlightScope: {
                  highlight: 'item', fade: 'none'
                },
                data: bucket.map(v => ({
                  x: Number(v.position.alt),
                  y: Number(v.position.az),
                  z: Number(v.magnitude),
                  id: v.name,
                })),
                valueFormatter,
                

                
                markerSize: calcMagSize(bucket[0].magnitude),
               
              }))}
              
              
              zAxis={[{
                colorMap: {
                  type: 'continuous',
                  min: -10,
                  max: maxMag,
                  color: ['white', 'gold']
                }
              }]}
              xAxis={[{position: 'none'},
                
              ]}
              yAxis={[{position: 'none'}]}
               
            />
          )}
        </div>
        )}
      </div>
      


    </>
  )
}

export default App
