import React from 'react'
const logo="assets/logo.jpg"
function NavLinks() {
  return (
    <section className='sticky lg:static top-0 flex items-center lg:items-start lg:justify-start h-[7vh] h-[7vh] lg:h-[100vh] w-[100%] lg:w-[150px] py-8 lg:py-0 bg-[#01aa85]'>
      <main className='flex lg:flex-col item-center lg:gap-10 justify-between lg:px-0 w-[100%]'>
        <div className='flext items-start justify-center lg:border-b border-b-1 border-gray-100 lg:w-[100%] p-4'>
          <span className='flex items-center justify-center '><img className='w-[56px] h-[56px] object-contain rounded-full ' src={logo} alt="Logo" />


          </span>
        </div>
      </main>
    </section>
  )
}

export default NavLinks