import { useState, CSSProperties } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import axios, { Axios } from 'axios'
import { ClipLoader } from "react-spinners";
import './App.css'

const override: CSSProperties = {
  display: "block",
  margin: "0 auto",
  borderColor: "red",
};

function App() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [position, setPosition] = useState({ longitude: "-33.8688", latitude: "151.2093", magnitude: '3.0', elevation: '20.0' })
  const [oldMagnitude, setOldMagnitude] = useState('3.0');

  

  async function handlePositionSubmit(e: React.FormEvent) {
    e.preventDefault()
    let longitude: number = parseFloat(position.longitude);
    let latitude: number = parseFloat(position.latitude);
    let magnitude: number = parseFloat(position.magnitude);
    let elevation: number = parseFloat(position.elevation);

    const url: string = `http://127.0.0.1:5001/sky?`;
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

    const fullUrl: string = url + queryParams.join('&');
    console.log('Request URL:', fullUrl);
    setLoading(true);
    const response = await axios.get(fullUrl);
    setLoading(false);

    if(!response.data){
      console.error('No data received from server');
      return;
    }
    console.log(response.data);
    //alert('Received ' + response.data.count + ' celestial bodies from server, ' + "and added " + response.data.added_count + " new bodies.");
    console.log('Response data:', response.data);
  }

  async function changeMagnitude(e: React.FormEvent) {
    e.preventDefault()
    let magnitude: number = parseFloat(position.magnitude);

    if(isNaN(magnitude)) {
      alert('Please enter a valid magnitude');
      return;
    }
    if(magnitude === parseFloat(oldMagnitude)) {
      return;
    }
    setLoading(true);
    let url: string; 
    if(magnitude < parseFloat(oldMagnitude)) {
      url = `http://127.0.0.1:5001/zoom-in?new_magnitude=${magnitude}`;
    } else if(magnitude > parseFloat(oldMagnitude)) {
      url = `http://127.0.0.1:5001/zoom-out?new_magnitude=${magnitude}`;
    }
    setLoading(false);
    setOldMagnitude(position.magnitude);

    const response = await axios.get(url!);
    if(!response.data){
      console.error('No data received from server');
      return;
    }
    console.log(response.data);
    
  }
  return (
    <>
      <div>
        {loading && (
          <div className="sweet-loading">
            <ClipLoader
              color={color}
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
          <div className="text-center my-4" style={{width: '50%', marginLeft: '25%'}}>
            <form onSubmit={changeMagnitude} className="p-3 border rounded bg-light">
              <label className="form-label" style={{fontSize: '24px', fontWeight: 'bold'}}>Minimum Magnitude</label>
              <input
                type="text"
                style={{fontSize: '20px'}}
                className="form-control"
                defaultValue={"20.0"}
                value={position.magnitude}
                onChange={e => setPosition({ ...position, magnitude: e.target.value })}
              />
              <button type="submit" className="btn btn-primary px-4 mt-3">Submit</button>
            </form>

          </div>
          <form onSubmit={handlePositionSubmit} className="p-3 border rounded bg-light">
            <table className="table p-4 w-50 mx-auto" style={{marginLeft: '20%', fontSize: '20px'}}>
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
                      style={{fontSize: '20px'}}
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
                      style={{fontSize: '20px'}}
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
                      style={{fontSize: '20px'}}
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
                <button type="submit" className="btn btn-primary px-4">
                  Submit
                </button>
              </div>
              
            </table>
          </form>
        </div>
        )}
      </div>
      


    </>
  )
}

export default App
