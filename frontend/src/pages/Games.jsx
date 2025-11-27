import React from 'react'
import Flames from "../assets/images/svgs/flames.svg";

const Games = () => {
  return (
    <div>
         <div>
                <div className="fixed bottom-0 left-0 w-full h-64 z-0">
                     <img
                       src={Flames}
                       alt="background"
                       className="w-full h-full object-cover"
                     />
                   </div>
                  
          </div>
    </div>
  )
}

export default Games