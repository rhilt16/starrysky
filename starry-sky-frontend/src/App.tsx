import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import axios, { Axios } from 'axios'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [position, setPosition] = useState({ longitude: '', latitude: '', magnitude: '', elevation: '' })

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
    const response = await axios.get(fullUrl);

    if(!response.data){
      console.error('No data received from server');
      return;
    }
    alert('Received ' + response.data.names.length + ' celestial bodies from server, ' + "and added " + response.data.added_count + " new bodies.");
    console.log('Response data:', response.data);
  }

  return (
    <>
      <div>
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
                    placeholder="Longitude N"
                    value={position.longitude}
                    onChange={e => setPosition({ ...position, longitude: e.target.value })}
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
                    placeholder="Latitude W"
                    value={position.latitude}
                    onChange={e => setPosition({ ...position, latitude: e.target.value })}
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
                    placeholder="20.0"
                    value={position.elevation}
                    onChange={e => setPosition({ ...position, elevation: e.target.value })}
                    required
                  />
                </td>
              </tr>

              <tr style={{height: '40px'}}>
                <td style={{width: '100px'}}>
                  <label className="form-label">Magnitude</label>
                </td>
                <td style={{width: '60px', paddingLeft: '20px'}}>
                  <input
                    type="text"
                    style={{fontSize: '20px'}}
                    className="form-control"
                    placeholder="20.0"
                    value={position.magnitude}
                    onChange={e => setPosition({ ...position, magnitude: e.target.value })}
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

    </>
  )
}

export default App
