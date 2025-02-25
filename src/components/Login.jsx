import React,{useState} from 'react'
import { FaSignInAlt } from "react-icons/fa";
const Login = () => {
   const [userData, setUserData] = useState({
      
      email: "",
      password: "",
    });
    const handleChangeUserData = (e) => {
    const{name,value}=e.target;
    setUserData((prevState)=>({...prevState,[name]:value}));
  
    }
    const handleAuth=async()=>{
      try{
        alert("Login Successful");
      } catch (error){
        console.log(error);
      }
    }

  return (
    <section className="flex flex-col justify-center items-center h-[100vh] w-[100%] background-image ">
          <div className="bg-white shadow-lg p-5 rounded-xl h-[30rem] w-[21rem] flex flex-col justify-center items-center">
            <div className="mb-10 ">
              <h1 className="text-center text-[28px] font-bold">Sign In</h1>
              <p className="text-center text-sm text-gray-400">
                Welcome back, Login to continue
              </p>
            </div>
            <div className="w-full">
              
              <input
                type="text"
                name='email'
                onChange={handleChangeUserData}
                className="border border-green-200 w-full p-2 rounded-md bg-[#01aa851d] text-[#004939f3] mb-3 font-medium outline-none"
                placeholder="Email"
              />
              <input
            type="text"
            name='password'
            onChange={handleChangeUserData}
            className="border border-green-200 w-full p-2 rounded-md bg-[#01aa851d] text-[#004939f3] mb-3 font-medium outline-none"
            placeholder="Password"
          />
              
            </div>
            <div className="w-full">
              <button onClick={handleAuth} className="bg-[#01aa85] text-white font-bold w-full p-2 rounded-md flex items-center gap-2 justify-center ">
                Login <FaSignInAlt/>
              </button>
            </div>
            <div className="mt-5 text-center text-gray-400 text-sm">
                
                <button> 
                Don't have an account? Register
                </button>
            </div>
          </div>
        </section>
  )
}

export default Login