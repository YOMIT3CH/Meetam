import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { MeetAmProvider } from './context/MeetAmContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <MeetAmProvider>
      <App />
    </MeetAmProvider>
  </React.StrictMode>,
)

