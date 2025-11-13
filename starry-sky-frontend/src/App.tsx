import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import axios from 'axios'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [position, setPosition] = useState({ longitude: '', latitude: '' })

  const handlePositionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submitted position:', position)
    // Here you can add logic to handle the submitted position

  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="test-form container mt-4">
        <form onSubmit={handlePositionSubmit} className="p-3 border rounded bg-light">
          
          <div className="mb-3 row align-items-center">
            <label className="col-sm-4 col-form-label text-sm-end">Longitude N</label>
            <div className="col-sm-8">
              <input
                type="text"
                className="form-control"
                placeholder="Longitude N"
                value={position.longitude}
                onChange={e => setPosition({ ...position, longitude: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-3 row align-items-center">
            <label className="col-sm-4 col-form-label text-sm-end">Latitude E</label>
            <div className="col-sm-8">
              <input
                type="text"
                className="form-control"
                placeholder="Latitude E"
                value={position.latitude}
                onChange={e => setPosition({ ...position, latitude: e.target.value })}
              />
            </div>
          </div>

          <div className="text-center mt-4">
            <button type="submit" className="btn btn-primary px-4">
              Submit
            </button>
          </div>

        </form>
      </div>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
