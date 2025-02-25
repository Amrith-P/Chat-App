import React from 'react'
import Login from './components/Login'
import {Navlinks} from './components/NavLinks'  
// import Register from './components/Register'
// import Chatbox from './components/Chatbox'
// import Chatlist from './components/Chatlist'

const App = () => {
  return (
    <div>
      {/* <div className='flex lg:flex-row flex-col items-start w-[100%]'>
      <Navlinks/>
      <Chatlist/>
      <Chatbox/>
      </div>
      
      <div className='hidden'>
      <Register/>
      <Login/>
      </div> */}
      <Login/>
    </div>
  )
}

export default App